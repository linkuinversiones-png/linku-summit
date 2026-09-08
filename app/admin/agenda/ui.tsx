'use client';

import type { ReactNode } from 'react';
import { Loader2, Save } from 'lucide-react';

/**
 * Primitivos de formulario del editor de agenda.
 * Todos son inputs NO controlados: el formulario se lee con FormData al
 * enviar. Menos re-renders y menos estado que sincronizar en un árbol
 * de 4 niveles (día → bloque → salón → charla).
 */

export const INPUT_CLASS =
  'w-full rounded-lg border border-linku-border-2 bg-linku-bg-3 px-3 py-2 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30';

const LABEL_CLASS =
  'text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim';

export function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  hint,
  className
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <span className={LABEL_CLASS}>{label}</span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        required={required}
        className={INPUT_CLASS}
      />
      {hint && <span className="text-[11px] text-linku-text-dim">{hint}</span>}
    </label>
  );
}

export function Area({
  label,
  name,
  defaultValue,
  rows = 3,
  placeholder,
  className
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <span className={LABEL_CLASS}>{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
  className
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <span className={LABEL_CLASS}>{label}</span>
      <select name={name} defaultValue={defaultValue} className={INPUT_CLASS}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Check({
  label,
  name,
  defaultChecked
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-linku-text-muted">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-linku-border-2 bg-linku-bg accent-linku-coral"
      />
      {label}
    </label>
  );
}

export type SpeakerOption = { id: string; name: string; company: string };

/**
 * Selector múltiple de speakers. Si hay alguno marcado, el landing muestra
 * esos nombres y IGNORA el texto libre de "crédito de speakers".
 */
export function SpeakerPicker({
  speakers,
  selectedIds
}: {
  speakers: SpeakerOption[];
  selectedIds: string[];
}) {
  const selected = new Set(selectedIds);
  if (speakers.length === 0) {
    return (
      <p className="text-[11px] text-linku-text-dim">
        Todavía no hay speakers cargados en /admin/speakers.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className={LABEL_CLASS}>Speakers vinculados</span>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-linku-border-2 bg-linku-bg-3 p-2">
        {speakers.map((s) => (
          <label
            key={s.id}
            className="flex cursor-pointer items-center gap-2.5 rounded px-1.5 py-1 text-xs text-linku-text-muted hover:bg-white/5"
          >
            <input
              type="checkbox"
              name="speaker_ids"
              value={s.id}
              defaultChecked={selected.has(s.id)}
              className="h-3.5 w-3.5 rounded border-linku-border-2 bg-linku-bg accent-linku-coral"
            />
            <span className="text-linku-text">{s.name}</span>
            {s.company && <span className="text-linku-text-dim">· {s.company}</span>}
          </label>
        ))}
      </div>
      <span className="text-[11px] text-linku-text-dim">
        Si marcas speakers aquí, se muestran en vez del crédito escrito a mano.
      </span>
    </div>
  );
}

export function SaveButton({
  pending,
  children = 'Guardar'
}: {
  pending: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-linku-coral px-4 py-2 text-xs font-semibold text-white transition hover:bg-linku-coral-soft disabled:opacity-50"
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
      {pending ? 'Guardando…' : children}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
      {message}
    </p>
  );
}

/** Botón sutil para acciones secundarias (añadir, cancelar, expandir). */
export function GhostButton({
  onClick,
  children,
  disabled,
  danger,
  title,
  type = 'button'
}: {
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
        danger
          ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-500/50 hover:bg-red-500/20'
          : 'border-linku-border-2 text-linku-text-muted hover:border-white/25 hover:text-linku-text'
      }`}
    >
      {children}
    </button>
  );
}

/** Lee "HH:MM" tolerando que el usuario escriba "9:00" o "9". */
export function normalizeTime(raw: FormDataEntryValue | null): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!m) return s;
  const h = m[1].padStart(2, '0');
  const min = (m[2] ?? '00').padStart(2, '0');
  return `${h}:${min}`;
}
