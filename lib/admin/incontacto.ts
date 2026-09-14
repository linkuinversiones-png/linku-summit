import { createClient } from '@/lib/supabase/server';
import { hasIncontactoConfigured } from '@/lib/incontacto';

/**
 * Qué sabemos del registro de cada asistente en InContacto.
 *
 * InContacto solo expone un endpoint de alta (save); no hay forma de
 * consultar su base. Lo que mostramos es NUESTRO registro de cada envío:
 * si lo intentamos, cuándo, y qué respondieron. "Enviado" significa que la
 * API aceptó el registro o dijo que ese documento ya existía.
 */

export type IncontactoSyncStatus = 'sent' | 'error' | 'skipped' | 'never';

export type IncontactoRow = {
  order_id: string;
  payment_reference: string;
  paid_at: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_doc_type: string | null;
  buyer_doc_number: string | null;
  buyer_company: string | null;
  buyer_position: string | null;
  ticket_tier: string;
  tier_name: string;
  payment_method: string | null;
  sync: IncontactoSyncStatus;
  synced_at: string | null;
  error: string | null;
  /** False cuando falta el documento: InContacto identifica por ese campo. */
  canSend: boolean;
  blockedReason: string | null;
};

export type IncontactoOverview = {
  rows: IncontactoRow[];
  configured: boolean;
  counts: {
    total: number;
    sent: number;
    error: number;
    never: number;
    blocked: number;
  };
};

export async function getIncontactoOverview(): Promise<IncontactoOverview> {
  const supabase = await createClient();
  const [{ data: orders }, { data: tiers }] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, payment_reference, paid_at, buyer_name, buyer_email, buyer_phone, buyer_doc_type, buyer_doc_number, buyer_company, buyer_position, ticket_tier, payment_method, incontacto_status, incontacto_synced_at, incontacto_error'
      )
      .eq('status', 'paid')
      .order('paid_at', { ascending: false }),
    supabase.from('ticket_tiers').select('slug, name_es')
  ]);

  const tierName = new Map<string, string>();
  (tiers ?? []).forEach((t) => tierName.set(t.slug, t.name_es));

  const rows: IncontactoRow[] = (orders ?? []).map((o) => {
    const hasDoc = Boolean(o.buyer_doc_number);
    const status = (o.incontacto_status as IncontactoSyncStatus | null) ?? 'never';
    return {
      order_id: o.id,
      payment_reference: o.payment_reference,
      paid_at: o.paid_at,
      buyer_name: o.buyer_name,
      buyer_email: o.buyer_email,
      buyer_phone: o.buyer_phone,
      buyer_doc_type: o.buyer_doc_type,
      buyer_doc_number: o.buyer_doc_number,
      buyer_company: o.buyer_company,
      buyer_position: o.buyer_position,
      ticket_tier: o.ticket_tier,
      tier_name: tierName.get(o.ticket_tier) ?? o.ticket_tier,
      payment_method: o.payment_method,
      sync: status,
      synced_at: o.incontacto_synced_at,
      error: o.incontacto_error,
      canSend: hasDoc,
      blockedReason: hasDoc
        ? null
        : 'Sin número de documento. Es una compra anterior al formulario actual; hay que completarlo a mano.'
    };
  });

  const counts = {
    total: rows.length,
    sent: rows.filter((r) => r.sync === 'sent').length,
    error: rows.filter((r) => r.sync === 'error').length,
    never: rows.filter((r) => r.sync === 'never' || r.sync === 'skipped').length,
    blocked: rows.filter((r) => !r.canSend).length
  };

  return { rows, configured: hasIncontactoConfigured(), counts };
}
