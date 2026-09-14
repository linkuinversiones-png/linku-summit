import { createClient } from '@/lib/supabase/server';

/** Normaliza un texto a slug: minúsculas, sin acentos, espacios → guiones. */
function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

import {
  COURTESY_CATEGORIES,
  COURTESY_CATEGORY_LABEL,
  type CouponKind
} from '@/lib/coupon-kinds';

// Re-export para que el código de servidor siga importando todo de aquí.
export { COURTESY_CATEGORIES, COURTESY_CATEGORY_LABEL };
export type { CouponKind };

export type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  active: boolean;
  applies_to_tiers: string[] | null;
  created_at: string;
  updated_at: string;

  // Cortesías (migración 0016)
  kind: CouponKind;
  courtesy_category: string | null;
  granted_to_name: string | null;
  granted_to_email: string | null;
  granted_to_org: string | null;
  granted_by_email: string | null;
  notes: string | null;
};

export type CouponValidation =
  | {
      ok: true;
      coupon: CouponRow;
      discountCop: number; // descuento en pesos calculado sobre el subtotal
      totalCop: number; // total después del descuento
      /** True cuando el cupón deja la entrada en $0 y no hay que ir a Wompi. */
      isFree: boolean;
    }
  | { ok: false; reason: string };

/**
 * Valida un cupón contra un tier + subtotal y calcula el descuento.
 * Server-side: usa el cliente Supabase del request (RLS permite SELECT
 * de cupones activos públicamente, así que cualquier visitante puede
 * validar).
 */
export async function validateCoupon(input: {
  code: string;
  tierSlug: string;
  subtotalCop: number;
}): Promise<CouponValidation> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, reason: 'Código vacío' };

  const supabase = await createClient();
  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();

  if (!coupon) return { ok: false, reason: 'Cupón no válido' };

  const c = coupon as CouponRow;

  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'Cupón expirado' };
  }
  if (c.max_uses !== null && c.current_uses >= c.max_uses) {
    return { ok: false, reason: 'Cupón agotado' };
  }
  if (c.applies_to_tiers && c.applies_to_tiers.length > 0) {
    // Tolerante: el admin puede haber guardado el slug ("early-access") o el
    // nombre visible ("Early access"). Normalizamos ambos a slug para comparar.
    const target = slugify(input.tierSlug);
    const applies = c.applies_to_tiers.some(
      (x) => slugify(x) === target || x.trim() === input.tierSlug
    );
    if (!applies) {
      return { ok: false, reason: 'Cupón no aplica a este tier' };
    }
  }

  let discount = 0;
  if (c.discount_type === 'percent') {
    discount = Math.floor((input.subtotalCop * c.discount_value) / 100);
  } else {
    discount = c.discount_value;
  }
  // No permitimos descuento > subtotal (total mínimo = 0)
  discount = Math.min(discount, input.subtotalCop);
  const total = input.subtotalCop - discount;

  return { ok: true, coupon: c, discountCop: discount, totalCop: total, isFree: total === 0 };
}

// =====================================================================
// Admin helpers
// =====================================================================

export async function getAllCouponsAdmin(): Promise<CouponRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as CouponRow[];
}

export async function getCouponByIdAdmin(id: string): Promise<CouponRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as CouponRow | null) ?? null;
}

export type CouponRedemption = {
  id: string;
  coupon_id: string;
  order_id: string;
  user_id: string | null;
  code_snapshot: string;
  discount_cop: number;
  created_at: string;
};

export async function getRedemptionsForCouponAdmin(
  couponId: string
): Promise<CouponRedemption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('coupon_redemptions')
    .select('*')
    .eq('coupon_id', couponId)
    .order('created_at', { ascending: false });
  return (data ?? []) as CouponRedemption[];
}

// =====================================================================
// Reporte de cortesías (/admin/cortesias)
// =====================================================================

/** Una persona que usó una cortesía: la orden que generó. */
export type CourtesyUse = {
  order_id: string;
  payment_reference: string;
  order_status: string;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_company: string | null;
  buyer_position: string | null;
  buyer_doc_number: string | null;
  ticket_tier: string;
  created_at: string;
  paid_at: string | null;
};

export type CourtesyRow = CouponRow & {
  uses: CourtesyUse[];
  /** Órdenes pagadas con este código: cortesías efectivamente entregadas. */
  used: number;
  /** Cupos que quedan; null cuando el código no tiene tope. */
  remaining: number | null;
};

export type CourtesyReport = {
  rows: CourtesyRow[];
  totals: {
    codes: number;
    /** Suma de max_uses de los códigos con tope. */
    capacity: number;
    /** Códigos sin tope de usos. */
    unlimitedCodes: number;
    used: number;
    remaining: number;
    /** Órdenes con cortesía que siguen sin cerrarse (pendientes). */
    stuckPending: number;
    byCategory: Record<string, { used: number; remaining: number }>;
  };
};

/**
 * Cortesías con su uso real. El uso se mide por órdenes PAGADAS con ese
 * código y no por coupons.current_uses, porque ese contador nunca subió
 * mientras coupon_redemptions.user_id era NOT NULL (arreglado en 0016).
 */
export async function getCourtesyReport(): Promise<CourtesyReport> {
  const supabase = await createClient();
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .eq('kind', 'cortesia')
    .order('created_at', { ascending: false });

  const base = (coupons ?? []) as CouponRow[];
  const empty: CourtesyReport['totals'] = {
    codes: 0,
    capacity: 0,
    unlimitedCodes: 0,
    used: 0,
    remaining: 0,
    stuckPending: 0,
    byCategory: {}
  };
  if (base.length === 0) return { rows: [], totals: empty };

  const codes = base.map((c) => c.code);
  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, payment_reference, status, buyer_name, buyer_email, buyer_company, buyer_position, buyer_doc_number, ticket_tier, created_at, paid_at, coupon_code'
    )
    .in('coupon_code', codes)
    .order('created_at', { ascending: false });

  const usesByCode = new Map<string, CourtesyUse[]>();
  for (const o of orders ?? []) {
    const list = usesByCode.get(o.coupon_code as string) ?? [];
    list.push({
      order_id: o.id,
      payment_reference: o.payment_reference,
      order_status: o.status,
      buyer_name: o.buyer_name,
      buyer_email: o.buyer_email,
      buyer_company: o.buyer_company,
      buyer_position: o.buyer_position,
      buyer_doc_number: o.buyer_doc_number,
      ticket_tier: o.ticket_tier,
      created_at: o.created_at,
      paid_at: o.paid_at
    });
    usesByCode.set(o.coupon_code as string, list);
  }

  const rows: CourtesyRow[] = base.map((c) => {
    const uses = usesByCode.get(c.code) ?? [];
    const used = uses.filter((u) => u.order_status === 'paid').length;
    const remaining = c.max_uses === null ? null : Math.max(c.max_uses - used, 0);
    return { ...c, uses, used, remaining };
  });

  const totals = { ...empty, codes: rows.length, byCategory: {} as CourtesyReport['totals']['byCategory'] };
  for (const r of rows) {
    totals.used += r.used;
    totals.stuckPending += r.uses.filter((u) => u.order_status === 'pending').length;
    if (r.max_uses === null) totals.unlimitedCodes += 1;
    else {
      totals.capacity += r.max_uses;
      totals.remaining += r.remaining ?? 0;
    }
    const cat = r.courtesy_category ?? 'otro';
    const bucket = totals.byCategory[cat] ?? { used: 0, remaining: 0 };
    bucket.used += r.used;
    bucket.remaining += r.remaining ?? 0;
    totals.byCategory[cat] = bucket;
  }

  return { rows, totals };
}
