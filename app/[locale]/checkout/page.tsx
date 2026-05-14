import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { localizePath, type Locale } from '@/lib/i18n/config';
import { getActiveTiers, formatCop } from '@/lib/tickets';
import {
  hasWompiConfigured,
  wompiPublicKey,
  WOMPI_ENV
} from '@/lib/wompi/config';
import {
  signTransactionIntegrity,
  generateOrderReference
} from '@/lib/wompi/signatures';
import PaymentButton from './PaymentButton';

export const metadata = {
  title: 'Checkout · LINKU SUMMIT 2026',
  robots: { index: false, follow: false }
};

const COPY = {
  es: {
    eyebrow: 'Checkout',
    title: 'Confirma tu entrada.',
    summary: 'Resumen de tu compra',
    payNow: 'Pagar con Wompi',
    notConfigured:
      'La pasarela de pago aún no está configurada. Escríbenos a invites@linkusummit.com.',
    notFound: 'Esa entrada no existe o ya no está disponible.',
    backToTickets: 'Volver a entradas',
    secureCheckout: 'Pago seguro procesado por Wompi · Tarjeta, PSE, Nequi, Bancolombia.',
    youPay: 'Total a pagar',
    sandboxNote:
      'Modo PRUEBA: ningún cobro real se procesará. Usa tarjeta de prueba 4242 4242 4242 4242.'
  },
  en: {
    eyebrow: 'Checkout',
    title: 'Confirm your ticket.',
    summary: 'Order summary',
    payNow: 'Pay with Wompi',
    notConfigured:
      "Payments aren't configured yet. Email us at invites@linkusummit.com.",
    notFound: 'That ticket no longer exists or is unavailable.',
    backToTickets: 'Back to tickets',
    secureCheckout: 'Secure payment by Wompi · Card, PSE, Nequi, Bancolombia.',
    youPay: 'Total to pay',
    sandboxNote:
      'TEST mode: no real charge will be processed. Use test card 4242 4242 4242 4242.'
  }
} as const;

export default async function CheckoutPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { tier?: string };
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

  if (!hasWompiConfigured()) {
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

  // Crear orden pendiente — referencia única
  const reference = generateOrderReference();
  const amountInCents = tier.priceCop * 100;
  const currency = 'COP';

  const { error: insertErr } = await supabase.from('orders').insert({
    user_id: user.id,
    ticket_tier: tier.slug,
    subtotal_cop: tier.priceCop,
    discount_cop: 0,
    total_cop: tier.priceCop,
    status: 'pending',
    wompi_reference: reference
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

  const integritySignature = signTransactionIntegrity({
    reference,
    amountInCents,
    currency
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const successPath = localizePath('/checkout/success', params.locale);
  const redirectUrl = `${siteUrl}${successPath}?ref=${encodeURIComponent(reference)}`;

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
              {formatCop(tier.priceCop)}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-linku-text-muted">
              {t.youPay}
            </span>
            <span className="text-2xl font-bold tracking-tightish tabular-nums text-linku-coral">
              {formatCop(tier.priceCop)}
            </span>
          </div>

          <div className="mt-8">
            <PaymentButton
              publicKey={wompiPublicKey()}
              currency={currency}
              amountInCents={amountInCents}
              reference={reference}
              integritySignature={integritySignature}
              redirectUrl={redirectUrl}
              customerEmail={user.email ?? ''}
              label={t.payNow}
            />
            <p className="mt-4 text-center text-[11px] text-linku-text-dim">
              {t.secureCheckout}
            </p>
            {WOMPI_ENV === 'test' && (
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
