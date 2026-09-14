'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createServiceSb } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getActiveTiers } from '@/lib/tickets';
import { validateCoupon } from '@/lib/coupons';
import { signIntegrity, generateOrderReference } from '@/lib/wompi/signatures';
import { wompiPublicKey, WOMPI_CHECKOUT_URL } from '@/lib/wompi/config';
import { fulfillPaidOrder, type FulfillableOrder } from '@/lib/orders/fulfill';
import { logStatusChange } from '@/lib/orders/status-log';
import { localizePath, type Locale } from '@/lib/i18n/config';

/**
 * Resuelve la URL base pública del sitio para armar `redirect-url` en Wompi.
 * NEXT_PUBLIC_* NO se puede usar aquí porque Next las inline en build time;
 * derivamos del host real del request (x-forwarded-host / host) para no
 * mandar `http://localhost:3000` desde producción y que Wompi bloquee con 403.
 */
async function resolveSiteUrl(): Promise<string> {
  const h = await headers();
  const forwardedHost = h.get('x-forwarded-host');
  const host = forwardedHost || h.get('host');
  if (host && !host.includes('localhost') && !host.startsWith('127.')) {
    const proto = h.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada');
  return createServiceSb(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? '').trim();
}

/**
 * Checkout de INVITADO (sin registro previo). Crea la orden con los datos
 * del comprador + facturación y:
 *   - si queda saldo, redirige al Web Checkout de Wompi;
 *   - si un cupón de cortesía la deja en $0, la marca pagada de una vez y
 *     corre la entrega (boleta, InContacto, correo). Wompi no acepta
 *     cobros de cero pesos, así que la pasarela se salta por completo.
 * El registro (OTP) ocurre DESPUÉS, en la página de éxito.
 */
export async function startGuestCheckout(formData: FormData): Promise<void> {
  const locale = (str(formData, 'locale') || 'es') as Locale;
  const tierSlug = str(formData, 'tier');

  const buyer = {
    name: str(formData, 'buyer_name'),
    email: str(formData, 'buyer_email').toLowerCase(),
    phone: str(formData, 'buyer_phone'),
    docType: str(formData, 'buyer_doc_type'),
    docNumber: str(formData, 'buyer_doc_number'),
    company: str(formData, 'buyer_company'),
    position: str(formData, 'buyer_position'),
    linkedin: str(formData, 'buyer_linkedin')
  };

  const billingSame = str(formData, 'billing_same') === 'on' || str(formData, 'billing_same') === 'true';
  const billing = billingSame
    ? {
        name: buyer.name,
        docType: buyer.docType,
        docNumber: buyer.docNumber,
        email: buyer.email,
        address: str(formData, 'billing_address')
      }
    : {
        name: str(formData, 'billing_name'),
        docType: str(formData, 'billing_doc_type'),
        docNumber: str(formData, 'billing_doc_number'),
        email: str(formData, 'billing_email').toLowerCase(),
        address: str(formData, 'billing_address')
      };

  if (!tierSlug || !buyer.email || !buyer.name || !buyer.docNumber) {
    redirect(localizePath(`/checkout?tier=${encodeURIComponent(tierSlug)}&error=missing`, locale));
  }

  const tiers = await getActiveTiers(locale);
  const tier = tiers.find((x) => x.slug === tierSlug);
  if (!tier) {
    redirect(localizePath('/#tickets', locale));
  }

  // Cupón opcional. Si venía uno y ya no es válido (se agotó, expiró),
  // devolvemos al checkout en vez de cobrar el precio completo en silencio.
  let discountCop = 0;
  let appliedCouponCode: string | null = null;
  const couponInput = str(formData, 'coupon');
  if (couponInput) {
    const validation = await validateCoupon({
      code: couponInput,
      tierSlug: tier!.slug,
      subtotalCop: tier!.priceCop
    });
    if (!validation.ok) {
      redirect(
        localizePath(`/checkout?tier=${encodeURIComponent(tierSlug)}&error=coupon`, locale)
      );
    }
    discountCop = validation.discountCop;
    appliedCouponCode = validation.coupon.code;
  }

  const subtotalCop = tier!.priceCop;
  const totalCop = subtotalCop - discountCop;
  const reference = generateOrderReference();
  const isFree = totalCop === 0 && appliedCouponCode !== null;

  const sb = serviceClient();
  const orderRow = {
    user_id: null,
    ticket_tier: tier!.slug,
    subtotal_cop: subtotalCop,
    discount_cop: discountCop,
    total_cop: totalCop,
    coupon_code: appliedCouponCode,
    payment_reference: reference,
    buyer_name: buyer.name,
    buyer_email: buyer.email,
    buyer_phone: buyer.phone,
    buyer_doc_type: buyer.docType,
    buyer_doc_number: buyer.docNumber,
    buyer_company: buyer.company,
    buyer_position: buyer.position,
    buyer_linkedin: buyer.linkedin || null,
    billing_same: billingSame,
    billing_name: billing.name,
    billing_doc_type: billing.docType,
    billing_doc_number: billing.docNumber,
    billing_email: billing.email,
    billing_address: billing.address
  };

  // --- Cortesía: nace pagada y se entrega ya --------------------------
  if (isFree) {
    const { data: order, error: insertErr } = await sb
      .from('orders')
      .insert({
        ...orderRow,
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: 'cortesia'
      })
      .select('*')
      .single();

    if (insertErr || !order) {
      redirect(localizePath(`/checkout?tier=${encodeURIComponent(tierSlug)}&error=order`, locale));
    }

    await logStatusChange(sb, {
      orderId: order.id,
      fromStatus: null,
      toStatus: 'paid',
      reason: 'cortesia',
      note: `Cupón ${appliedCouponCode} cubrió el 100 % de la entrada`,
      source: 'sistema'
    });

    const result = await fulfillPaidOrder(sb, order as FulfillableOrder);
    if (result.warnings.length > 0) {
      console.error('Cortesía entregada con avisos', reference, result.warnings);
    }

    redirect(localizePath(`/checkout/success?ref=${encodeURIComponent(reference)}`, locale));
  }

  // --- Pago normal: la orden espera al webhook de Wompi ----------------
  const { error: insertErr } = await sb.from('orders').insert({ ...orderRow, status: 'pending' });

  if (insertErr) {
    redirect(localizePath(`/checkout?tier=${encodeURIComponent(tierSlug)}&error=order`, locale));
  }

  const currency = 'COP';
  const amountInCents = totalCop * 100;
  const signature = signIntegrity({ reference, amountInCents, currency });
  const siteUrl = await resolveSiteUrl();
  const successPath = localizePath('/checkout/success', locale);
  const redirectUrl = `${siteUrl}${successPath}?ref=${encodeURIComponent(reference)}`;

  const params = new URLSearchParams({
    'public-key': wompiPublicKey(),
    currency,
    'amount-in-cents': String(amountInCents),
    reference,
    'signature:integrity': signature,
    'redirect-url': redirectUrl,
    'customer-email': buyer.email
  });

  // redirect() lanza NEXT_REDIRECT — debe ir fuera de try/catch.
  redirect(`${WOMPI_CHECKOUT_URL}?${params.toString()}`);
}

/**
 * Tras registrarse con OTP, vincula al usuario las órdenes/boletas de
 * invitado que coincidan con su email. Idempotente.
 */
export async function claimMyOrders(): Promise<{ ok: boolean; linked: number }> {
  const authed = await createClient();
  const {
    data: { user }
  } = await authed.auth.getUser();
  if (!user?.email) return { ok: false, linked: 0 };

  const sb = serviceClient();
  const email = user.email;

  const { data: linkedOrders } = await sb
    .from('orders')
    .update({ user_id: user.id })
    .is('user_id', null)
    .ilike('buyer_email', email)
    .select('id');

  await sb
    .from('tickets_issued')
    .update({ user_id: user.id })
    .is('user_id', null)
    .ilike('attendee_email', email);

  return { ok: true, linked: linkedOrders?.length ?? 0 };
}
