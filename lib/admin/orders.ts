import { createClient } from '@/lib/supabase/server';
import { createClient as createServerSb } from '@supabase/supabase-js';
import type { StatusLogRow } from '@/lib/orders/status-log';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';

export type OrderRow = {
  id: string;
  user_id: string | null;
  ticket_tier: string;
  subtotal_cop: number;
  discount_cop: number;
  total_cop: number;
  coupon_code: string | null;
  status: OrderStatus;
  payment_provider_id: string | null;
  payment_reference: string;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;

  // Datos del comprador (checkout sin registro, migración 0012/0013)
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_doc_type: string | null;
  buyer_doc_number: string | null;
  buyer_company: string | null;
  buyer_position: string | null;
  buyer_linkedin: string | null;

  // Facturación
  billing_same: boolean;
  billing_name: string | null;
  billing_doc_type: string | null;
  billing_doc_number: string | null;
  billing_email: string | null;
  billing_address: string | null;

  // Sincronización con InContacto (migración 0015)
  incontacto_status: 'sent' | 'error' | 'skipped' | null;
  incontacto_synced_at: string | null;
  incontacto_error: string | null;
};

export type TicketRow = {
  id: string;
  order_id: string;
  user_id: string | null;
  qr_code: string;
  ticket_tier: string;
  attendee_name: string | null;
  attendee_email: string | null;
  status: 'active' | 'used' | 'cancelled' | 'transferred';
  used_at: string | null;
  created_at: string;
};

export type OrderEnriched = OrderRow & {
  /** Nombre a mostrar: el del comprador y, si no hay, el del perfil. */
  display_name: string | null;
  /** Correo a mostrar: el del comprador y, si no hay, el de la cuenta. */
  display_email: string | null;
  /** True si la compra se hizo sin cuenta (checkout de invitado). */
  is_guest: boolean;
  account_email: string | null;
  tier_name: string | null;
  ticket: TicketRow | null;
};

