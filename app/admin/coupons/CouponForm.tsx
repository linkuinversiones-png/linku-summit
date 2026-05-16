'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import type { CouponRow } from '@/lib/coupons';
import type { CouponActionResult } from './actions';

type Action = (
  prev: CouponActionResult | null,
  form: FormData
) => Promise<CouponActionResult>;

type Props = {
  action: Action;
  coupon?: CouponRow | null;
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

export default function CouponForm({ action, coupon, title }: Props) {
  const [state, formAction] = useFormState<CouponActionResult | null, FormData>(
    action,
    null
  );
  const errs = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/coupons"
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
            Código y descripción
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
                Código *
              </span>
              <input
                type="text"
                name="code"
                required
                defaultValue={coupon?.code ?? ''}
                placeholder="EARLYBIRD2026"
                className="rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm font-mono uppercase text-linku-text focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
              />
              <span className="text-[11px] text-linku-text-dim">
                Mayúsculas, números, guion y guion bajo. Se autoconvierte.
              </span>
              {errs.code && <span className="text-xs text-red-300">{errs.code}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
                Descripción (interna)
              </span>
              <input
                type="text"
                name="description"
                defaultValue={coupon?.description ?? ''}
                placeholder="Para comunidad de inversionistas LinkU"
                className="rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
              />
            </label>
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Descuento
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
                Tipo *
              </span>
              <select
                name="discount_type"
                defaultValue={coupon?.discount_type ?? 'percent'}
                className="rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
              >
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo (COP)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
                Valor *
              </span>
              <input
                type="number"
                name="discount_value"
                required
                min="1"
                defaultValue={coupon?.discount_value ?? ''}
                placeholder="20 (= 20%) o 100000 (= COP 100.000)"
                className="rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
              />
              <span className="text-[11px] text-linku-text-dim">
                Si es porcentaje: 1-100. Si es fijo: en pesos enteros.
              </span>
              {errs.discount_value && (
                <span className="text-xs text-red-300">{errs.discount_value}</span>
              )}
            </label>
          </div>
        </section>

        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Restricciones
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
                Máx. usos
              </span>
              <input
                type="number"
                name="max_uses"
                min="1"
                defaultValue={coupon?.max_uses ?? ''}
                placeholder="Vacío = ilimitado"
                className="rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
              />
              {errs.max_uses && (
                <span className="text-xs text-red-300">{errs.max_uses}</span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
                Expira
              </span>
              <input
                type="datetime-local"
                name="expires_at"
                defaultValue={toDatetimeLocal(coupon?.expires_at ?? null)}
                className="rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
              />
              <span className="text-[11px] text-linku-text-dim">
                Vacío = sin caducidad.
              </span>
            </label>
            <label className="md:col-span-2 flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
                Aplica a tiers (slugs separados por coma)
              </span>
              <input
                type="text"
                name="applies_to_tiers"
                defaultValue={(coupon?.applies_to_tiers ?? []).join(', ')}
                placeholder="early-access, smart-access"
                className="rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
              />
              <span className="text-[11px] text-linku-text-dim">
                Vacío = aplica a todos los tiers.
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-linku-border-2 bg-linku-bg-3 px-4 py-3 text-sm text-linku-text">
              <input
                type="checkbox"
                name="active"
                defaultChecked={coupon?.active ?? true}
                className="h-4 w-4 rounded border-linku-border-2 bg-linku-bg accent-linku-coral"
              />
              Activo (los usuarios pueden usarlo)
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
