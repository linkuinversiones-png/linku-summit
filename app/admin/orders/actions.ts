'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  ADMIN_REASONS,
  REASON_TO_PAYMENT_METHOD,
  logStatusChange
} from '@/lib/orders/status-log';
import {
  fulfillPaidOrder,
  syncOrderToIncontacto,
  getTierName,
  type FulfillableOrder
} from '@/lib/orders/fulfill';

/**
 * Acciones del admin de ventas.
 *
 * Seguridad: todas verifican admin contra la sesión del request antes de
 * tocar datos con el service client. El estado de una venta es dinero, así
 * que cada cambio queda en order_status_log con quién y por qué.
 */

export type OrderActionResult =
  | { ok: true; message: string; warnings?: string[] }
  | { ok: false; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUSES = new Set(['pending', 'paid', 'failed', 'refunded', 'expired']);

/** Estados desde los que tiene sentido marcar una venta como pagada. */
const PRE_PAYMENT = new Set(['pending', 'failed', 'expired']);

async function assertAdmin(): Promise<{ id: string; email: string }> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/orders');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/?error=unauthorized');
  return { id: user.id, email: user.email ?? '' };
}

function fail(message: string): OrderActionResult {
  return { ok: false, message };
}

/**
 * Cambia el estado de una venta dejando constancia del motivo.
 *
 * Si el destino es 'paid', además corre la entrega completa: emite la
 * boleta con QR, descuenta cupo, registra al asistente en InContacto y
 * manda el correo. Es el mismo camino que usa el webhook de Wompi, así que
 * una cortesía marcada a mano recibe exactamente lo mismo que una compra.
 */
export async function changeOrderStatus(input: {
  orderId: string;
  toStatus: string;
  reason: string;
  note?: string;
}): Promise<OrderActionResult> {
  const admin = await assertAdmin();

  if (!UUID_RE.test(input.orderId)) return fail('Id de orden inválido');
  const toStatus = String(input.toStatus ?? '').trim();
  if (!STATUSES.has(toStatus)) return fail(`Estado inválido: ${toStatus}`);
  const reason = String(input.reason ?? '').trim();
  if (!ADMIN_REASONS.has(reason)) {
    return fail('Elige un motivo para el cambio de estado');
  }
  const note = String(input.note ?? '').trim().slice(0, 1000);
  if (reason === 'otro' && !note) {
    return fail('Con el motivo "Otro" hay que escribir una explicación');
  }

  const sb = createServiceClient();
  const { data: order, error } = await sb
    .from('orders')
    .select('*')
    .eq('id', input.orderId)
    .maybeSingle();
  if (error || !order) return fail('No se encontró la venta');

  const fromStatus = order.status as string;
  if (fromStatus === toStatus) {
    return fail(`La venta ya está en estado "${toStatus}"`);
  }
  if (toStatus === 'paid' && !PRE_PAYMENT.has(fromStatus)) {
    return fail(
      `No se puede pasar de "${fromStatus}" a pagada. Solo desde pendiente, fallida o expirada.`
    );
  }

  const patch: Record<string, unknown> = { status: toStatus };
  if (toStatus === 'paid') {
    patch.paid_at = order.paid_at ?? new Date().toISOString();
    const method = REASON_TO_PAYMENT_METHOD[reason];
    if (method) patch.payment_method = method;
  }

  const { error: updErr } = await sb.from('orders').update(patch).eq('id', order.id);
  if (updErr) return fail(`No se pudo actualizar la venta: ${updErr.message}`);

  await logStatusChange(sb, {
    orderId: order.id,
    fromStatus,
    toStatus,
    reason,
    note: note || null,
    changedBy: admin.id,
    changedByEmail: admin.email,
    source: 'admin'
  });

  let warnings: string[] = [];
  let message = `Venta movida de "${fromStatus}" a "${toStatus}".`;

  if (toStatus === 'paid') {
    const result = await fulfillPaidOrder(sb, order as FulfillableOrder);
    warnings = result.warnings;
    const partes: string[] = [];
    partes.push(result.ticketAlreadyExisted ? 'la boleta ya existía' : 'boleta emitida');
    partes.push(
      result.incontacto === 'sent'
        ? 'registrado en InContacto'
        : result.incontacto === 'error'
          ? 'InContacto falló'
          : 'InContacto omitido'
    );
    if (result.emailSent) partes.push('correo enviado');
    message = `Venta marcada como pagada: ${partes.join(', ')}.`;
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${order.id}`);
  return { ok: true, message, warnings };
}

/** Reintenta el envío del asistente a InContacto sin tocar el estado. */
export async function retryIncontacto(orderId: string): Promise<OrderActionResult> {
  await assertAdmin();
  if (!UUID_RE.test(orderId)) return fail('Id de orden inválido');

  const sb = createServiceClient();
  const { data: order } = await sb.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (!order) return fail('No se encontró la venta');
  if (order.status !== 'paid') {
    return fail('Solo se registran en InContacto las ventas pagadas');
  }

  const tierName = await getTierName(sb, order.ticket_tier);
  const result = await syncOrderToIncontacto(sb, order as FulfillableOrder, tierName);

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);

  if (result.status === 'sent') {
    return { ok: true, message: 'Asistente registrado en InContacto.' };
  }
  if (result.status === 'skipped') {
    return fail(`No se intentó: ${result.error ?? 'falta configuración'}`);
  }
  return fail(`InContacto rechazó el registro: ${result.error ?? 'error desconocido'}`);
}
