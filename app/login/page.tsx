import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Iniciar sesión · LINKU SUMMIT 2026',
  description: 'Accede a tu cuenta del LinkU Summit 2026.'
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: { next?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect(searchParams.next ?? '/me');
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linku-bg px-5 py-12 sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60"
        aria-hidden
      />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-10 flex items-center justify-center gap-3" aria-label="Volver al inicio">
          <Image
            src="/brand/linku-icon.png"
            alt="LinkU"
            width={80}
            height={80}
            className="h-11 w-11"
            priority
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

        <div className="linku-card p-7 sm:p-9">
          <h1 className="text-2xl font-bold tracking-tightish text-linku-text sm:text-3xl">
            Inicia sesión
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-linku-text-muted sm:text-base">
            Te enviamos un enlace mágico a tu email. Click en el enlace y entras directo, sin contraseñas.
          </p>
          <div className="mt-7">
            <LoginForm nextPath={searchParams.next} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-linku-text-dim">
          Si todavía no tienes cuenta, te creamos una automáticamente al iniciar.
        </p>
      </div>
    </main>
  );
}
