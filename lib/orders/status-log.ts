import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Bitácora de cambios de estado de una venta (tabla order_status_log).
 *
 * Toda modificación del estado de una orden, venga del webhook de Wompi o de
 * un admin, tiene que pasar por aquí. La tabla es solo-append: nunca se
 * edita ni se borra una fila, porque es el registro de auditoría de por qué
 * una venta quedó como quedó.
 */

/** Motivos que puede elegir un admin al mover una venta a pagada. */
export const PAID_REASONS = [
  {
    value: 'efectivo',
    label: 'Pago en efectivo',
    help: 'El comprador pagó en efectivo por fuera de la pasarela.'
  },
  {
    value: 'transferencia',
    label: 'Transferencia bancaria',
    help: 'Pago recibido por transferencia o consignación.'
  },
  {
    value: 'bono',
    label: 'Bono',
    help: 'La entrada se cubre con un bono o canje acordado.'
  },
  {
    value: 'cortesia',
    label: 'Cortesía',
    help: 'Invitación sin costo: staff, prensa, aliados o speakers.'
  },
  {
    value: 'correccion',
    label: 'Corrección de un error',
    help: 'El pago sí ocurrió pero el sistema no lo registró.'
  }
] as const;

/** Motivos para mover una venta a un estado que no es pagada. */
export const OTHER_REASONS = [
  { value: 'reembolso', label: 'Reembolso al comprador', help: 'Se devolvió el dinero.' },
  { value: 'expiracion', label: 'Expiró sin pago', help: 'El comprador nunca completó el pago.' },
  { value: 'duplicada', label: 'Orden duplicada', help: 'El comprador generó la orden dos veces.' },
  { value: 'correccion', label: 'Corrección de un error', help: 'Se marcó por error.' },
  { value: 'otro', label: 'Otro motivo', help: 'Explícalo en la nota.' }
] as const;

/** Etiquetas legibles de todos los motivos, incluidos los del webhook. */
export const REASON_LABEL: Record<string, string> = {
  efectivo: 'Pago en efectivo',
  transferencia: 'Transferencia bancaria',
  bono: 'Bono',
  cortesia: 'Cortesía',
  correccion: 'Corrección de un error',
  reembolso: 'Reembolso al comprador',
  expiracion: 'Expiró sin pago',
  duplicada: 'Orden duplicada',
  otro: 'Otro motivo',
  pago_wompi: 'Pago confirmado por Wompi',
  pago_rechazado: 'Pago rechazado por Wompi'
};

/** Motivos válidos que puede mandar la UI del admin. */
export const ADMIN_REASONS = new Set<string>([
  ...PAID_REASONS.map((r) => r.value),
  ...OTHER_REASONS.map((r) => r.value)
]);

/**
 * Motivo → método de pago que queda en la orden.
 * Los motivos que no son una forma de pago no tocan payment_method.
 */
export const REASON_TO_PAYMENT_METHOD: Record<string, string | null> = {
  efectivo: 'efectivo',
  transferencia: 'transferencia',
  bono: 'bono',
  cortesia: 'cortesia',
  correccion: 'otro'
};

export type StatusLogRow = {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  reason: string;
  note: string | null;
  changed_by: string | null;
  changed_by_email: string | null;
  source: 'admin' | 'webhook' | 'sistema';
  created_at: string;
};

export type LogStatusChangeInput = {
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string;
  note?: string | null;
  changedBy?: string | null;
  changedByEmail?: string | null;
  source?: 'admin' | 'webhook' | 'sistema';
};

/**
 * Escribe una entrada en la bitácora. No lanza: si la auditoría falla, el
 * cambio de estado que ya ocurrió no se revierte, se deja un error en consola.
 */
export async function logStatusChange(
  sb: SupabaseClient,
  input: LogStatusChangeInput
): Promise<void> {
  const { error } = await sb.from('order_status_log').insert({
    order_id: input.orderId,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    reason: input.reason,
    note: input.note ?? null,
    changed_by: input.changedBy ?? null,
    changed_by_email: input.changedByEmail ?? null,
    source: input.source ?? 'admin'
  });
  if (error) {
    console.error('No se pudo escribir en order_status_log:', error.message, input);
  }
}

/** Bitácora de una orden, de lo más reciente a lo más antiguo. */
export async function getStatusLog(
  sb: SupabaseClient,
  orderId: string
): Promise<StatusLogRow[]> {
  const { data } = await sb
    .from('order_status_log')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  return (data ?? []) as StatusLogRow[];
}
