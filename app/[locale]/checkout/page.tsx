import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { localizePath, type Locale } from '@/lib/i18n/config';
import { getActiveTiers, formatCop } from '@/lib/tickets';
import { hasWompiConfigured, WOMPI_TEST_MODE } from '@/lib/wompi/config';
import { validateCoupon } from '@/lib/coupons';
import CheckoutForm from './CheckoutForm';
import CouponBox from './CouponBox';
import { startGuestCheckout } from './actions';

export const metadata = {
  title: 'Checkout · LINKU SUMMIT 2026',
  robots: { index: false, follow: false }
};

const COPY = {
  es: {
    eyebrow: 'Checkout',
    title: 'Confirma tu entrada.',
    summary: 'Resumen de tu compra',
    notConfigured:
      'La pasarela de pago aún no está configurada. Escríbenos a invites@linkusummit.com.',
    notFound: 'Esa entrada no existe o ya no está disponible.',
    backToTickets: 'Volver a entradas',
    secureCheckout:
      'Pago seguro procesado por Wompi · Tarjeta, PSE, Nequi, Bancolombia.',
    youPay: 'Total a pagar',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    couponLabel: '¿Tienes un código de descuento?',
    couponPlaceholder: 'INGRESA TU CÓDIGO',
    couponApply: 'Aplicar',
    couponRemove: 'Quitar cupón',
    couponApplied: 'Cupón aplicado:',
    couponInvalid: 'Cupón no válido',
    noRegister:
      'No necesitas registrarte para comprar. Después de pagar, te enviamos un código para crear tu cuenta y ver tu boleta.',
    sandboxNote:
      'Modo PRUEBA: ningún cobro real se procesará. Usa la tarjeta 4242 4242 4242 4242, fecha futura y cualquier CVC.',
    form: {
      buyerSection: 'Datos del comprador',
      name: 'Nombre completo',
      email: 'Email',
      phone: 'Teléfono',
      docType: 'Tipo de documento',
      docNumber: 'Número de documento',
      billingSection: 'Datos de facturación',
      billingSame: 'Los datos de facturación son los mismos del comprador',
      address: 'Dirección',
      pay: 'Pagar con Wompi'
    }
  },
  en: {
    eyebrow: 'Checkout',
    title: 'Confirm your ticket.',
    summary: 'Order summary',
    notConfigured:
      "Payments aren't configured yet. Email us at invites@linkusummit.com.",
    notFound: 'That ticket no longer exists or is unavailable.',
    backToTickets: 'Back to tickets',
    secureCheckout: 'Secure payment by Wompi · Card, PSE, Nequi, Bancolombia.',
    youPay: 'Total to pay',
    subtotal: 'Subtotal',
    discount: 'Discount',
    couponLabel: 'Have a discount code?',
    couponPlaceholder: 'ENTER YOUR CODE',
    couponApply: 'Apply',
    couponRemove: 'Remove coupon',
    couponApplied: 'Coupon applied:',
    couponInvalid: 'Invalid coupon',
    noRegister:
      "No need to register to buy. After paying, we'll email you a code to create your account and view your ticket.",
    sandboxNote:
      'TEST mode: no real charge will be processed. Use card 4242 4242 4242 4242, future date, any CVC.',
    form: {
      buyerSection: 'Buyer details',
      name: 'Full name',
      email: 'Email',
      phone: 'Phone',
      docType: 'Document type',
      docNumber: 'Document number',
      billingSection: 'Billing details',
      billingSame: 'Billing details are the same as the buyer',
      address: 'Address',
      pay: 'Pay with Wompi'
    }
  }
} as const;

export default async function CheckoutPage(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ tier?: string; coupon?: string }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const t = COPY[params.locale];

  const slug = searchParams.tier?.trim();
  if (!slug) notFound();

  const tiers = await getActiveTiers(params.locale);
  const tier = tiers.find((x) => x.slug === slug);

  const notFoundView = (
    <main className="relative min-h-screen bg-linku-bg px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-bold tracking-tightish text-linku-text">
          {!tier ? t.notFound : t.notConfigured}
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

  if (!tier || !hasWompiConfigured()) return notFoundView;

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
  }

  const subtotalCop = tier.priceCop;
  const totalCop = subtotalCop - discountCop;

  return (
    <main className="relative min-h-screen overflow-hidden bg-linku-bg pb-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-hero-glow opacity-60"
        aria-hidden
      />

      <header className="relative border-b border-linku-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
          <Link href={localizePath('/', params.locale)} className="flex items-center gap-3">
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
            <>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-linku-text-muted">{t.subtotal}</span>
                <span className="tabular-nums text-linku-text-muted">
                  {formatCop(subtotalCop)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-emerald-300">
                  {t.discount}{' '}
                  {appliedCouponCode && (
                    <code className="ml-1 font-mono text-xs">({appliedCouponCode})</code>
                  )}
                </span>
                <span className="tabular-nums text-emerald-300">− {formatCop(discountCop)}</span>
              </div>
            </>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-linku-border pt-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-linku-text-muted">
              {t.youPay}
            </span>
            <span className="text-2xl font-bold tracking-tightish tabular-nums text-linku-coral">
              {formatCop(totalCop)}
            </span>
          </div>

          <p className="mt-4 rounded-lg border border-linku-border bg-linku-bg-3/40 px-3 py-2.5 text-[12px] leading-relaxed text-linku-text-muted">
            {t.noRegister}
          </p>

          <div className="mt-7">
            <CheckoutForm
              action={startGuestCheckout}
              tier={tier.slug}
              locale={params.locale}
              coupon={appliedCouponCode ?? undefined}
              copy={t.form}
            />
            <p className="mt-4 text-center text-[11px] text-linku-text-dim">
              {t.secureCheckout}
            </p>
            {WOMPI_TEST_MODE && (
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
