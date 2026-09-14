'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2, Save, ArrowLeft, Gift, TicketPercent } from 'lucide-react';
import { COURTESY_CATEGORIES, type CouponKind } from '@/lib/coupon-kinds';
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
  /** Tipo con el que arranca el formulario cuando es un cupón nuevo. */
  initialKind?: CouponKind;
};

const INPUT =
  'rounded-xl border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30';
const LABEL = 'text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted';
const HINT = 'text-[11px] text-linku-text-dim';

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

export default function CouponForm({ action, coupon, title, initialKind }: Props) {
  const [state, formAction] = useFormState<CouponActionResult | null, FormData>(
    action,
    null
  );
  const errs = state && !state.ok ? state.fieldErrors ?? {} : {};
  const [kind, setKind] = useState<CouponKind>(coupon?.kind ?? initialKind ?? 'descuento');
  const isCourtesy = kind === 'cortesia';
  const backHref = isCourtesy ? '/admin/cortesias' : '/admin/coupons';

  return (
    <form action={formAction} className="mx-auto max-w-3xl">
      <input type="hidden" name="kind" value={kind} />

      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href={backHref}
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
        {/* --- Tipo ------------------------------------------------------ */}
        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Tipo de cupón
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <KindOption
              active={!isCourtesy}
              onClick={() => setKind('descuento')}
              icon={<TicketPercent size={16} />}
              title="Descuento"
              desc="Rebaja parcial. El comprador paga el saldo por Wompi."
            />
            <KindOption
              active={isCourtesy}
              onClick={() => setKind('cortesia')}
              icon={<Gift size={16} />}
              title="Cortesía"
              desc="Entrada gratis. No pasa por la pasarela: la boleta se emite al instante."
            />
          </div>
        </section>

        {/* --- Código ---------------------------------------------------- */}
        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Código y descripción
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Código *</span>
              <input
                type="text"
                name="code"
                required
                defaultValue={coupon?.code ?? ''}
                placeholder={isCourtesy ? 'CORTESIA-PATRIA' : 'EARLYBIRD2026'}
                className={`${INPUT} font-mono uppercase`}
              />
              <span className={HINT}>
                Mayúsculas, números, guion y guion bajo. Se autoconvierte.
              </span>
              {errs.code && <span className="text-xs text-red-300">{errs.code}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Descripción (interna)</span>
              <input
                type="text"
                name="description"
                defaultValue={coupon?.description ?? ''}
                placeholder={
                  isCourtesy ? 'Cortesías para la comunidad de Patria' : 'Para comunidad de inversionistas LinkU'
                }
                className={INPUT}
              />
            </label>
          </div>
        </section>

        {/* --- Descuento (solo descuento) ------------------------------- */}
        {!isCourtesy && (
          <section className="linku-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
              Descuento
            </h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Tipo *</span>
                <select
                  name="discount_type"
                  defaultValue={coupon?.discount_type ?? 'percent'}
                  className={INPUT}
                >
                  <option value="percent">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo (COP)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Valor *</span>
                <input
                  type="number"
                  name="discount_value"
                  required
                  min="1"
                  defaultValue={coupon?.discount_value ?? ''}
                  placeholder="20 (= 20%) o 100000 (= COP 100.000)"
                  className={INPUT}
                />
                <span className={HINT}>Si es porcentaje: 1-100. Si es fijo: en pesos enteros.</span>
                {errs.discount_value && (
                  <span className="text-xs text-red-300">{errs.discount_value}</span>
                )}
              </label>
            </div>
          </section>
        )}

        {/* --- Cortesía (solo cortesía) --------------------------------- */}
        {isCourtesy && (
          <section className="linku-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
              A quién se otorga
            </h2>
            <p className="mt-2 text-xs text-linku-text-muted">
              Cubre el 100 % de la entrada. Para una persona concreta pon nombre y correo con
              un solo uso. Para una organización pon el nombre de la organización y tantos
              usos como cupos le des.
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Categoría *</span>
                <select
                  name="courtesy_category"
                  defaultValue={coupon?.courtesy_category ?? 'comunidad'}
                  className={INPUT}
                >
                  {COURTESY_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errs.courtesy_category && (
                  <span className="text-xs text-red-300">{errs.courtesy_category}</span>
                )}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Organización</span>
                <input
                  type="text"
                  name="granted_to_org"
                  defaultValue={coupon?.granted_to_org ?? ''}
                  placeholder="Patria, ISA, Universidad EIA…"
                  className={INPUT}
                />
                {errs.granted_to_org && (
                  <span className="text-xs text-red-300">{errs.granted_to_org}</span>
                )}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Nombre de la persona</span>
                <input
                  type="text"
                  name="granted_to_name"
                  defaultValue={coupon?.granted_to_name ?? ''}
                  placeholder="Solo para cortesías nominales"
                  className={INPUT}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Correo de la persona</span>
                <input
                  type="email"
                  name="granted_to_email"
                  defaultValue={coupon?.granted_to_email ?? ''}
                  placeholder="nombre@empresa.com"
                  className={INPUT}
                />
                {errs.granted_to_email && (
                  <span className="text-xs text-red-300">{errs.granted_to_email}</span>
                )}
              </label>
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className={LABEL}>Notas internas</span>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={coupon?.notes ?? ''}
                  placeholder="Quién la pidió, a cambio de qué, contexto…"
                  className={INPUT}
                />
              </label>
            </div>
            {coupon?.granted_by_email && (
              <p className="mt-4 text-[11px] text-linku-text-dim">
                Creada por {coupon.granted_by_email}.
              </p>
            )}
          </section>
        )}

        {/* --- Restricciones -------------------------------------------- */}
        <section className="linku-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
            Restricciones
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>{isCourtesy ? 'Cupos (máx. usos) *' : 'Máx. usos'}</span>
              <input
                type="number"
                name="max_uses"
                min="1"
                required={isCourtesy}
                defaultValue={coupon?.max_uses ?? (isCourtesy ? 1 : '')}
                placeholder={isCourtesy ? '1' : 'Vacío = ilimitado'}
                className={INPUT}
              />
              <span className={HINT}>
                {isCourtesy
                  ? 'Cuántas entradas gratis entrega este código. Obligatorio para hacer seguimiento.'
                  : 'Vacío = ilimitado.'}
              </span>
              {errs.max_uses && <span className="text-xs text-red-300">{errs.max_uses}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Expira</span>
              <input
                type="datetime-local"
                name="expires_at"
                defaultValue={toDatetimeLocal(coupon?.expires_at ?? null)}
                className={INPUT}
              />
              <span className={HINT}>Vacío = sin caducidad.</span>
            </label>
            <label className="md:col-span-2 flex flex-col gap-1.5">
              <span className={LABEL}>Aplica a tiers (slugs separados por coma)</span>
              <input
                type="text"
                name="applies_to_tiers"
                defaultValue={(coupon?.applies_to_tiers ?? []).join(', ')}
                placeholder="early-access, smart-access"
                className={INPUT}
              />
              <span className={HINT}>
                {isCourtesy
                  ? 'Recomendado: fija un tier para que la cortesía no se use en la entrada más cara.'
                  : 'Vacío = aplica a todos los tiers.'}
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-linku-border-2 bg-linku-bg-3 px-4 py-3 text-sm text-linku-text">
              <input
                type="checkbox"
                name="active"
                defaultChecked={coupon?.active ?? true}
                className="h-4 w-4 rounded border-linku-border-2 bg-linku-bg accent-linku-coral"
              />
              Activo (se puede usar en el checkout)
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

function KindOption({
  active,
  onClick,
  icon,
  title,
  desc
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        active
          ? 'border-linku-coral/60 bg-linku-coral/10'
          : 'border-linku-border-2 bg-linku-bg-3 hover:border-white/25'
      }`}
    >
      <span className={active ? 'text-linku-coral' : 'text-linku-text-dim'}>{icon}</span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-linku-text">{title}</span>
        <span className="mt-0.5 text-xs text-linku-text-muted">{desc}</span>
      </span>
    </button>
  );
}
