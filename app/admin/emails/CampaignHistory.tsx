'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Play, RotateCcw, ChevronDown } from 'lucide-react';
import {
  getCampaignRecipients,
  requeueRecipients,
  type Progress,
  type RecipientRow
} from './actions';
import { runCampaign } from './runner';

export type CampaignRow = {
  id: string;
  subject: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_by_email: string | null;
  created_at: string;
  sent_at: string | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Borrador', cls: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300' },
  sending: { label: 'En curso', cls: 'border-amber-500/30 bg-amber-500/15 text-amber-300' },
  sent: { label: 'Enviada', cls: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' },
  partial: { label: 'Con fallidos', cls: 'border-red-500/30 bg-red-500/15 text-red-300' }
};
const R_STATUS: Record<string, string> = {
  queued: 'En cola',
  sending: 'Enviando',
  sent: 'Enviado',
  failed: 'Fallido'
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function Row({ c }: { c: CampaignRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RecipientRow[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const stopRef = useRef(false);
  const st = STATUS[c.status] ?? STATUS.draft;

  async function loadDetail() {
    const r = await getCampaignRecipients(c.id);
    if (r.ok) {
      setRows(r.rows);
      setTruncated(r.truncated);
    } else setMsg(r.message);
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !rows) await loadDetail();
  }

  async function onContinue() {
    setBusy(true);
    setMsg(null);
    stopRef.current = false;
    try {
      const res = await runCampaign(c.id, setProgress, () => stopRef.current);
      setMsg(res.message ?? 'Listo.');
    } catch {
      setMsg('Se interrumpió la conexión; vuelve a intentar.');
    } finally {
      setBusy(false);
      if (open) await loadDetail();
      router.refresh();
    }
  }

  async function onRequeue(mode: 'stale' | 'failed') {
    if (
      mode === 'stale' &&
      !window.confirm(
        'Esto devuelve a la cola a quienes quedaron "enviando" por un corte hace más de 10 minutos. Si Resend sí envió esos correos, esas personas podrían recibirlo dos veces (la llave de idempotencia lo minimiza). ¿Continuar?'
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const r = await requeueRecipients(c.id, mode);
      setMsg(r.message);
      if (r.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border-b border-linku-border last:border-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-linku-text">{c.subject}</p>
          <p className="text-xs text-linku-text-dim">
            {fmtDate(c.created_at)} · {c.created_by_email || '—'}
          </p>
        </div>
        <p className="text-xs text-linku-text-muted">
          {progress ? progress.sent : c.sent_count} enviados ·{' '}
          {progress ? progress.failed : c.failed_count} fallidos · {c.total_recipients} total
        </p>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${st.cls}`}>
          {st.label}
        </span>
        <button type="button" onClick={toggle}
          className="inline-flex items-center gap-1 text-xs text-linku-text-muted underline">
          Detalle <ChevronDown size={12} className={open ? 'rotate-180' : ''} />
        </button>
      </div>

      {(c.status === 'sending' || c.status === 'partial') && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {c.status === 'sending' && (
            <button type="button" disabled={busy} onClick={onContinue}
              className="inline-flex items-center gap-1.5 rounded-lg bg-linku-coral px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              Continuar envío
            </button>
          )}
          {c.status === 'sending' && (
            <button type="button" disabled={busy} onClick={() => onRequeue('stale')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-linku-border-2 px-3 py-1.5 text-xs text-linku-text-muted disabled:opacity-50">
              <RotateCcw size={12} /> Reintentar pendientes en corte (+10 min)
            </button>
          )}
          {c.failed_count > 0 && (
            <button type="button" disabled={busy} onClick={() => onRequeue('failed')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-linku-border-2 px-3 py-1.5 text-xs text-linku-text-muted disabled:opacity-50">
              <RotateCcw size={12} /> Reintentar fallidos
            </button>
          )}
          {busy && (
            <button type="button" onClick={() => { stopRef.current = true; }}
              className="text-xs underline text-linku-text-muted">Pausar</button>
          )}
        </div>
      )}
      {msg && <p className="px-4 pb-3 text-xs text-linku-text-muted">{msg}</p>}

      {open && (
        <div className="px-4 pb-4">
          {!rows ? (
            <p className="text-xs text-linku-text-dim">Cargando…</p>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-linku-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-linku-bg-3/40 text-linku-text-dim">
                  <tr>
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Correo</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-linku-border text-linku-text-muted">
                  {rows.map((r) => (
                    <tr key={r.email}>
                      <td className="px-3 py-1.5">{r.name || '—'}</td>
                      <td className="px-3 py-1.5">{r.email}</td>
                      <td className="px-3 py-1.5">{R_STATUS[r.status] ?? r.status}</td>
                      <td className="px-3 py-1.5 text-red-300">{r.error || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {truncated && (
                <p className="px-3 py-2 text-linku-text-dim">Se muestran los primeros 2000.</p>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function CampaignHistory({ campaigns }: { campaigns: CampaignRow[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
        Historial de campañas
      </h2>
      <p className="mt-2 max-w-2xl text-xs text-linku-text-dim">
        Si una campaña quedó &quot;En curso&quot; porque se cerró la pestaña, usa &quot;Continuar
        envío&quot;. &quot;Reintentar pendientes en corte&quot; puede duplicar un correo si Resend
        sí lo había enviado.
      </p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-linku-border bg-linku-bg-2">
        {campaigns.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-linku-text-muted">
            Aún no hay campañas.
          </p>
        ) : (
          <ul>
            {campaigns.map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
