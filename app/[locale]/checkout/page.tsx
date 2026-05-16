import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { localizePath, type Locale } from '@/lib/i18n/config';
import { getActiveTiers, formatCop } from '@/lib/tickets';
import {
  hasEpaycoConfigured,
  epaycoPKey,
  epaycoCustomerId,
  EPAYCO_TEST_MODE
} from '@/lib/epayco/config';
import {
  signCheckout,
  generateOrderReference
} from '@/lib/epayco/signatures';
import { validateCoupon } from '@/lib/coupons';
import PaymentButton from './PaymentButton';
import CouponBox from './CouponBox';

export const metadata = {
  title: 'Checkout · LINKU SUMMIT 2026',
  robots: { index: false, follow: false }
};

const COPY = {
  es: {
    eyebrow: 'Checkout',
    title: 'Confirma tu entrada.',
    summary: 'Resumen de tu compra',
    payNow: 'Pagar con ePayco',
    notConfigured:
      'La pasarela de pago aún no está configurada. Escríbenos a invites@linkusummit.com.',
    notFound: 'Esa entrada no existe o ya no está disponible.',
    backToTickets: 'Volver a entradas',
    secureCheckout:
      'Pago seguro procesado por ePayco · Tarjeta, PSE, Nequi, Daviplata, Efecty.',
    youPay: 'Total a pagar',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    couponLabel: '¿Tienes un código de descuento?',
    couponPlaceholder: 'INGRESA TU CÓDIGO',
    couponApply: 'Aplicar',
    couponRemove: 'Quitar cupón',
    couponApplied: 'Cupón aplicado:',
    couponInvalid: 'Cupón no válido',
    sandboxNote:
      'Modo PRUEBA: ningún cobro real se procesará. Usa la tarjeta de prueba 4575 6231 8229 0326.'
  },
  en: {
    eyebrow: 'Checkout',
    title: 'Confirm your ticket.',
    summary: 'Order summary',
    payNow: 'Pay with ePayco',
    notConfigured:
      "Payments aren't configured yet. Email us at invites@linkusummit.com.",
    notFound: 'That ticket no longer exists or is unavailable.',
    backToTickets: 'Back to tickets',
    secureCheckout:
      'Secure payment by ePayco · Card, PSE, Nequi, Daviplata, Efecty.',
    youPay: 'Total to pay',
    subtotal: 'Subtotal',
    discount: 'Discount',
    couponLabel: 'Have a discount code?',
    couponPlaceholder: 'ENTER YOUR CODE',
    couponApply: 'Apply',
    couponRemove: 'Remove coupon',
    couponApplied: 'Coupon applied:',
    couponInvalid: 'Invalid coupon',
    sandboxNote:
      'TEST mode: no real charge will be processed. Use test card 4575 6231 8229 0326.'
  }
} as const;

