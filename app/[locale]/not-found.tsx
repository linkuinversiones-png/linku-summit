import Link from 'next/link';
import Image from 'next/image';

export default function LocaleNotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linku-bg px-5 py-20 text-center sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-6">
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
            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.22em] text-linku-coral/70">
              By LinkU Ventures
            </span>
          </span>
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
          404
        </p>
        <h1 className="max-w-md text-3xl font-bold tracking-tightish text-linku-text sm:text-4xl">
          Esta página no existe.
        </h1>
        <p className="max-w-md text-sm text-linku-text-muted sm:text-base">
          El link que seguiste no apunta a nada. Vuelve al inicio para encontrar lo
          que buscabas.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-linku-coral px-5 py-3 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
