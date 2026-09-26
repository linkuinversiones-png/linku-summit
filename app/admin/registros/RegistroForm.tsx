'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { TierRow } from '@/lib/tickets';
import { registerInternal, type RegistroActionResult } from './actions';

const DOC_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía (CC)' },
  { value: 'CE', label: 'Cédula de extranjería (CE)' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
  { value: 'TI', label: 'Tarjeta de identidad (TI)' },
  { value: 'PEP', label: 'PEP' },
  { value: 'OTRO', label: 'Otro' }
];

const INPUT =
  'rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30';
const LABEL = 'text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-5 py-2.5 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft disabled:opacity-50"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {pending ? 'Registrando…' : 'Registrar'}
    </button>
  );
}

export default function RegistroForm({ tiers }: { tiers: TierRow[] }) {
  const [state, formAction] = useFormState<RegistroActionResult | null, FormData>(
    registerInternal,
    null
  );
  const errs = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="linku-card space-y-6 p-6">
      {state && (
        <p
          className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            state.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          {state.ok ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          )}
          <span>
            {state.message}
            {state.ok && (
              <>
                {' '}
                <Link
                  href={`/admin/orders/${state.orderId}`}
                  className="font-semibold underline hover:text-emerald-100"
                >
                  Ver venta →
                </Link>
              </>
            )}
            {state.ok && state.warnings && state.warnings.length > 0 && (
              <span className="mt-1 block text-xs text-amber-200">
                Avisos: {state.warnings.join(' · ')}
              </span>
            )}
          </span>
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className={LABEL}>
            Categoría <span className="text-linku-coral">*</span>
          </span>
          <select name="tier_slug" required defaultValue="" className={INPUT}>
            <option value="" disabled>
              Elige una categoría…
            </option>
            {tiers.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name_es}
              </option>
            ))}
          </select>
          {tiers.length === 0 && (
            <span className="text-xs text-amber-300">
              No hay categorías internas activas. Crea o activa Staff/Speaker en
              /admin/tiers marcando &quot;Solo admin&quot;.
            </span>
          )}
          {errs.tier_slug && <span className="text-xs text-red-300">{errs.tier_slug}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>
            Nombre completo <span className="text-linku-coral">*</span>
          </span>
          <input type="text" name="buyer_name" required className={INPUT} />
          {errs.buyer_name && <span className="text-xs text-red-300">{errs.buyer_name}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>
            Correo <span className="text-linku-coral">*</span>
          </span>
          <input type="email" name="buyer_email" required className={INPUT} />
          {errs.buyer_email && <span className="text-xs text-red-300">{errs.buyer_email}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Celular</span>
          <input type="tel" name="buyer_phone" className={INPUT} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Tipo de documento</span>
          <select name="buyer_doc_type" defaultValue="CC" className={INPUT}>
            {DOC_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>
            Número de documento <span className="text-linku-coral">*</span>
          </span>
          <input type="text" name="buyer_doc_number" required className={INPUT} />
          <span className="text-[11px] text-linku-text-dim">
            InContacto deduplica asistentes por este número.
          </span>
          {errs.buyer_doc_number && (
            <span className="text-xs text-red-300">{errs.buyer_doc_number}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Empresa</span>
          <input type="text" name="buyer_company" className={INPUT} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Cargo</span>
          <input type="text" name="buyer_position" className={INPUT} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>LinkedIn (opcional)</span>
          <input
            type="url"
            name="buyer_linkedin"
            placeholder="https://linkedin.com/in/…"
            className={INPUT}
          />
        </label>

        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className={LABEL}>Nota interna (opcional)</span>
          <textarea
            name="note"
            rows={2}
            placeholder="Contexto: por qué se registra, quién lo pidió…"
            className={INPUT}
          />
        </label>
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

