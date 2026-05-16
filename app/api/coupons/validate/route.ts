import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateCoupon } from '@/lib/coupons';

/**
 * POST /api/coupons/validate
 * Body: { code: string, tier: string, subtotalCop: number }
 * Resp: { ok, discountCop, totalCop, reason? }
 *
 * Solo para feedback inmediato al usuario en el UI del checkout.
 * La validación final se hace de nuevo server-side al crear la orden.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: 'No autenticado' }, { status: 401 });
  }

  let body: { code?: string; tier?: string; subtotalCop?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 });
  }

  const code = (body.code ?? '').trim();
  const tier = (body.tier ?? '').trim();
  const subtotalCop = Number(body.subtotalCop);

  if (!code || !tier || !Number.isFinite(subtotalCop) || subtotalCop <= 0) {
    return NextResponse.json({ ok: false, reason: 'Datos incompletos' }, { status: 400 });
  }

  const result = await validateCoupon({ code, tierSlug: tier, subtotalCop });
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason });
  }
  return NextResponse.json({
    ok: true,
    discountCop: result.discountCop,
    totalCop: result.totalCop,
    couponCode: result.coupon.code
  });
}
