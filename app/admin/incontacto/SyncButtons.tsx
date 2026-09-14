'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Send } from 'lucide-react';
import { syncOne, syncPending, type IncontactoActionResult } from './actions';

const BTN =
  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40';

/** Botón por fila: enviar o reenviar un asistente. */
export function SyncOneButton({
  orderId,
  alreadySent,
  disabled,
  title
}: {
  orderId: string;
  alreadySent: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<IncontactoActionResult | null>(null);

  function run() {
    start(async () => {
      const res = await syncOne(orderId);
      setResult(res);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={disabled || pending}
        title={title}
        className={`${BTN} ${
          alreadySent
            ? 'border-linku-border-2 text-linku-text-muted hover:border-white/25 hover:text-linku-text'
            : 'border-linku-coral/50 bg-linku-coral/10 text-linku-coral hover:bg-linku-coral/20'
        }`}
      >
        {pending ? <Loader2 size={12} className="animate-spin" /> : alreadySent ? <RefreshCw size={12} /> : <Send size={12} />}
        {pending ? 'Enviando…' : alreadySent ? 'Reenviar' : 'Enviar'}
      </button>
      {result && (
        <span
          className={`max-w-[260px] text-right text-[11px] ${
            result.ok ? 'text-emerald-300' : 'text-red-300'
          }`}
        >
          {result.message}
        </span>
      )}
    </div>
  );
}

/** Botón de cabecera: enviar todo lo que falte. */
export function SyncPendingButton({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<IncontactoActionResult | null>(null);

  function run() {
    if (
      !confirm(
        `Vas a enviar a InContacto ${pendingCount} asistente(s) que aún no están confirmados allá. Las que ya están enviadas no se tocan. ¿Continuar?`
      )
    ) {
      return;
    }
    start(async () => {
      const res = await syncPending();
      setResult(res);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending || pendingCount === 0}
        className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-4 py-2.5 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {pending ? 'Enviando…' : `Enviar las ${pendingCount} que faltan`}
      </button>
      {result && (
        <p
          className={`flex items-center gap-1.5 text-xs ${
            result.ok ? 'text-emerald-300' : 'text-red-300'
          }`}
        >
          {result.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          {result.message}
        </p>
      )}
    </div>
  );
}
