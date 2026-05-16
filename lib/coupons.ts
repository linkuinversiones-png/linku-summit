import { createClient } from '@/lib/supabase/server';

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
};

export type CouponValidation =
  | {
      ok: true;
      coupon: CouponRow;
      discountCop: number; // descuento en pesos calculado sobre el subtotal
      totalCop: number; // total después del descuento
    }
  | { ok: false; reason: string };

/**
 * Valida un cupón contra un tier + subtotal y calcula el descuento.
 * Server-side: usa el cliente Supabase del request (RLS permite SELECT
 * de cupones activos públicamente, así que cualquier user logueado puede
 * validar).
 */
export async function validateCoupon(input: {
  code: string;
  tierSlug: string;
  subtotalCop: number;
}): Promise<CouponValidation> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, reason: 'Código vacío' };

  const supabase = createClient();
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
  if (
    c.applies_to_tiers &&
    c.applies_to_tiers.length > 0 &&
    !c.applies_to_tiers.includes(input.tierSlug)
  ) {
    return { ok: false, reason: 'Cupón no aplica a este tier' };
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

  return { ok: true, coupon: c, discountCop: discount, totalCop: total };
}

// =====================================================================
// Admin helpers
// =====================================================================

export async function getAllCouponsAdmin(): Promise<CouponRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as CouponRow[];
}

export async function getCouponByIdAdmin(id: string): Promise<CouponRow | null> {
  const supabase = createClient();
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
  user_id: string;
  code_snapshot: string;
  discount_cop: number;
  created_at: string;
};

export async function getRedemptionsForCouponAdmin(
  couponId: string
): Promise<CouponRedemption[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('coupon_redemptions')
    .select('*')
    .eq('coupon_id', couponId)
    .order('created_at', { ascending: false });
  return (data ?? []) as CouponRedemption[];
}
