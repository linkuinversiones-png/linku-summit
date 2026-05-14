'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import type { TierRow } from '@/lib/tickets';
import type { TierActionResult } from './actions';

type Action = (
  prev: TierActionResult | null,
  form: FormData
) => Promise<TierActionResult>;

type Props = {
  action: Action;
  tier?: TierRow | null;
  title: string;
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

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

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  required = false,
  placeholder,
  error,
  hint
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
        {label}
        {required && <span className="ml-1 text-linku-coral">*</span>}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        placeholder={placeholder}
        className={`rounded-xl border bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text placeholder:text-linku-text-dim focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500/50 focus:ring-red-500/30'
            : 'border-linku-border-2 focus:border-linku-coral/50 focus:ring-linku-coral/30'
        }`}
      />
      {hint && <span className="text-[11px] text-linku-text-dim">{hint}</span>}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 5,
  hint,
  error
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ''}
        rows={rows}
        className="rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
      />
      {hint && <span className="text-[11px] text-linku-text-dim">{hint}</span>}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </label>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-linku-border-2 bg-linku-bg-3 px-4 py-3 text-sm text-linku-text">
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

export default function TierForm({ action, tier, title }: Props) {
  const [state, formAction] = useFormState<TierActionResult | null, FormData>(
    action,
    null
  );
  const errs = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="mx-auto max-w-5xl">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/tiers"
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-linku-text-muted transition hover:text-linku-coral"
          >
            <ArrowLeft size={14} /> Volver
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tightish text-linku-text">
            {title}
          </h1>
        </div>
        <SubmitButton />
      </header>

      {state && !state.ok && (
        <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.message}
        </p>
      )}

      <div className="space-y-8">
        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Identificación
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field
              label="Slug"
              name="slug"
              required
              defaultValue={tier?.slug}
              placeholder="early-investor"
              hint="ID estable, en kebab-case. No se debería cambiar después de crear."
              error={errs.slug}
            />
            <Field
              label="Precio (COP)"
              name="price_cop"
              type="number"
              required
              defaultValue={tier?.price_cop}
              placeholder="1500000"
              hint="Solo el número entero, sin puntos ni símbolos."
              error={errs.price_cop}
            />
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Nombre y etiquetas
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field
              label="Nombre · ES"
              name="name_es"
              required
              defaultValue={tier?.name_es}
              placeholder="Early Investor"
              error={errs.name_es}
            />
            <Field
              label="Nombre · EN"
              name="name_en"
              required
              defaultValue={tier?.name_en}
              placeholder="Early Investor"
              error={errs.name_en}
            />
            <Field
              label="Sub-etiqueta · ES"
              name="label_es"
              defaultValue={tier?.label_es ?? ''}
              placeholder="Acceso temprano"
            />
            <Field
              label="Sub-etiqueta · EN"
              name="label_en"
              defaultValue={tier?.label_en ?? ''}
              placeholder="Early access"
            />
            <Field
              label="Badge · ES"
              name="badge_es"
              defaultValue={tier?.badge_es ?? ''}
              placeholder="MÁS POPULAR"
              hint="Aparece como insignia superior si highlight = true."
            />
            <Field
              label="Badge · EN"
              name="badge_en"
              defaultValue={tier?.badge_en ?? ''}
              placeholder="MOST POPULAR"
            />
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Beneficios
          </h2>
          <p className="mt-2 text-xs text-linku-text-muted">
            Uno por línea. El orden se respeta.
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <TextArea
              label="Beneficios · ES"
              name="benefits_es"
              rows={8}
              defaultValue={(tier?.benefits_es ?? []).join('\n')}
            />
            <TextArea
              label="Beneficios · EN"
              name="benefits_en"
              rows={8}
              defaultValue={(tier?.benefits_en ?? []).join('\n')}
            />
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Nota de precio
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field
              label="Nota · ES"
              name="price_note_es"
              defaultValue={tier?.price_note_es ?? ''}
              placeholder="Tarifa válida hasta agotar primer cupo"
            />
            <Field
              label="Nota · EN"
              name="price_note_en"
              defaultValue={tier?.price_note_en ?? ''}
              placeholder="Rate valid until first quota sells out"
            />
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            CTA
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field
              label="Texto botón · ES"
              name="cta_label_es"
              defaultValue={tier?.cta_label_es ?? 'Comprar entrada'}
            />
            <Field
              label="Texto botón · EN"
              name="cta_label_en"
              defaultValue={tier?.cta_label_en ?? 'Buy ticket'}
            />
            <Field
              label="Link / acción"
              name="cta_href"
              defaultValue={tier?.cta_href ?? '/checkout'}
              hint="Por ahora redirect al checkout. Más adelante puede ser /checkout?tier=slug."
            />
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Stock y visibilidad
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field
              label="Cupo máximo"
              name="max_quantity"
              type="number"
              defaultValue={tier?.max_quantity ?? ''}
              placeholder="Vacío = ilimitado"
              hint="Cuando sold_count alcanza este número, se agota."
            />
            <Field
              label="Orden"
              name="sort_order"
              type="number"
              defaultValue={tier?.sort_order ?? 0}
              hint="Menor → primero. Se muestran en orden ascendente."
            />
            <Field
              label="Visible desde"
              name="visible_from"
              type="datetime-local"
              defaultValue={toDatetimeLocal(tier?.visible_from ?? null)}
              hint="Opcional. Vacío = visible ya."
            />
            <Field
              label="Visible hasta"
              name="visible_until"
              type="datetime-local"
              defaultValue={toDatetimeLocal(tier?.visible_until ?? null)}
              hint="Opcional. Vacío = sin fecha de cierre."
            />
            <Checkbox
              label="Destacado (resalta visualmente)"
              name="highlight"
              defaultChecked={tier?.highlight ?? false}
            />
            <Checkbox
              label="Activo (visible al público)"
              name="active"
              defaultChecked={tier?.active ?? true}
            />
          </div>
        </section>
      </div>

      <div className="mt-10 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
