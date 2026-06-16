import Link from 'next/link';
import Image from 'next/image';
import { createClient as createServiceSb } from '@supabase/supabase-js';
import { localizePath, type Locale } from '@/lib/i18n/config';
import StatusPoll from './StatusPoll';

export const metadata = {
  title: 'Checkout · LINKU SUMMIT 2026',
  robots: { index: false, follow: false }
};

const COPY = {
  es: {
    eyebrow: 'Pago',
    titlePending: 'Estamos confirmando tu pago…',
    titlePaid: '¡Tu entrada está confirmada!',
    titleFailed: 'El pago no se pudo procesar.',
    leadPending: 'Wompi nos avisa por webhook en segundos. No cierres esta página.',
    leadPaid:
      'Revisa tu correo: te enviamos tu boleta con el QR — esa es tu entrada para el evento.',
    accountNote:
      'Para hacer seguimiento de tu entrada y agendar tus citas, entra a tu cuenta. Inicia sesión solo con tu correo (te enviamos un código de 6 dígitos).',
    accountCta: 'Entrar a mi cuenta',
    leadFailed:
      'Si crees que fue un error, intenta de nuevo o contáctanos a invites@linkusummit.com.',
    notFound: 'No encontramos esa referencia de orden.',
    backHome: 'Volver al inicio'
  },
  en: {
    eyebrow: 'Payment',
    titlePending: 'Confirming your payment…',
    titlePaid: 'Your ticket is confirmed!',
    titleFailed: 'Payment could not be processed.',
    leadPending: "Wompi notifies us via webhook within seconds. Don't close this page.",
    leadPaid:
      'Check your email: we sent your ticket with the QR — that is your entry to the event.',
    accountNote:
      'To track your ticket and book your meetings, sign in to your account. Just use your email (we send you a 6-digit code).',
    accountCta: 'Go to my account',
    leadFailed:
      'If you think this is a mistake, try again or contact us at invites@linkusummit.com.',
    notFound: "We couldn't find that order reference.",
    backHome: 'Back to home'
  }
} as const;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada');
  return createServiceSb(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export default async function CheckoutSuccessPage(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ ref?: string; id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const t = COPY[params.locale];
  // Wompi añade `?id=<txId>` a la redirect-url; recortamos si quedó pegado.
  const ref = (searchParams.ref || searchParams.id || '').split('?')[0] || undefined;

  let order:
    | { id: string; status: string; payment_reference: string; buyer_email: string | null }
    | null = null;

  if (ref) {
    const sb = serviceClient();
    const { data } = await sb
      .from('orders')
      .select('id, status, payment_reference, buyer_email')
      .eq('payment_reference', ref)
      .single();
    order = data;
  }

  if (!order) {
    return (
      <main className="relative min-h-screen bg-linku-bg px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold tracking-tightish text-linku-text">
            {t.notFound}
          </h1>
          <Link
            href={localizePath('/', params.locale)}
            className="mt-6 inline-block text-sm font-semibold text-linku-coral hover:text-linku-coral-soft"
          >
            ← {t.backHome}
          </Link>
        </div>
      </main>
    );
  }

  const loginHref = localizePath('/login', params.locale);
  const isPaid = order.status === 'paid';
  const isFailed = order.status === 'failed';

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

      <div className="relative mx-auto max-w-2xl px-5 pt-16 text-center sm:px-8 sm:pt-20">
        <h1 className="text-3xl font-bold tracking-tightish text-linku-text sm:text-4xl">
          {isPaid ? t.titlePaid : isFailed ? t.titleFailed : t.titlePending}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-linku-text-muted sm:text-lg">
          {isPaid ? t.leadPaid : isFailed ? t.leadFailed : t.leadPending}
        </p>
        <p className="mt-6 text-xs text-linku-text-dim">
          Ref: <code>{order.payment_reference}</code>
        </p>

        {isPaid && (
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-linku-coral/25 bg-linku-bg-3/40 p-5">
            <p className="text-sm leading-relaxed text-linku-text-muted">{t.accountNote}</p>
            <Link
              href={loginHref}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-linku-coral px-5 py-3 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft"
            >
              {t.accountCta} →
            </Link>
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href={localizePath('/', params.locale)}
            className="inline-flex items-center gap-2 rounded-xl border border-linku-border-2 px-5 py-3 text-sm font-semibold text-linku-text-muted transition hover:border-white/25 hover:text-linku-text"
          >
            {t.backHome}
          </Link>
        </div>

        {!isPaid && !isFailed && <StatusPoll reference={order.payment_reference} />}
      </div>
    </main>
  );
}
