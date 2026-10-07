'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, FlaskConical, AlertTriangle, CheckCircle2, X, Users } from 'lucide-react';
import { campaignEmail } from '@/lib/email/templates';
import {
  DEFAULT_CLOSING_TEXT,
  DEFAULT_REPLY_TO,
  filterAudience,
  validateCampaignInput,
  type AudienceEntry
} from '@/lib/email/campaigns';
import { createCampaign, sendTestEmail, sendTestToRecipients, type Progress } from './actions';
import { runCampaign } from './runner';

export type TierOption = { slug: string; name: string; internal: boolean };

const INPUT =
  'w-full rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30';
const LABEL = 'text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted';
const LIST_CAP = 300;
const MAX_TEST_PEOPLE = 5;

export default function EmailsClient({
  audience,
  tiers
}: {
  audience: AudienceEntry[];
  tiers: TierOption[];
}) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [includeMap, setIncludeMap] = useState(false);
  const [boxTitle, setBoxTitle] = useState('');
  const [boxIntro, setBoxIntro] = useState('');
  const [boxLines, setBoxLines] = useState('');
  const [closing, setClosing] = useState(DEFAULT_CLOSING_TEXT);
  const [replyTo, setReplyTo] = useState(DEFAULT_REPLY_TO);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(tiers.map((t) => t.slug)));

  const [busy, setBusy] = useState<'test' | 'send' | null>(null);
  // Prueba a personas específicas (selección sobre TODA la audiencia).
  const [query, setQuery] = useState('');
  const [testPeople, setTestPeople] = useState<AudienceEntry[]>([]);
  const [confirmingTest, setConfirmingTest] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const stopRef = useRef(false);

  const tierName = useMemo(() => new Map(tiers.map((t) => [t.slug, t.name])), [tiers]);
  const recipients = useMemo(
    () => filterAudience(audience, Array.from(selected)),
    [audience, selected]
  );
  const input = {
    subject,
    title,
    body,
    ctaLabel,
    ctaUrl,
    replyTo,
    tiers: Array.from(selected),
    includeMap,
    boxTitle,
    boxIntro,
    boxLines,
    closing
  };

  // Vista previa con un nombre de ejemplo (se renderiza en iframe aislado).
  const preview = useMemo(
    () =>
      campaignEmail({
        subject: subject || '(Asunto del correo)',
        title,
        imageBase: '/email',
        body: body || '(Escribe el mensaje…)',
        ctaLabel,
        ctaUrl,
        firstName: 'Carolina',
        email: 'carolina@ejemplo.com',
        includeMap,
        boxTitle,
        boxIntro,
        boxLines,
        closing
      }),
    [subject, title, body, ctaLabel, ctaUrl, includeMap, boxTitle, boxIntro, boxLines, closing]
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

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return audience
      .filter(
        (a) =>
          !testPeople.some((p) => p.email === a.email) &&
          (a.email.includes(q) || a.name.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [audience, query, testPeople]);

  function addTestPerson(a: AudienceEntry) {
    setTestPeople((prev) => (prev.length >= MAX_TEST_PEOPLE ? prev : [...prev, a]));
    setQuery('');
    setConfirmingTest(false);
  }

  function onAskConfirmTest() {
    setFeedback(null);
    const v = validateCampaignInput(input);
    if (!v.ok) return setFeedback({ ok: false, text: v.message });
    setConfirmingTest(true);
  }

  async function onConfirmTest() {
    setConfirmingTest(false);
    setBusy('test');
    try {
      const r = await sendTestToRecipients(testPeople.map((p) => p.email), input);
      if (!r.ok) return setFeedback({ ok: false, text: r.message });
      const bad = r.results.filter((x) => !x.ok).length;
      setFeedback({
        ok: bad === 0,
        text: r.results
          .map((x) => `${x.ok ? 'Enviada' : 'FALLÓ'} a ${x.email}: ${x.detail}`)
          .join(' · ')
      });
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
          <label className={LABEL} htmlFor="em-title">Título (opcional)</label>
          <input id="em-title" className={INPUT} value={title} maxLength={150}
            disabled={sending} onChange={(e) => setTitle(e.target.value)} />
          <p className="text-xs text-linku-text-dim">
            Es el titular grande del correo. Si lo dejas vacío se usa el asunto.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className={LABEL} htmlFor="em-body">Mensaje</label>
          <textarea id="em-body" className={`${INPUT} min-h-[220px]`} value={body}
            disabled={sending} onChange={(e) => setBody(e.target.value)} />
          <div className="space-y-1 text-xs text-linku-text-dim">
            <p>
              Texto plano; no se interpreta HTML. Separa los bloques con una línea en blanco.
              Escribe <code>{'{{nombre}}'}</code> (primer nombre) o <code>{'{{correo}}'}</code>{' '}
              donde quieras. Formato opcional, al inicio de la línea:
            </p>
            <ul className="list-disc space-y-0.5 pl-5">
              <li><code># TÍTULO</code> encabezado de sección (coral, centrado, mayúsculas)</li>
              <li><code>## Subtítulo</code> subtítulo en negrita (seguido de su texto en la línea de abajo)</li>
              <li><code>&gt; Frase</code> frase destacada, centrada y en grande</li>
              <li><code>^ Texto</code> párrafo centrado (cada línea con ^)</li>
              <li><code>[Texto del botón](https://enlace)</code> botón, solo en su línea (puedes poner varios; solo https)</li>
              <li><code>---</code> línea separadora</li>
              <li><code>@redes</code> solo en su línea: íconos de Instagram y LinkedIn de LinkU, con enlace</li>
              <li><code>**negrita**</code> dentro de un párrafo</li>
            </ul>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text">
          <input type="checkbox" checked={includeMap} disabled={sending}
            onChange={(e) => setIncludeMap(e.target.checked)} />
          Incluir <strong>Cómo llegar</strong> (mapa del Country Club)
        </label>

        <div className="space-y-4 rounded-xl border border-linku-border bg-linku-bg-3/50 p-4">
          <p className={LABEL}>Recuadro destacado (opcional)</p>
          <div className="space-y-1.5">
            <label className={LABEL} htmlFor="em-box-title">Título del recuadro</label>
            <input id="em-box-title" className={INPUT} value={boxTitle} maxLength={80}
              placeholder="Ej. Tus citas 1:1" disabled={sending}
              onChange={(e) => setBoxTitle(e.target.value)} />
            <p className="text-xs text-linku-text-dim">Se muestra en mayúsculas, en coral.</p>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL} htmlFor="em-box-intro">Texto del recuadro</label>
            <textarea id="em-box-intro" className={`${INPUT} min-h-[90px]`} value={boxIntro}
              maxLength={1000} disabled={sending} onChange={(e) => setBoxIntro(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL} htmlFor="em-box-lines">Líneas del recuadro</label>
            <textarea id="em-box-lines" className={`${INPUT} min-h-[90px]`} value={boxLines}
              maxLength={1500} disabled={sending} onChange={(e) => setBoxLines(e.target.value)} />
            <p className="text-xs text-linku-text-dim">
              Una por línea, con el formato <code>Etiqueta: valor</code> (la etiqueta sale en
              coral y negrita; ej. <code>Usuario: {'{{correo}}'}</code>). Una línea sin dos puntos
              se muestra tal cual. También sirven <code>{'{{nombre}}'}</code> y{' '}
              <code>{'{{correo}}'}</code>.
            </p>
          </div>
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
          <label className={LABEL} htmlFor="em-closing">Frase de cierre</label>
          <input id="em-closing" className={INPUT} value={closing} maxLength={150}
            disabled={sending} onChange={(e) => setClosing(e.target.value)} />
          <p className="text-xs text-linku-text-dim">
            Va al final, antes del contacto. Déjala vacía para no mostrar ninguna.
          </p>
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

        <div className="space-y-3 rounded-xl border border-linku-border bg-linku-bg-3/50 p-4">
          <p className={LABEL}>Enviar prueba a personas específicas (máx. {MAX_TEST_PEOPLE})</p>
          <input className={INPUT} value={query} placeholder="Buscar por nombre o correo…"
            disabled={sending || testPeople.length >= MAX_TEST_PEOPLE}
            onChange={(e) => setQuery(e.target.value)} />
          {matches.length > 0 && (
            <ul className="max-h-48 overflow-y-auto rounded-lg border border-linku-border-2 text-xs">
              {matches.map((a) => (
                <li key={a.email}>
                  <button type="button" onClick={() => addTestPerson(a)}
                    className="w-full px-3 py-2 text-left text-linku-text-muted hover:bg-white/5">
                    <span className="text-linku-text">{a.name || '(sin nombre)'}</span> · {a.email} ·{' '}
                    {a.tiers.map((s) => tierName.get(s) ?? s).join(', ')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {testPeople.length > 0 && (
            <ul className="space-y-1">
              {testPeople.map((p) => (
                <li key={p.email}
                  className="flex items-center justify-between gap-2 rounded-lg bg-linku-bg px-3 py-1.5 text-xs text-linku-text-muted">
                  <span><span className="text-linku-text">{p.name || '(sin nombre)'}</span> · {p.email}</span>
                  <button type="button" aria-label={`Quitar ${p.email}`} disabled={busy !== null}
                    onClick={() => { setTestPeople((prev) => prev.filter((x) => x.email !== p.email)); setConfirmingTest(false); }}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {confirmingTest ? (
            <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
              <p className="text-sm font-semibold text-amber-100">
                Se enviará [PRUEBA] &quot;{subject}&quot; a:{' '}
                {testPeople.map((p) => `${p.name || '(sin nombre)'} <${p.email}>`).join(', ')}.
                ¿Confirmas?
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={onConfirmTest}
                  className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-4 py-2 text-sm font-semibold text-white">
                  <Send size={16} /> Sí, enviar prueba
                </button>
                <button type="button" onClick={() => setConfirmingTest(false)}
                  className="rounded-xl border border-linku-border-2 px-4 py-2 text-sm text-linku-text-muted">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={onAskConfirmTest}
              disabled={busy !== null || testPeople.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-linku-border-2 px-5 py-2.5 text-sm font-semibold text-linku-text transition hover:bg-white/5 disabled:opacity-50">
              <Users size={16} />
              Enviar prueba a {testPeople.length} persona{testPeople.length === 1 ? '' : 's'}
            </button>
          )}
        </div>

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
