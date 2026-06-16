'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, ArrowRight, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { localizePath, type Locale } from '@/lib/i18n/config';
import type { UiContent } from '@/lib/i18n/content';

type Step = 'email' | 'code';
type Status = 'idle' | 'sending' | 'verifying' | 'error';

export default function LoginForm({
  nextPath,
  locale,
  t
}: {
  nextPath?: string;
  locale: Locale;
  t: UiContent['login'];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function sendCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    setErrorMsg('');

    const supabase = createClient();
    // Sin emailRedirectTo → Supabase envía un CÓDIGO OTP (no magic link).
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });

    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
      return;
    }
    setStep('code');
    setStatus('idle');
  }

  async function verifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = code.trim();
    if (token.length < 6) return;
    setStatus('verifying');
    setErrorMsg('');

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
      return;
    }
    // Sesión creada. Vamos a donde tocaba (o /me).
    router.push(nextPath ?? localizePath('/me', locale));
    router.refresh();
  }

  if (step === 'code') {
    return (
      <form onSubmit={verifyCode} className="flex flex-col gap-4">
        <div className="rounded-xl border border-linku-coral/30 bg-linku-coral/5 p-4 text-center">
          <Mail size={24} className="mx-auto text-linku-coral" strokeWidth={1.75} />
          <p className="mt-2 text-sm text-linku-text-muted">
            {t.codeSentBody.replace('{email}', email)}
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-linku-text-muted">
            {t.codeLabel}
          </span>
          <div className="relative">
            <KeyRound
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-linku-text-dim"
            />
            <input
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              disabled={status === 'verifying'}
              className="w-full rounded-xl border border-linku-border-2 bg-linku-bg-3 py-3 pl-10 pr-4 text-center text-lg tracking-[0.4em] text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/60 focus:outline-none focus:ring-2 focus:ring-linku-coral/30 disabled:opacity-60"
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
          disabled={status === 'verifying' || code.trim().length < 6}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-linku-coral px-6 py-3 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft hover:shadow-coral-glow-strong focus:outline-none focus:ring-2 focus:ring-linku-coral/60 disabled:opacity-50"
        >
          {status === 'verifying' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t.verifying}
            </>
          ) : (
            <>
              {t.verify}
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep('email');
            setCode('');
            setStatus('idle');
            setErrorMsg('');
          }}
          className="text-xs font-medium uppercase tracking-[0.18em] text-linku-coral hover:text-linku-coral-soft"
        >
          {t.useOther}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="flex flex-col gap-4">
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
