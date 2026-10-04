'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, FlaskConical, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { campaignEmail } from '@/lib/email/templates';
import {
  DEFAULT_REPLY_TO,
  filterAudience,
  validateCampaignInput,
  type AudienceEntry
} from '@/lib/email/campaigns';
import { createCampaign, sendTestEmail, type Progress } from './actions';
import { runCampaign } from './runner';

export type TierOption = { slug: string; name: string; internal: boolean };

const INPUT =
  'w-full rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30';
const LABEL = 'text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted';
const LIST_CAP = 300;

export default function EmailsClient({
  audience,
  tiers
}: {
  audience: AudienceEntry[];
  tiers: TierOption[];
}) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [replyTo, setReplyTo] = useState(DEFAULT_REPLY_TO);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(tiers.map((t) => t.slug)));

  const [busy, setBusy] = useState<'test' | 'send' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const stopRef = useRef(false);

  const tierName = useMemo(() => new Map(tiers.map((t) => [t.slug, t.name])), [tiers]);
  const recipients = useMemo(
    () => filterAudience(audience, Array.from(selected)),
    [audience, selected]
  );
  const input = { subject, body, ctaLabel, ctaUrl, replyTo, tiers: Array.from(selected) };

  // Vista previa con un nombre de ejemplo (se renderiza en iframe aislado).
  const preview = useMemo(
    () =>
      campaignEmail({
        subject: subject || '(Asunto del correo)',
        body: body || '(Escribe el mensaje…)',
        ctaLabel,
        ctaUrl,
        firstName: 'Carolina'
      }),
    [subject, body, ctaLabel, ctaUrl]
  );

  function toggleTier(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    setConfirming(false);
  }

  async function onTest() {
    setFeedback(null);
    const v = validateCampaignInput(input);
    if (!v.ok) return setFeedback({ ok: false, text: v.message });
    setBusy('test');
    try {
      const r = await sendTestEmail(input);
      setFeedback({ ok: r.ok, text: r.message });
    } catch {
      setFeedback({ ok: false, text: 'No se pudo enviar la prueba. Inténtalo de nuevo.' });
    } finally {
      setBusy(null);
    }
  }

  function onAskConfirm() {
    setFeedback(null);
    const v = validateCampaignInput(input);
    if (!v.ok) return setFeedback({ ok: false, text: v.message });
    if (recipients.length === 0) {
      return setFeedback({ ok: false, text: 'No hay destinatarios con esas categorías.' });
    }
    setConfirming(true);
  }

  async function onConfirmSend() {
    setConfirming(false);
    setBusy('send');
    stopRef.current = false;
    setProgress(null);
    try {
      const created = await createCampaign(input);
      if (!created.ok) {
        setFeedback({ ok: false, text: created.message });
        return;
      }
      setProgress({
        total: created.total,
        sent: 0,
        failed: 0,
        queued: created.total,
        sending: 0,
        status: 'sending'
      });
      const res = await runCampaign(created.campaignId, setProgress, () => stopRef.current);
      setFeedback({
        ok: res.ok,
        text: res.message ?? 'Envío terminado. Revisa el resultado en el historial.'
      });
    } catch {
      setFeedback({
        ok: false,
        text: 'Se interrumpió la conexión. Revisa el historial: si la campaña quedó en curso, puedes continuarla.'
      });
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  const sending = busy === 'send';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="linku-card space-y-5 p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
          Nuevo correo
        </h2>

        <div className="space-y-1.5">
          <label className={LABEL} htmlFor="em-subject">Asunto</label>
          <input id="em-subject" className={INPUT} value={subject} maxLength={150}
            disabled={sending} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className={LABEL} htmlFor="em-body">Mensaje</label>
          <textarea id="em-body" className={`${INPUT} min-h-[220px]`} value={body}
            disabled={sending} onChange={(e) => setBody(e.target.value)} />
          <p className="text-xs text-linku-text-dim">
            Texto plano. Deja una línea en blanco para separar párrafos; los saltos de línea se
            respetan. Escribe <code>{'{{nombre}}'}</code> donde quieras el primer nombre de cada
            persona (ej. &quot;Hola {'{{nombre}}'},&quot;). Si no tenemos su nombre, se omite y
            queda &quot;Hola,&quot;. No se interpreta HTML.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={LABEL} htmlFor="em-cta-label">Botón: texto (opcional)</label>
            <input id="em-cta-label" className={INPUT} value={ctaLabel} maxLength={60}
              disabled={sending} onChange={(e) => setCtaLabel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL} htmlFor="em-cta-url">Botón: enlace https</label>
            <input id="em-cta-url" className={INPUT} value={ctaUrl} placeholder="https://"
              disabled={sending} onChange={(e) => setCtaUrl(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={LABEL} htmlFor="em-reply">Responder a</label>
          <input id="em-reply" type="email" className={INPUT} value={replyTo}
            disabled={sending} onChange={(e) => setReplyTo(e.target.value)} />
        </div>

        <fieldset className="space-y-2" disabled={sending}>
          <legend className={LABEL}>Categorías de entrada</legend>
          <div className="flex flex-wrap gap-2">
            {tiers.map((t) => (
              <label key={t.slug}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-linku-border-2 bg-linku-bg-3 px-3 py-1.5 text-sm text-linku-text">
                <input type="checkbox" checked={selected.has(t.slug)}
                  onChange={() => toggleTier(t.slug)} />
                {t.name}
                {t.internal && <span className="text-[10px] text-linku-text-dim">(interna)</span>}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="rounded-xl border border-linku-border bg-linku-bg-3/50 p-4">
          <p className="text-sm font-semibold text-linku-text">
            {recipients.length} destinatario{recipients.length === 1 ? '' : 's'}
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-linku-text-muted">
              Ver lista (nombre · correo · categorías)
            </summary>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-xs text-linku-text-muted">
              {recipients.slice(0, LIST_CAP).map((r) => (
                <li key={r.email}>
                  <span className="text-linku-text">{r.name || '(sin nombre)'}</span> · {r.email} ·{' '}
                  {r.tiers.map((s) => tierName.get(s) ?? s).join(', ')}
                </li>
              ))}
              {recipients.length > LIST_CAP && (
                <li>… y {recipients.length - LIST_CAP} más.</li>
              )}
            </ul>
          </details>
        </div>

        {feedback && (
          <p className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            feedback.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}>
            {feedback.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
            <span>{feedback.text}</span>
          </p>
        )}

        {progress && (
          <div className="rounded-xl border border-linku-border bg-linku-bg-3/50 p-4 text-sm text-linku-text">
            <div className="h-2 overflow-hidden rounded-full bg-linku-bg">
              <div className="h-full bg-linku-coral transition-all"
                style={{ width: `${progress.total ? ((progress.sent + progress.failed) / progress.total) * 100 : 0}%` }} />
            </div>
            <p className="mt-2">
              Enviados {progress.sent} · Fallidos {progress.failed} · Total {progress.total}
            </p>
            {sending && (
              <>
                <p className="mt-1 text-xs text-linku-text-dim">
                  No cierres esta pestaña. Si la cierras, continúa desde el historial.
                </p>
                <button type="button" onClick={() => { stopRef.current = true; }}
                  className="mt-2 text-xs underline text-linku-text-muted">
                  Pausar
                </button>
              </>
            )}
          </div>
        )}

        {confirming ? (
          <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-100">
              Vas a enviar a {recipients.length} persona{recipients.length === 1 ? '' : 's'}.
              ¿Confirmas?
            </p>
            <p className="text-xs text-amber-200/80">
              Asunto: {subject}. El envío no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onConfirmSend}
                className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-5 py-2.5 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft">
                <Send size={16} /> Sí, enviar
              </button>
              <button type="button" onClick={() => setConfirming(false)}
                className="rounded-xl border border-linku-border-2 px-5 py-2.5 text-sm text-linku-text-muted">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onTest} disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-linku-border-2 px-5 py-2.5 text-sm font-semibold text-linku-text transition hover:bg-white/5 disabled:opacity-50">
              {busy === 'test' ? <Loader2 size={16} className="animate-spin" /> : <FlaskConical size={16} />}
              Enviarme una prueba
            </button>
            <button type="button" onClick={onAskConfirm} disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-5 py-2.5 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Enviando…' : 'Crear y enviar'}
            </button>
          </div>
        )}
      </div>

      <div className="linku-card p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
          Vista previa
        </h2>
        <p className="mt-1 text-xs text-linku-text-dim">Con el nombre de ejemplo &quot;Carolina&quot;.</p>
        <iframe title="Vista previa del correo" srcDoc={preview.html} sandbox=""
          className="mt-4 h-[640px] w-full rounded-xl border border-linku-border bg-[#050814]" />
      </div>
    </div>
  );
}
