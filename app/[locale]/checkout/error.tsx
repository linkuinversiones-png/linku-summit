'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function CheckoutError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Loguea al servidor de Next; visible en `npm run dev` o Vercel logs.
    console.error('[checkout error]', error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linku-bg px-5 py-20 text-center sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60"
        aria-hidden
      />
      <div className="relative flex max-w-md flex-col items-center gap-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/linku-icon.png"
            alt="LinkU"
            width={72}
            height={72}
            className="h-10 w-10"
          />
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tightish text-linku-text">
              LINKU <span className="text-linku-coral">SUMMIT</span>
            </span>
          </span>
        </Link>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
          Error en checkout
        </p>
        <h1 className="text-3xl font-bold tracking-tightish text-linku-text sm:text-4xl">
          Algo no salió bien.
        </h1>
        <p className="text-sm text-linku-text-muted sm:text-base">
          {error.message || 'No pudimos cargar la página de pago.'}
        </p>
        {error.digest && (
          <p className="text-[10px] text-linku-text-dim">
            Error ID: <code>{error.digest}</code>
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-5 py-3 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-linku-border-2 px-5 py-3 text-sm font-semibold text-linku-text-muted transition hover:border-white/25 hover:text-linku-text"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
