'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2, Save, ArrowLeft, Linkedin } from 'lucide-react';
import type { SpeakerRow } from '@/lib/speakers';
import type { SpeakerActionResult } from './actions';

type Action = (
  prev: SpeakerActionResult | null,
  form: FormData
) => Promise<SpeakerActionResult>;

type Props = {
  action: Action;
  speaker?: SpeakerRow | null;
  currentAvatarUrl?: string | null;
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

export default function SpeakerForm({ action, speaker, currentAvatarUrl, title }: Props) {
  const [state, formAction] = useFormState<SpeakerActionResult | null, FormData>(
    action,
    null
  );
  const errs = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} encType="multipart/form-data" className="mx-auto max-w-4xl">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/speakers"
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
              label="Slug *"
              name="slug"
              required
              defaultValue={speaker?.slug}
              placeholder="alejandro-pardo"
              hint="ID estable, en kebab-case. Se usa también como nombre de archivo de la foto."
              error={errs.slug}
            />
            <Field
              label="Nombre *"
              name="name"
              required
              defaultValue={speaker?.name}
              placeholder="Alejandro Pardo"
              error={errs.name}
            />
            <Field
              label="Rol / cargo"
              name="role"
              defaultValue={speaker?.role}
              placeholder="Fundador"
            />
            <Field
              label="Empresa"
              name="company"
              defaultValue={speaker?.company}
              placeholder="Satto"
            />
            <Field
              label="Track / tema"
              name="track"
              defaultValue={speaker?.track}
              placeholder="Desarrollo inmobiliario"
            />
            <Field
              label="LinkedIn URL"
              name="linkedin_url"
              type="url"
              defaultValue={speaker?.linkedin_url ?? ''}
              placeholder="https://linkedin.com/in/usuario"
              hint="Pegar la URL completa de su perfil."
              error={errs.linkedin_url}
              icon={<Linkedin size={14} />}
            />
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Foto
          </h2>
          <div className="mt-5 flex items-start gap-6">
            {currentAvatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentAvatarUrl}
                alt="Foto actual"
                className="h-28 w-28 rounded-xl object-cover ring-1 ring-linku-border"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-linku-bg-3 text-xs text-linku-text-dim ring-1 ring-linku-border">
                Sin foto
              </div>
            )}
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
                {currentAvatarUrl ? 'Reemplazar foto' : 'Subir foto'}
              </span>
              <input
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp"
                className="text-sm text-linku-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-linku-coral file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-linku-coral-soft"
              />
              <span className="text-[11px] text-linku-text-dim">
                PNG, JPG o WEBP. Se guarda como{' '}
                <code>speakers/{'<slug>'}.&lt;ext&gt;</code> en Storage.
                Cuadrada (1:1) recomendado.
              </span>
            </label>
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Bio
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <TextArea
              label="Bio · ES"
              name="bio_es"
              defaultValue={speaker?.bio_es ?? ''}
              rows={5}
            />
            <TextArea
              label="Bio · EN"
              name="bio_en"
              defaultValue={speaker?.bio_en ?? ''}
              rows={5}
            />
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Orden y visibilidad
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field
              label="Orden"
              name="sort_order"
              type="number"
              defaultValue={speaker?.sort_order ?? 0}
              hint="Menor → primero. Se muestran en orden ascendente."
            />
            <div className="flex flex-col gap-3">
              <Checkbox
                label="Confirmado (vs. 'Por confirmar')"
                name="confirmed"
                defaultChecked={speaker?.confirmed ?? true}
              />
              <Checkbox
                label="Activo (visible en landing)"
                name="active"
                defaultChecked={speaker?.active ?? true}
              />
            </div>
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

function TextArea({
  label,
  name,
  defaultValue,
  rows = 5
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
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