export default async function CheckoutPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { tier?: string; coupon?: string };
}) {
  const t = COPY[params.locale];

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const next = `/checkout?tier=${encodeURIComponent(searchParams.tier ?? '')}`;
    redirect(localizePath(`/login?next=${encodeURIComponent(next)}`, params.locale));
  }

  const slug = searchParams.tier?.trim();
  if (!slug) notFound();

  const tiers = await getActiveTiers(params.locale);
  const tier = tiers.find((x) => x.slug === slug);
  if (!tier) {
    return (
      <main className="relative min-h-screen bg-linku-bg px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold tracking-tightish text-linku-text">
            {t.notFound}
          </h1>
          <Link
            href={localizePath('/#tickets', params.locale)}
            className="mt-6 inline-block text-sm font-semibold text-linku-coral hover:text-linku-coral-soft"
          >
            ← {t.backToTickets}
          </Link>
        </div>
      </main>
    );
  }

  if (!hasEpaycoConfigured()) {
    return (
      <main className="relative min-h-screen bg-linku-bg px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold tracking-tightish text-linku-text">
            {t.notConfigured}
          </h1>
          <Link
            href={localizePath('/#tickets', params.locale)}
            className="mt-6 inline-block text-sm font-semibold text-linku-coral hover:text-linku-coral-soft"
          >
            ← {t.backToTickets}
          </Link>
        </div>
      </main>
    );
  }

  // Cupón opcional vía query param
  let discountCop = 0;
  let appliedCouponCode: string | null = null;
  const couponInput = searchParams.coupon?.trim();
  if (couponInput) {
    const validation = await validateCoupon({
      code: couponInput,
      tierSlug: tier.slug,
      subtotalCop: tier.priceCop
    });
    if (validation.ok) {
      discountCop = validation.discountCop;
      appliedCouponCode = validation.coupon.code;
    }
    // Si no es válido, lo ignoramos silenciosamente — el UI ya
    // mostró el error al usuario antes de redirigir aquí.
  }

  const subtotalCop = tier.priceCop;
  const totalCop = subtotalCop - discountCop;

  // Crear orden pendiente — referencia única (p_id_invoice)
  const reference = generateOrderReference();
  const amount = totalCop; // ePayco usa unidades de moneda enteras (no centavos)
  const currency = 'COP';

  const { error: insertErr } = await supabase.from('orders').insert({
    user_id: user.id,
    ticket_tier: tier.slug,
    subtotal_cop: subtotalCop,
    discount_cop: discountCop,
    total_cop: totalCop,
    coupon_code: appliedCouponCode,
    status: 'pending',
    payment_reference: reference
  });

  if (insertErr) {
    return (
      <main className="relative min-h-screen bg-linku-bg px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold tracking-tightish text-linku-text">
            No pudimos crear tu orden
          </h1>
          <p className="mt-3 text-sm text-linku-text-muted">{insertErr.message}</p>
        </div>
      </main>
    );
  }

  const signature = signCheckout({
    invoiceId: reference,
    amount,
    currency
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const successPath = localizePath('/checkout/success', params.locale);
  const responseUrl = `${siteUrl}${successPath}?ref=${encodeURIComponent(reference)}`;
  const confirmationUrl = `${siteUrl}/api/webhooks/epayco`;

  // ePayco rechaza/500 con caracteres no-ASCII en p_description (em-dash, acentos
  // raros). Normalizamos a ASCII puro removiendo diacríticos.
  const sanitize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // quita combining diacritics
      .replace(/[^\x20-\x7E]/g, '-'); // cualquier no-ASCII restante → guion
  const descriptionByLocale: Record<Locale, string> = {
    es: sanitize(`LinkU Summit 2026 - ${tier.name}`),
    en: sanitize(`LinkU Summit 2026 - ${tier.name}`)
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-linku-bg pb-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-hero-glow opacity-60"
        aria-hidden
      />

      <header className="relative border-b border-linku-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
          <Link
            href={localizePath('/', params.locale)}
            className="flex items-center gap-3"
          >
            <Image
              src="/brand/linku-icon.png"
              alt="LinkU"
              width={72}
              height={72}
              className="h-9 w-9"
            />
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tightish text-linku-text">
                LINKU <span className="text-linku-coral">SUMMIT</span>
              </span>
              <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.22em] text-linku-coral/70">
                {t.eyebrow}
              </span>
            </span>
          </Link>
        </div>
      </header>

      <div className="relative mx-auto max-w-3xl px-5 pt-10 sm:px-8 sm:pt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tightish text-linku-text sm:text-4xl">
          {t.title}
        </h1>

        <section className="mt-10 linku-card p-7 sm:p-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            {t.summary}
          </h2>

          <div className="mt-5 flex items-start justify-between gap-4 border-b border-linku-border pb-5">
            <div>
              <p className="text-lg font-semibold text-linku-text">{tier.name}</p>
              {tier.label && (
                <p className="mt-0.5 text-xs uppercase tracking-wider text-linku-text-dim">
                  {tier.label}
                </p>
              )}
            </div>
            <p className="text-lg font-bold tabular-nums text-linku-text">
              {formatCop(subtotalCop)}
            </p>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-linku-text-muted">
              {t.couponLabel}
            </p>
            <CouponBox
              tier={tier.slug}
              subtotalCop={subtotalCop}
              appliedCode={appliedCouponCode}
              appliedDiscountCop={discountCop}
              copy={{
                placeholder: t.couponPlaceholder,
                apply: t.couponApply,
                remove: t.couponRemove,
                applied: t.couponApplied,
                invalid: t.couponInvalid
              }}
            />
          </div>

          {discountCop > 0 && (
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-linku-text-muted">{t.subtotal}</span>
              <span className="tabular-nums text-linku-text-muted">
                {formatCop(subtotalCop)}
              </span>
            </div>
          )}
          {discountCop > 0 && (
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-emerald-300">
                {t.discount}{' '}
                {appliedCouponCode && (
                  <code className="ml-1 font-mono text-xs">({appliedCouponCode})</code>
                )}
              </span>
              <span className="tabular-nums text-emerald-300">
                − {formatCop(discountCop)}
              </span>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-linku-border pt-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-linku-text-muted">
              {t.youPay}
            </span>
            <span className="text-2xl font-bold tracking-tightish tabular-nums text-linku-coral">
              {formatCop(totalCop)}
            </span>
          </div>

          <div className="mt-8">
            <PaymentButton
              customerId={epaycoCustomerId()}
              pKey={epaycoPKey()}
              invoiceId={reference}
              amount={amount}
              currency={currency}
              signature={signature}
              testMode={EPAYCO_TEST_MODE}
              description={descriptionByLocale[params.locale]}
              responseUrl={responseUrl}
              confirmationUrl={confirmationUrl}
              customerEmail={user.email ?? ''}
              locale={params.locale}
              label={t.payNow}
            />
            <p className="mt-4 text-center text-[11px] text-linku-text-dim">
              {t.secureCheckout}
            </p>
            {EPAYCO_TEST_MODE && (
              <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center text-[11px] text-amber-200">
                {t.sandboxNote}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