/**
 * Cliente con service role. Necesario para resolver user_id → email desde
 * auth.users, que no es visible con la sesión del admin.
 */
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServerSb(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export type ListOrdersFilter = {
  status?: OrderStatus;
  tierSlug?: string;
  /** Busca en correo, nombre, documento y referencia de pago. */
  search?: string;
  limit?: number;
};

/**
 * Lista las ventas con todo lo que necesita /admin/orders.
 *
 * Ojo con el checkout de invitado: la mayoría de las órdenes tienen
 * user_id en null y los datos de la persona viven en las columnas buyer_*.
 * Solo resolvemos auth.users para las que sí tienen cuenta.
 */
export async function listOrdersEnriched(
  filter: ListOrdersFilter = {}
): Promise<OrderEnriched[]> {
  const supabase = await createClient();
  let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (filter.status) q = q.eq('status', filter.status);
  if (filter.tierSlug) q = q.eq('ticket_tier', filter.tierSlug);
  q = q.limit(filter.limit ?? 300);

  const { data: orders } = await q;
  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const tierSlugs = [...new Set(orders.map((o) => o.ticket_tier))];
  const userIds = [...new Set(orders.map((o) => o.user_id).filter(isUuid))];

  const [{ data: tickets }, { data: tiers }, accounts] = await Promise.all([
    supabase.from('tickets_issued').select('*').in('order_id', orderIds),
    supabase.from('ticket_tiers').select('slug, name_es').in('slug', tierSlugs),
    fetchAccounts(userIds)
  ]);

  const ticketByOrder = new Map<string, TicketRow>();
  (tickets ?? []).forEach((t) => ticketByOrder.set(t.order_id, t as TicketRow));
  const tierName = new Map<string, string>();
  (tiers ?? []).forEach((t) => tierName.set(t.slug, t.name_es));

  let enriched = (orders as OrderRow[]).map((o) =>
    enrich(o, accounts, tierName.get(o.ticket_tier) ?? o.ticket_tier, ticketByOrder.get(o.id) ?? null)
  );

  if (filter.search && filter.search.trim()) {
    const needle = filter.search.trim().toLowerCase();
    enriched = enriched.filter((o) =>
      [
        o.display_email,
        o.display_name,
        o.account_email,
        o.buyer_doc_number,
        o.buyer_company,
        o.payment_reference
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    );
  }

  return enriched;
}

export async function getOrderEnrichedById(id: string): Promise<OrderEnriched | null> {
  const supabase = await createClient();
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (!order) return null;

  const [{ data: ticket }, { data: tier }, accounts] = await Promise.all([
    supabase.from('tickets_issued').select('*').eq('order_id', id).maybeSingle(),
    supabase
      .from('ticket_tiers')
      .select('slug, name_es')
      .eq('slug', order.ticket_tier)
      .maybeSingle(),
    fetchAccounts(isUuid(order.user_id) ? [order.user_id] : [])
  ]);

  return enrich(
    order as OrderRow,
    accounts,
    tier?.name_es ?? order.ticket_tier,
    (ticket as TicketRow | null) ?? null
  );
}

/** Bitácora de una orden, leída con la sesión del admin (RLS la protege). */
export async function getOrderStatusLog(orderId: string): Promise<StatusLogRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('order_status_log')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  return (data ?? []) as StatusLogRow[];
}

type Account = { email: string | null; full_name: string | null };

function enrich(
  o: OrderRow,
  accounts: Map<string, Account>,
  tierName: string,
  ticket: TicketRow | null
): OrderEnriched {
  const account = o.user_id ? accounts.get(o.user_id) : undefined;
  return {
    ...o,
    display_name: o.buyer_name || account?.full_name || null,
    display_email: o.buyer_email || account?.email || null,
    is_guest: !o.user_id,
    account_email: account?.email ?? null,
    tier_name: tierName,
    ticket
  };
}

function isUuid(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}

/**
 * Resuelve user_id → { email, full_name }. Solo se llama con ids válidos:
 * pasar null a getUserById lanza una excepción del SDK de Supabase.
 */
async function fetchAccounts(userIds: string[]): Promise<Map<string, Account>> {
  const result = new Map<string, Account>();
  if (userIds.length === 0) return result;

  const sb = serviceClient();
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);

  await Promise.all(
    userIds.map(async (id) => {
      const fullName = (profiles ?? []).find((p) => p.id === id)?.full_name ?? null;
      try {
        const { data } = await sb.auth.admin.getUserById(id);
        result.set(id, { email: data?.user?.email ?? null, full_name: fullName });
      } catch {
        // Cuenta borrada o id inválido: la venta se sigue mostrando con buyer_*.
        result.set(id, { email: null, full_name: fullName });
      }
    })
  );
  return result;
}

export type OrdersStats = {
  totalPaidCount: number;
  totalPaidCop: number;
  totalPendingCount: number;
  uniqueAttendees: number;
  incontactoPending: number;
};

export async function getOrdersStats(): Promise<OrdersStats> {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('status, total_cop, buyer_email, user_id, incontacto_status');

  const rows = orders ?? [];
  const paid = rows.filter((o) => o.status === 'paid');
  const pending = rows.filter((o) => o.status === 'pending');

  // Un asistente = un correo de comprador. Para las órdenes con cuenta y sin
  // buyer_email caemos al user_id para no contar de menos.
  const attendees = new Set(
    paid.map((o) => (o.buyer_email ? o.buyer_email.toLowerCase() : o.user_id)).filter(Boolean)
  );

  return {
    totalPaidCount: paid.length,
    totalPaidCop: paid.reduce((acc, o) => acc + (o.total_cop ?? 0), 0),
    totalPendingCount: pending.length,
    uniqueAttendees: attendees.size,
    incontactoPending: paid.filter((o) => o.incontacto_status !== 'sent').length
  };
}
