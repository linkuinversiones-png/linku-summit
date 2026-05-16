'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2, Save, ArrowLeft, Linkedin, Globe } from 'lucide-react';
import type { SponsorRow } from '@/lib/sponsors';
import { SPONSOR_CATEGORIES } from '@/lib/sponsors-constants';
import type { SponsorActionResult } from './actions';

type Action = (
  prev: SponsorActionResult | null,
  form: FormData
) => Promise<SponsorActionResult>;

type Props = {
  action: Action;
  sponsor?: SponsorRow | null;
  currentLogoUrl?: string | null;
  title: string;
};

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

export default function SponsorForm({ action, sponsor, currentLogoUrl, title }: Props) {
  const [state, formAction] = useFormState<SponsorActionResult | null, FormData>(
    action,
    null
  );
  const errs = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} encType="multipart/form-data" className="mx-auto max-w-4xl">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/sponsors"
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
            Datos
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field
              label="Slug *"
              name="slug"
              required
              defaultValue={sponsor?.slug}
              placeholder="bancolombia"
              hint="ID estable. Se usa como nombre de archivo del logo."
              error={errs.slug}
            />
            <Field
              label="Nombre *"
              name="name"
              required
              defaultValue={sponsor?.name}
              placeholder="Bancolombia"
              error={errs.name}
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
                Categoría *
              </span>
              <select
                name="category"
                required
                defaultValue={sponsor?.category ?? ''}
                className={`rounded-xl border bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text focus:outline-none focus:ring-2 ${
                  errs.category
                    ? 'border-red-500/50 focus:ring-red-500/30'
                    : 'border-linku-border-2 focus:border-linku-coral/50 focus:ring-linku-coral/30'
                }`}
              >
                <option value="">Selecciona…</option>
                {SPONSOR_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.titleEs}
                  </option>
                ))}
              </select>
              {errs.category && (
                <span className="text-xs text-red-300">{errs.category}</span>
              )}
            </label>
            <Field
              label="Orden dentro de la categoría"
              name="sort_order"
              type="number"
              defaultValue={sponsor?.sort_order ?? 0}
              hint="Menor → primero."
            />
            <Field
              label="Website"
              name="website_url"
              type="url"
              defaultValue={sponsor?.website_url ?? ''}
              placeholder="https://bancolombia.com"
              error={errs.website_url}
              icon={<Globe size={14} />}
            />
            <Field
              label="LinkedIn URL"
              name="linkedin_url"
              type="url"
              defaultValue={sponsor?.linkedin_url ?? ''}
              placeholder="https://linkedin.com/company/bancolombia"
              error={errs.linkedin_url}
              icon={<Linkedin size={14} />}
            />
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Logo
          </h2>
          <div className="mt-5 flex items-start gap-6">
            {currentLogoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentLogoUrl}
                alt="Logo actual"
                className="h-24 w-32 rounded-xl bg-linku-bg-3 object-contain p-3 ring-1 ring-linku-border"
              />
            ) : (
              <div className="flex h-24 w-32 items-center justify-center rounded-xl bg-linku-bg-3 text-xs text-linku-text-dim ring-1 ring-linku-border">
                Sin logo
              </div>
            )}
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
                {currentLogoUrl ? 'Reemplazar logo' : 'Subir logo'}
              </span>
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="text-sm text-linku-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-linku-coral file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-linku-coral-soft"
              />
              <span className="text-[11px] text-linku-text-dim">
                PNG/JPG/WEBP/SVG. Idealmente blanco sobre transparente; el
                landing lo fuerza a blanco igual (CSS filter). Se guarda en{' '}
                <code>sponsors/&lt;categoría&gt;/&lt;slug&gt;.&lt;ext&gt;</code>.
              </span>
            </label>
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Visibilidad
          </h2>
          <div className="mt-5">
            <label className="flex items-center gap-3 rounded-xl border border-linku-border-2 bg-linku-bg-3 px-4 py-3 text-sm text-linku-text">
              <input
                type="checkbox"
                name="active"
                defaultChecked={sponsor?.active ?? true}
                className="h-4 w-4 rounded border-linku-border-2 bg-linku-bg accent-linku-coral"
              />
              Activo (visible en el landing)
            </label>
          </div>
        </section>
      </div>

      <div className="mt-10 flex justify-end">
        <SubmitButton />
      </div>
    </form>
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
  hint,
  icon
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
        {icon}
        {label}
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
