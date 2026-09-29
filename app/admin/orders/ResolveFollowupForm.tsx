'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { resolveFollowup, type OrderActionResult } from './actions';
import { FOLLOWUP_RESOLUTIONS } from '@/lib/admin/followups';

const INPUT =
  'w-full rounded-lg border border-linku-border-2 bg-linku-bg-3 px-3 py-2 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30';

/** Botón + formulario para cerrar un caso de "Por resolver". */
export default function ResolveFollowupForm({
  buyerKey,
  buyerEmail,
  buyerName
}: {
  buyerKey: string;
  buyerEmail: string | null;
  buyerName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<OrderActionResult | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    start(async () => {
      const res = await resolveFollowup({ buyerKey, buyerEmail, buyerName, resolution, note });
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
        <CheckCircle2 size={14} /> {result.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-linku-border-2 px-3 py-1.5 text-xs font-semibold text-linku-text-muted transition hover:border-white/25 hover:text-linku-text"
      >
        Marcar como resuelto
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 w-full space-y-3 rounded-xl border border-linku-border-2 bg-linku-bg-3 p-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
          Motivo *
        </span>
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          required
          className={INPUT}
        >
          <option value="">Elige un motivo…</option>
          {FOLLOWUP_RESOLUTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
          Nota {resolution === 'otro' ? '*' : '(opcional)'}
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required={resolution === 'otro'}
          rows={2}
          maxLength={1000}
          className={INPUT}
        />
      </label>
      {result && !result.ok && <p className="text-xs text-red-300">{result.message}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !resolution}
          className="inline-flex items-center gap-2 rounded-lg bg-linku-coral px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-linku-coral-soft disabled:opacity-50"
        >
          {pending && <Loader2 size={12} className="animate-spin" />} Guardar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-linku-border-2 px-3 py-1.5 text-xs font-medium text-linku-text-muted hover:text-linku-text"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
