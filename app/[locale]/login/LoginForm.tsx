'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { localizePath, type Locale } from '@/lib/i18n/config';
import type { UiContent } from '@/lib/i18n/content';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function LoginForm({
  nextPath,
  locale,
  t
}: {
  nextPath?: string;
  locale: Locale;
  t: UiContent['login'];
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    setErrorMsg('');

    const supabase = createClient();
    const callbackPath = localizePath('/auth/callback', locale);
    const redirectTo = `${window.location.origin}${callbackPath}${
      nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''
    }`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
      return;
    }
    setStatus('sent');
  }

  if (status === 'sent') {
    return (
      <div className="rounded-xl border border-linku-coral/30 bg-linku-coral/5 p-5 text-center">
        <CheckCircle2 size={28} className="mx-auto text-linku-coral" strokeWidth={1.75} />
        <p className="mt-3 text-base font-semibold text-linku-text">
          {t.sentTitle}
        </p>
        <p className="mt-2 text-sm text-linku-text-muted">
          {t.sentBody.replace('{email}', email)}
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setEmail('');
          }}
          className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-linku-coral hover:text-linku-coral-soft"
        >
          {t.useOther}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-linku-text-muted">
          {t.emailLabel}
        </span>
        <div className="relative">
          <Mail
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-linku-text-dim"
          />
          <input
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'sending'}
            className="w-full rounded-xl border border-linku-border-2 bg-linku-bg-3 py-3 pl-10 pr-4 text-base text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/60 focus:outline-none focus:ring-2 focus:ring-linku-coral/30 disabled:opacity-60"
          />
        </div>
      </label>

      {errorMsg && (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending' || !email}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-linku-coral px-6 py-3 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft hover:shadow-coral-glow-strong focus:outline-none focus:ring-2 focus:ring-linku-coral/60 disabled:opacity-50"
      >
        {status === 'sending' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {t.submitting}
          </>
        ) : (
          <>
            {t.submit}
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}
