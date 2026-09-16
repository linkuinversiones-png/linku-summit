'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { CalendarClock, ExternalLink, Loader2, Save } from 'lucide-react';
import type { MeetingsSettingsRow } from '@/lib/settings';
import { saveMeetingsSettings, type SettingsActionResult } from './actions';

const INPUT =
  'w-full rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30';
const LABEL = 'text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted';
const HINT = 'text-[11px] text-linku-text-dim';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-5 py-2.5 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft disabled:opacity-50"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {pending ? 'Guardando…' : 'Guardar'}
    </button>
  );
}

function fmt(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function SettingsForm({ meetings }: { meetings: MeetingsSettingsRow }) {
  const [state, formAction] = useFormState<SettingsActionResult | null, FormData>(
    saveMeetingsSettings,
    null
  );
  const errs = state && !state.ok ? state.fieldErrors ?? {} : {};
  const v = meetings.value;

  return (
    <form action={formAction} className="mx-auto max-w-3xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tightish text-linku-text">Ajustes</h1>
          <p className="mt-1 text-sm text-linku-text-muted">
            Lo que se guarda aquí cambia en el sitio al instante, sin publicar una versión nueva.
          </p>
        </div>
        <SubmitButton />
      </header>

      {state && (
        <p
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            state.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          {state.message}
        </p>
      )}

      <section className="linku-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
          <CalendarClock size={15} /> Agenda de citas 1:1
        </h2>
        <p className="mt-2 text-xs text-linku-text-muted">
          Es la tarjeta que ve cada asistente al entrar a su cuenta. El enlace lleva a la
          plataforma del proveedor externo de agendamiento.
        </p>

        <div className="mt-6 space-y-5">
          <label className="flex items-center gap-3 rounded-xl border border-linku-border-2 bg-linku-bg-3 px-4 py-3 text-sm text-linku-text">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={v.enabled}
              className="h-4 w-4 rounded border-linku-border-2 bg-linku-bg accent-linku-coral"
            />
            <span>
              Agenda activa
              <span className="block text-[11px] text-linku-text-dim">
                Apagada, la tarjeta muestra el aviso de &quot;próximamente&quot; y no hay botón.
              </span>
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Enlace del proveedor</span>
            <div className="flex items-center gap-2">
              <input
                type="url"
                name="url"
                defaultValue={v.url}
                placeholder="https://proveedor.com/linku-summit"
                className={INPUT}
              />
              {v.url && (
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-linku-border-2 px-3 py-2.5 text-xs text-linku-text-muted transition hover:border-white/25 hover:text-linku-text"
                  title="Abrir el enlace actual"
                >
                  <ExternalLink size={13} /> Probar
                </a>
              )}
            </div>
            <span className={HINT}>Dirección completa, empezando por https://</span>
            {errs.url && <span className="text-xs text-red-300">{errs.url}</span>}
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Título (ES)</span>
              <input type="text" name="title_es" defaultValue={v.title_es} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Título (EN)</span>
              <input type="text" name="title_en" defaultValue={v.title_en} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Descripción (ES)</span>
              <textarea name="desc_es" rows={3} defaultValue={v.desc_es} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Descripción (EN)</span>
              <textarea name="desc_en" rows={3} defaultValue={v.desc_en} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Texto del botón (ES)</span>
              <input type="text" name="cta_es" defaultValue={v.cta_es} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Texto del botón (EN)</span>
              <input type="text" name="cta_en" defaultValue={v.cta_en} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Aviso mientras está apagada (ES)</span>
              <textarea name="note_es" rows={2} defaultValue={v.note_es} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Aviso mientras está apagada (EN)</span>
              <textarea name="note_en" rows={2} defaultValue={v.note_en} className={INPUT} />
            </label>
          </div>
        </div>

        {meetings.updated_at && (
          <p className="mt-5 text-[11px] text-linku-text-dim">
            Último cambio: {fmt(meetings.updated_at)}
            {meetings.updated_by_email ? ` · ${meetings.updated_by_email}` : ''}
          </p>
        )}
      </section>

      <div className="mt-8 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
