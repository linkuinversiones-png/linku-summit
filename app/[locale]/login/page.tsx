import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { localizePath, type Locale } from '@/lib/i18n/config';
import { getContent } from '@/lib/i18n/content';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'LINKU SUMMIT 2026'
};

export default async function LoginPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { next?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect(searchParams.next ?? localizePath('/me', params.locale));
  }

  const t = getContent(params.locale).ui.login;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linku-bg px-5 py-12 sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60"
        aria-hidden
      />
      <div className="relative w-full max-w-md">
        <Link
          href={localizePath('/', params.locale)}
          className="mb-10 flex items-center justify-center gap-3"
          aria-label={t.backHome}
        >
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
            {t.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-linku-text-muted sm:text-base">
            {t.lead}
          </p>
          <div className="mt-7">
            <LoginForm nextPath={searchParams.next} locale={params.locale} t={t} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-linku-text-dim">
          {t.noAccount}
        </p>
      </div>
    </main>
  );
}
