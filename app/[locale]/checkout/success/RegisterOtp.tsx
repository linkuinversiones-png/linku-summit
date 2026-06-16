'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, KeyRound, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { claimMyOrders } from '../actions';

type Copy = {
  title: string;
  lead: string; // usa {email}
  sendCode: string;
  sending: string;
  codeLabel: string;
  verify: string;
  verifying: string;
  viewTicket: string;
  loggedInLead: string;
};

type Step = 'intro' | 'code' | 'authed';
type Status = 'idle' | 'sending' | 'verifying';

export default function RegisterOtp({
  email,
  meHref,
  copy
}: {
  email: string;
  meHref: string;
  copy: Copy;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intro');
  const [status, setStatus] = useState<Status>('idle');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // Si ya hay sesión, vinculamos las órdenes de una vez.
  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (active && user) {
        await claimMyOrders();
        setStep('authed');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function sendCode() {
    setStatus('sending');
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    if (err) {
      setError(err.message);
      setStatus('idle');
      return;
    }
    setStep('code');
    setStatus('idle');
  }

  async function verify() {
    const token = code.trim();
    if (token.length < 6) return;
    setStatus('verifying');
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    if (err) {
      setError(err.message);
      setStatus('idle');
      return;
    }
    await claimMyOrders();
    router.push(meHref);
    router.refresh();
  }

  if (step === 'authed') {
    return (
      <div className="mt-8 rounded-xl border border-linku-coral/30 bg-linku-coral/5 p-5 text-center">
        <p className="text-sm text-linku-text-muted">{copy.loggedInLead}</p>
        <a
          href={meHref}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-linku-coral px-5 py-3 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft"
        >
          {copy.viewTicket}
          <ArrowRight size={16} />
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-sm rounded-xl border border-linku-border bg-linku-bg-3/40 p-5 text-left">
      <p className="text-sm font-bold text-linku-text">{copy.title}</p>
      <p className="mt-1 text-xs text-linku-text-muted">
        {copy.lead.replace('{email}', email)}
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}

      {step === 'intro' ? (
        <button
          type="button"
          onClick={sendCode}
          disabled={status === 'sending'}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linku-coral px-5 py-3 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft disabled:opacity-50"
        >
          {status === 'sending' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {copy.sending}
            </>
          ) : (
            copy.sendCode
          )}
        </button>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-linku-text-muted">
              {copy.codeLabel}
            </span>
            <div className="relative">
              <KeyRound
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-linku-text-dim"
              />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-xl border border-linku-border-2 bg-linku-bg-3 py-3 pl-10 pr-4 text-center text-lg tracking-[0.4em] text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/60 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
              />
            </div>
          </label>
          <button
            type="button"
            onClick={verify}
            disabled={status === 'verifying' || code.trim().length < 6}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linku-coral px-5 py-3 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft disabled:opacity-50"
          >
            {status === 'verifying' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {copy.verifying}
              </>
            ) : (
              <>
                {copy.verify}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
