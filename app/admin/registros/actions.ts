'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { logStatusChange } from '@/lib/orders/status-log';
import { fulfillPaidOrder, type FulfillableOrder } from '@/lib/orders/fulfill';
import { generateOrderReference } from '@/lib/wompi/signatures';

/**
 * Registro de personas en tiers internos (Staff, Speaker) desde
 * /admin/registros. Un admin llena el formulario y por dentro se procesa
 * EXACTAMENTE igual que cualquier otra venta pagada: nace como orden en
 * estado 'paid' con payment_method 'cortesia', queda en la bitácora de
 * cambios de estado y corre fulfillPaidOrder (boleta + QR + InContacto),
 * el mismo camino que usa el webhook de Wompi y /admin/orders.
 */

export type RegistroActionResult =
  | { ok: true; message: string; orderId: string; warnings?: string[] }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function assertAdmin(): Promise<{ id: string; email: string }> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/registros');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/?error=unauthorized');
  return { id: user.id, email: user.email ?? '' };
}

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim();
}

export async function registerInternal(
  _prev: RegistroActionResult | null,
  form: FormData
): Promise<RegistroActionResult> {
  const admin = await assertAdmin();

  const tierSlug = str(form, 'tier_slug');
  const buyer = {
    name: str(form, 'buyer_name'),
    email: str(form, 'buyer_email').toLowerCase(),
    phone: str(form, 'buyer_phone'),
    docType: str(form, 'buyer_doc_type') || 'CC',
    docNumber: str(form, 'buyer_doc_number'),
    company: str(form, 'buyer_company'),
    position: str(form, 'buyer_position'),
    linkedin: str(form, 'buyer_linkedin')
  };
  const note = str(form, 'note').slice(0, 1000);

  const fieldErrors: Record<string, string> = {};
  if (!tierSlug) fieldErrors.tier_slug = 'Elige una categoría';
  if (!buyer.name) fieldErrors.buyer_name = 'Nombre requerido';
  if (!buyer.email) fieldErrors.buyer_email = 'Correo requerido';
  if (!buyer.docNumber) {
    // InContacto deduplica por documento: sin esto el registro nunca llega.
    fieldErrors.buyer_doc_number = 'Número de documento requerido';
  }
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: 'Revisa los campos', fieldErrors };
  }

  const sb = createServiceClient();

  // El tier debe existir, estar activo y ser admin_only: esta pantalla no
  // es un checkout alterno para tiers públicos.
  const { data: tier } = await sb
    .from('ticket_tiers')
    .select('slug, name_es, active, admin_only, price_cop')
    .eq('slug', tierSlug)
    .maybeSingle();

  if (!tier) {
    return { ok: false, message: 'La categoría elegida no existe' };
  }
  if (!tier.admin_only) {
    return {
      ok: false,
      message: 'Esta categoría no es de uso interno. Usa /admin/tiers para tiers públicos.'
    };
  }
  if (!tier.active) {
    return { ok: false, message: 'Esta categoría está inactiva. Actívala en /admin/tiers.' };
  }

  const reference = generateOrderReference('LSUMMIT26-INT');
  const price = tier.price_cop ?? 0;

  const orderRow = {
    user_id: null,
    ticket_tier: tier.slug,
    subtotal_cop: price,
    discount_cop: 0,
    total_cop: price,
    coupon_code: null,
    status: 'paid',
    paid_at: new Date().toISOString(),
    payment_method: 'cortesia',
    payment_reference: reference,
    buyer_name: buyer.name,
    buyer_email: buyer.email,
    buyer_phone: buyer.phone || null,
    buyer_doc_type: buyer.docType,
    buyer_doc_number: buyer.docNumber,
    buyer_company: buyer.company || null,
    buyer_position: buyer.position || null,
    buyer_linkedin: buyer.linkedin || null,
    // Facturación = comprador: un registro interno no factura aparte.
    billing_same: true,
    billing_name: buyer.name,
    billing_doc_type: buyer.docType,
    billing_doc_number: buyer.docNumber,
    billing_email: buyer.email,
    billing_address: null
  };

  const { data: order, error: insertErr } = await sb
    .from('orders')
    .insert(orderRow)
    .select('*')
    .single();

  if (insertErr || !order) {
    return {
      ok: false,
      message: `No se pudo crear el registro: ${insertErr?.message ?? 'error desconocido'}`
    };
  }

  await logStatusChange(sb, {
    orderId: order.id,
    fromStatus: null,
    toStatus: 'paid',
    reason: 'cortesia',
    note: `Registro interno desde admin: ${tier.name_es}${note ? ` — ${note}` : ''}`,
    changedBy: admin.id,
    changedByEmail: admin.email,
    source: 'admin'
  });

  const result = await fulfillPaidOrder(sb, order as FulfillableOrder);

  const partes: string[] = [];
  partes.push(result.ticketAlreadyExisted ? 'la boleta ya existía' : 'boleta emitida');
  if (result.incontacto === 'sent') {
    partes.push('registrado en InContacto');
  } else if (result.incontacto === 'error') {
    partes.push('InContacto falló (se puede reintentar desde el detalle de la venta)');
  } else {
    partes.push('InContacto omitido');
  }

  revalidatePath('/admin/registros');
  revalidatePath('/admin/orders');
  revalidatePath('/admin/incontacto');

  return {
    ok: true,
    message: `${buyer.name} quedó registrado como ${tier.name_es}: ${partes.join(', ')}.`,
    orderId: order.id,
    warnings: result.warnings
  };
}
