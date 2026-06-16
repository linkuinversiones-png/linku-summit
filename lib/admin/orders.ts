import { createClient } from '@/lib/supabase/server';
import { createClient as createServerSb } from '@supabase/supabase-js';

export type OrderRow = {
  id: string;
  user_id: string;
  ticket_tier: string;
  subtotal_cop: number;
  discount_cop: number;
  total_cop: number;
  coupon_code: string | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';
  payment_provider_id: string | null;
  payment_reference: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketRow = {
  id: string;
  order_id: string;
  user_id: string;
  qr_code: string;
  ticket_tier: string;
  attendee_name: string | null;
  attendee_email: string | null;
  status: 'active' | 'used' | 'cancelled' | 'transferred';
  used_at: string | null;
  created_at: string;
};

export type OrderEnriched = OrderRow & {
  user_email: string | null;
  user_full_name: string | null;
  tier_name: string | null;
  ticket: TicketRow | null;
};

/**
 * Cliente con service role: lo necesitamos en el admin para mapear
 * user_id → email desde auth.users (la tabla pública profiles no tiene email).
 */
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServerSb(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export type ListOrdersFilter = {
  status?: OrderRow['status'];
  tierSlug?: string;
  search?: string; // matches email or name (case insensitive)
  limit?: number;
};

/**
 * Lista órdenes con todo lo necesario para mostrar en /admin/orders:
 * email del comprador, nombre, nombre del tier, y el ticket asociado
 * (si la orden está paid).
 *
 * Hace una sola query a orders y luego batch-enriquece con joins en
 * memoria. Suficiente para volúmenes de MVP (cientos de órdenes).
 */
export async function listOrdersEnriched(
  filter: ListOrdersFilter = {}
): Promise<OrderEnriched[]> {
  const supabase = await createClient();
  let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (filter.status) q = q.eq('status', filter.status);
  if (filter.tierSlug) q = q.eq('ticket_tier', filter.tierSlug);
  q = q.limit(filter.limit ?? 200);

  const { data: orders } = await q;
  if (!orders || orders.length === 0) return [];

  // Batch fetch tickets, tiers, users
  const orderIds = orders.map((o) => o.id);
  const tierSlugs = [...new Set(orders.map((o) => o.ticket_tier))];
  const userIds = [...new Set(orders.map((o) => o.user_id))];

  const sb = serviceClient();

  const [{ data: tickets }, { data: tiers }, usersById] = await Promise.all([
    supabase
      .from('tickets_issued')
      .select('*')
      .in('order_id', orderIds),
    supabase
      .from('ticket_tiers')
      .select('slug, name_es')
      .in('slug', tierSlugs),
    fetchUsersBatch(sb, userIds)
  ]);

  const ticketByOrder = new Map<string, TicketRow>();
  (tickets ?? []).forEach((t) => ticketByOrder.set(t.order_id, t as TicketRow));
  const tierName = new Map<string, string>();
  (tiers ?? []).forEach((t) => tierName.set(t.slug, t.name_es));

  let enriched: OrderEnriched[] = (orders as OrderRow[]).map((o) => ({
    ...o,
    user_email: usersById.get(o.user_id)?.email ?? null,
    user_full_name: usersById.get(o.user_id)?.full_name ?? null,
    tier_name: tierName.get(o.ticket_tier) ?? o.ticket_tier,
    ticket: ticketByOrder.get(o.id) ?? null
  }));

  if (filter.search && filter.search.trim()) {
    const needle = filter.search.trim().toLowerCase();
    enriched = enriched.filter(
      (o) =>
        (o.user_email ?? '').toLowerCase().includes(needle) ||
        (o.user_full_name ?? '').toLowerCase().includes(needle) ||
        o.payment_reference.toLowerCase().includes(needle)
    );
  }

  return enriched;
}

export async function getOrderEnrichedById(
  id: string
): Promise<OrderEnriched | null> {
  const supabase = await createClient();
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();
  if (!order) return null;

  const sb = serviceClient();
  const [{ data: ticket }, { data: tier }, usersById] = await Promise.all([
    supabase.from('tickets_issued').select('*').eq('order_id', id).maybeSingle(),
    supabase
      .from('ticket_tiers')
      .select('slug, name_es')
      .eq('slug', order.ticket_tier)
      .maybeSingle(),
    fetchUsersBatch(sb, [order.user_id])
  ]);

  return {
    ...(order as OrderRow),
    user_email: usersById.get(order.user_id)?.email ?? null,
    user_full_name: usersById.get(order.user_id)?.full_name ?? null,
    tier_name: tier?.name_es ?? order.ticket_tier,
    ticket: (ticket as TicketRow | null) ?? null
  };
}

/** Mapea user_id → { email, full_name } via auth.admin + profiles. */
async function fetchUsersBatch(
  sb: ReturnType<typeof serviceClient>,
  userIds: string[]
): Promise<Map<string, { email: string; full_name: string | null }>> {
  if (userIds.length === 0) return new Map();
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);

  // Para email tenemos que ir a auth.users via admin API.
  // listUsers no permite filtrar por ID, así que iteramos individualmente
  // (rápido para volúmenes de admin MVP).
  const result = new Map<string, { email: string; full_name: string | null }>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await sb.auth.admin.getUserById(id);
      const fullName =
        (profiles ?? []).find((p) => p.id === id)?.full_name ?? null;
      result.set(id, {
        email: data?.user?.email ?? '',
        full_name: fullName
      });
    })
  );
  return result;
}

export type OrdersStats = {
  totalPaidCount: number;
  totalPaidCop: number;
  totalPendingCount: number;
  uniqueAttendees: number;
};

export async function getOrdersStats(): Promise<OrdersStats> {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('status, total_cop, user_id');

  const paid = (orders ?? []).filter((o) => o.status === 'paid');
  const pending = (orders ?? []).filter((o) => o.status === 'pending');
  return {
    totalPaidCount: paid.length,
    totalPaidCop: paid.reduce((acc, o) => acc + (o.total_cop ?? 0), 0),
    totalPendingCount: pending.length,
    uniqueAttendees: new Set(paid.map((o) => o.user_id)).size
  };
}
