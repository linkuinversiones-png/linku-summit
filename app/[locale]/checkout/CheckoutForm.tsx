'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';

type Copy = {
  buyerSection: string;
  name: string;
  email: string;
  phone: string;
  docType: string;
  docNumber: string;
  billingSection: string;
  billingSame: string;
  address: string;
  pay: string;
};

const DOC_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía (CC)' },
  { value: 'CE', label: 'Cédula de extranjería (CE)' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
  { value: 'TI', label: 'Tarjeta de identidad (TI)' },
  { value: 'PEP', label: 'PEP' },
  { value: 'OTRO', label: 'Otro' }
];

const inputCls =
  'w-full rounded-xl border border-linku-border-2 bg-linku-bg-3 px-4 py-3 text-base text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/60 focus:outline-none focus:ring-2 focus:ring-linku-coral/30';
const labelCls =
  'text-xs font-semibold uppercase tracking-[0.16em] text-linku-text-muted';

export default function CheckoutForm({
  action,
  tier,
  locale,
  coupon,
  copy
}: {
  action: (formData: FormData) => void | Promise<void>;
  tier: string;
  locale: Locale;
  coupon?: string;
  copy: Copy;
}) {
  const [billingSame, setBillingSame] = useState(true);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="tier" value={tier} />
      <input type="hidden" name="locale" value={locale} />
      {coupon && <input type="hidden" name="coupon" value={coupon} />}

      {/* --- Datos del comprador --- */}
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-linku-coral">
        {copy.buyerSection}
      </p>

      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>{copy.name}</span>
        <input name="buyer_name" required className={inputCls} autoComplete="name" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>{copy.email}</span>
          <input
            name="buyer_email"
            type="email"
            required
            autoComplete="email"
            autoCapitalize="none"
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>{copy.phone}</span>
          <input name="buyer_phone" type="tel" autoComplete="tel" className={inputCls} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>{copy.docType}</span>
          <select name="buyer_doc_type" defaultValue="CC" className={inputCls}>
            {DOC_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>{copy.docNumber}</span>
          <input name="buyer_doc_number" required className={inputCls} />
        </label>
      </div>

      {/* --- Facturación --- */}
      <div className="mt-2 border-t border-linku-border pt-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-linku-coral">
          {copy.billingSection}
        </p>

        <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-linku-text-muted">
          <input
            type="checkbox"
            name="billing_same"
            checked={billingSame}
            onChange={(e) => setBillingSame(e.target.checked)}
            className="h-4 w-4 rounded border-linku-border-2 accent-linku-coral"
          />
          {copy.billingSame}
        </label>

        {!billingSame && (
          <div className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>{copy.name}</span>
              <input name="billing_name" className={inputCls} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>{copy.docType}</span>
                <select name="billing_doc_type" defaultValue="CC" className={inputCls}>
                  {DOC_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelCls}>{copy.docNumber}</span>
                <input name="billing_doc_number" className={inputCls} />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>{copy.email}</span>
              <input name="billing_email" type="email" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>{copy.address}</span>
              <input name="billing_address" className={inputCls} />
            </label>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linku-coral px-6 py-4 text-base font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft hover:shadow-coral-glow-strong"
      >
        {copy.pay}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
