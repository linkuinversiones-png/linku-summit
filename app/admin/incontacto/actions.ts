'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getTierName, syncOrderToIncontacto, type FulfillableOrder } from '@/lib/orders/fulfill';

/**
 * Acciones de /admin/incontacto: reenviar un asistente o todos los que
 * falten. Solo se envían ventas PAGADAS; una pendiente nunca llega a
 * InContacto aunque se pulse el botón.
 */

export type IncontactoActionResult =
  | { ok: true; message: string; sent?: number; failed?: number; skipped?: number }
  | { ok: false; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/incontacto');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/?error=unauthorized');
}

function done() {
  revalidatePath('/admin/incontacto');
  revalidatePath('/admin/orders');
}

/** Envía (o reenvía) un asistente a InContacto. */
export async function syncOne(orderId: string): Promise<IncontactoActionResult> {
  await assertAdmin();
  if (!UUID_RE.test(orderId)) return { ok: false, message: 'Id de orden inválido' };

  const sb = createServiceClient();
  const { data: order } = await sb.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (!order) return { ok: false, message: 'No se encontró la venta' };
  if (order.status !== 'paid') {
    return { ok: false, message: 'Solo se envían las ventas pagadas' };
  }

  const tierName = await getTierName(sb, order.ticket_tier);
  const result = await syncOrderToIncontacto(sb, order as FulfillableOrder, tierName);
  done();

  if (result.status === 'sent') {
    return { ok: true, message: 'InContacto aceptó el registro.' };
  }
  if (result.status === 'skipped') {
    return { ok: false, message: `No se intentó: ${result.error ?? 'falta configuración'}` };
  }
  return { ok: false, message: result.error ?? 'InContacto rechazó el registro' };
}

/**
 * Envía todas las ventas pagadas que aún no están confirmadas en
 * InContacto (nunca enviadas o con error). Las ya enviadas no se tocan.
 * Va en serie para no saturar su API.
 */
export async function syncPending(): Promise<IncontactoActionResult> {
  await assertAdmin();

  const sb = createServiceClient();
  const { data: orders, error } = await sb
    .from('orders')
    .select('*')
    .eq('status', 'paid')
    .or('incontacto_status.is.null,incontacto_status.neq.sent')
    .order('paid_at', { ascending: true });
  if (error) return { ok: false, message: `No se pudo leer las ventas: ${error.message}` };
  if (!orders || orders.length === 0) {
    return { ok: true, message: 'No hay ventas pendientes de enviar.', sent: 0, failed: 0, skipped: 0 };
  }

  const tierNames = new Map<string, string>();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const order of orders) {
    let tierName = tierNames.get(order.ticket_tier);
    if (!tierName) {
      tierName = await getTierName(sb, order.ticket_tier);
      tierNames.set(order.ticket_tier, tierName);
    }
    const r = await syncOrderToIncontacto(sb, order as FulfillableOrder, tierName);
    if (r.status === 'sent') sent += 1;
    else if (r.status === 'error') failed += 1;
    else skipped += 1;
  }

  done();
  const partes = [`${sent} enviada(s)`];
  if (failed) partes.push(`${failed} con error`);
  if (skipped) partes.push(`${skipped} omitida(s) por falta de documento o token`);
  return { ok: true, message: partes.join(', ') + '.', sent, failed, skipped };
}
