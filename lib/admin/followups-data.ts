import { createClient } from '@/lib/supabase/server';
import {
  buildFollowupCases,
  type FollowupCase,
  type FollowupOrder,
  type FollowupResolutionRow
} from './followups';

export type RecentResolved = FollowupResolutionRow & {
  buyer_name: string | null;
  buyer_email: string | null;
};

export type FollowupsData = {
  cases: FollowupCase[];
  recentResolved: RecentResolved[];
};

/** Ventana de búsqueda de intentos fallidos/pendientes. */
const WINDOW_DAYS = 60;

/**
 * Lee lo necesario con la sesión del admin (RLS) y arma los casos.
 * Nunca lanza: si algo falla devuelve el panel vacío para no romper Ventas.
 */
export async function loadFollowups(): Promise<FollowupsData> {
  try {
    const supabase = await createClient();
    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();

    const [attemptsRes, paidRes, tiersRes, resolutionsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .in('status', ['failed', 'pending'])
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase
        .from('orders')
        .select('*')
        .eq('status', 'paid')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase.from('ticket_tiers').select('*'),
      // Si la tabla aún no existe (migración sin aplicar) da error: se
      // trata como "sin resoluciones".
      supabase
        .from('payment_followups')
        .select('*')
        .order('resolved_at', { ascending: false })
        .limit(1000)
    ]);

    const tiers = new Map<string, { name: string | null; adminOnly: boolean }>();
    for (const t of tiersRes.data ?? []) {
      tiers.set(t.slug, { name: t.name_es ?? null, adminOnly: !!t.admin_only });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders: FollowupOrder[] = [...(attemptsRes.data ?? []), ...(paidRes.data ?? [])].map((o: any) => ({
      id: o.id,
      status: o.status,
      created_at: o.created_at,
      payment_method: o.payment_method ?? null,
      ticket_tier: o.ticket_tier,
      tier_name: tiers.get(o.ticket_tier)?.name ?? null,
      tier_admin_only: tiers.get(o.ticket_tier)?.adminOnly ?? false,
      total_cop: o.total_cop,
      discount_cop: o.discount_cop ?? 0,
      coupon_code: o.coupon_code ?? null,
      buyer_name: o.buyer_name ?? null,
      buyer_email: o.buyer_email ?? null,
      buyer_phone: o.buyer_phone ?? null,
      buyer_doc_number: o.buyer_doc_number ?? null,
      buyer_company: o.buyer_company ?? null
    }));

    const resolutionRows = (resolutionsRes.error ? [] : resolutionsRes.data ?? []) as (RecentResolved)[];
    const cases = buildFollowupCases(orders, resolutionRows);

    // Último motivo reportado por Wompi, solo para la última orden de cada caso.
    const lastIds = cases.map((c) => c.lastOrderId);
    if (lastIds.length > 0) {
      const byOrder = new Map<string, string>();
      // En lotes de 50 para no generar una URL enorme.
      for (let i = 0; i < lastIds.length; i += 50) {
        const { data: logs } = await supabase
          .from('order_status_log')
          .select('order_id, reason, note, created_at')
          .in('order_id', lastIds.slice(i, i + 50))
          .order('created_at', { ascending: false });
        for (const l of logs ?? []) {
          if (byOrder.has(l.order_id)) continue;
          byOrder.set(l.order_id, l.note || l.reason);
        }
      }
      for (const c of cases) c.lastReason = byOrder.get(c.lastOrderId) ?? null;
    }

    return { cases, recentResolved: resolutionRows.slice(0, 10) };
  } catch {
    return { cases: [], recentResolved: [] };
  }
}
