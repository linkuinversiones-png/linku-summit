'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { changeOrderStatus, retryIncontacto, type OrderActionResult } from './actions';
import { OTHER_REASONS, PAID_REASONS } from '@/lib/orders/status-log';

type Props = {
  orderId: string;
  status: string;
  canMarkPaid: boolean;
  incontactoStatus: 'sent' | 'error' | 'skipped' | null;
};

const OTHER_TARGETS = [
  { value: 'refunded', label: 'Reembolsada' },
  { value: 'failed', label: 'Fallida' },
  { value: 'expired', label: 'Expirada' },
  { value: 'pending', label: 'Pendiente' }
];

const INPUT =
  'w-full rounded-lg border border-linku-border-2 bg-linku-bg-3 px-3 py-2 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30';

/**
 * Cambio de estado de una venta. El motivo es obligatorio porque queda en
 * la bitácora: sin él no se puede auditar por qué una venta sin pago en la
 * pasarela terminó marcada como pagada.
 */
export default function StatusPanel({
  orderId,
  status,
  canMarkPaid,
  incontactoStatus
}: Props) {
  const [mode, setMode] = useState<'paid' | 'other'>(canMarkPaid ? 'paid' : 'other');
  const [reason, setReason] = useState<string>(
    canMarkPaid ? PAID_REASONS[0].value : OTHER_REASONS[0].value
  );
  const [toStatus, setToStatus] = useState<string>(
    OTHER_TARGETS.find((t) => t.value !== status)?.value ?? 'refunded'
  );
  const [note, setNote] = useState('');
  const [result, setResult] = useState<OrderActionResult | null>(null);
  const [pending, start] = useTransition();

  const reasons = mode === 'paid' ? PAID_REASONS : OTHER_REASONS;
  const selected = reasons.find((r) => r.value === reason) ?? reasons[0];
  const target = mode === 'paid' ? 'paid' : toStatus;

  function switchMode(next: 'paid' | 'other') {
    setMode(next);
    setReason(next === 'paid' ? PAID_REASONS[0].value : OTHER_REASONS[0].value);
    setResult(null);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const label = mode === 'paid' ? 'PAGADA' : target.toUpperCase();
    if (
      !confirm(
        `Vas a mover esta venta a ${label} por "${selected.label}".` +
          (mode === 'paid'
            ? '\n\nSe va a emitir la boleta con QR, registrar al asistente en InContacto y enviar el correo al comprador.'
            : '') +
          '\n\nQueda registrado en la bitácora a tu nombre. ¿Continuar?'
      )
    ) {
      return;
    }
    start(async () => {
      const res = await changeOrderStatus({
        orderId,
        toStatus: target,
        reason,
        note
      });
      setResult(res);
      if (res.ok) setNote('');
    });
  }

  function onRetry() {
    start(async () => {
      setResult(await retryIncontacto(orderId));
    });
  }

  return (
    <section className="rounded-2xl border border-linku-border-2 bg-linku-bg-2 p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-linku-coral">
        Cambiar estado
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => switchMode('paid')}
          disabled={!canMarkPaid}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            mode === 'paid'
              ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
              : 'border-linku-border-2 text-linku-text-muted hover:border-white/25 hover:text-linku-text'
          }`}
        >
          Marcar como pagada
        </button>
        <button
          type="button"
          onClick={() => switchMode('other')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            mode === 'other'
              ? 'border-linku-coral/50 bg-linku-coral/10 text-linku-coral'
              : 'border-linku-border-2 text-linku-text-muted hover:border-white/25 hover:text-linku-text'
          }`}
        >
          Otro estado
        </button>
      </div>

      {!canMarkPaid && mode === 'paid' && (
        <p className="mt-3 text-xs text-linku-text-dim">
          Esta venta ya está pagada o reembolsada, así que no se puede volver a marcar como
          pagada.
        </p>
      )}

      <form onSubmit={submit} className="mt-4 space-y-4">
        {mode === 'other' && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
              Nuevo estado
            </span>
            <select
              value={toStatus}
              onChange={(e) => setToStatus(e.target.value)}
              className={INPUT}
            >
              {OTHER_TARGETS.filter((t) => t.value !== status).map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
            ¿Por qué cambias el estado? *
          </span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={INPUT}
          >
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-linku-text-dim">{selected.help}</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
            Nota {reason === 'otro' ? '*' : '(opcional)'}
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Quién autorizó, número de recibo, contexto…"
            className={INPUT}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-linku-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-linku-coral-soft disabled:opacity-50"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : null}
          {pending ? 'Guardando…' : 'Guardar cambio'}
        </button>
      </form>

      {status === 'paid' && (
        <div className="mt-5 border-t border-linku-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
              InContacto
            </span>
            <button
              type="button"
              onClick={onRetry}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-linku-border-2 px-2.5 py-1.5 text-xs font-medium text-linku-text-muted transition hover:border-white/25 hover:text-linku-text disabled:opacity-40"
            >
              <RefreshCw size={12} />
              {incontactoStatus === 'sent' ? 'Reenviar' : 'Reintentar envío'}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-xs ${
            result.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          <p className="flex items-start gap-1.5">
            {result.ok ? (
              <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            )}
            {result.message}
          </p>
          {result.ok && result.warnings && result.warnings.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-emerald-500/20 pt-2 text-amber-200">
              {result.warnings.map((w, i) => (
                <li key={i}>· {w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
