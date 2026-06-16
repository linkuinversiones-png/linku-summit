'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Tag, X, Loader2, CheckCircle2 } from 'lucide-react';

type Props = {
  tier: string;
  subtotalCop: number;
  appliedCode: string | null;
  appliedDiscountCop: number;
  copy: {
    placeholder: string;
    apply: string;
    remove: string;
    applied: string;
    invalid: string;
  };
};

export default function CouponBox({
  tier,
  subtotalCop,
  appliedCode,
  appliedDiscountCop,
  copy
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [loading, setLoading] = useState(false);

  async function apply() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, tier, subtotalCop })
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.reason || copy.invalid);
        setLoading(false);
        return;
      }
      // Recarga la página con el cupón en URL para que el server lo aplique
      // (firma + monto a Wompi se calculan ahí).
      const params = new URLSearchParams(sp?.toString() ?? '');
      params.set('coupon', data.couponCode);
      start(() => router.push(`${pathname}?${params.toString()}`));
    } catch {
      setError(copy.invalid);
      setLoading(false);
    }
  }

  function remove() {
    const params = new URLSearchParams(sp?.toString() ?? '');
    params.delete('coupon');
    start(() => router.push(`${pathname}?${params.toString()}`));
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
        <div className="flex items-center gap-2 text-emerald-200">
          <CheckCircle2 size={16} />
          <span>
            {copy.applied}{' '}
            <code className="font-mono font-bold">{appliedCode}</code>
            {' '}— COP $-{appliedDiscountCop.toLocaleString('es-CO')}
          </span>
        </div>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-lg p-1 text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
          aria-label={copy.remove}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-linku-text-dim"
          />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={copy.placeholder}
            className="w-full rounded-lg border border-linku-border-2 bg-linku-bg-3 pl-9 pr-3 py-2.5 text-sm font-mono text-linku-text placeholder:text-linku-text-dim placeholder:font-sans focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                apply();
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={apply}
          disabled={loading || pending || !code.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-linku-border-2 bg-linku-bg-3 px-3.5 py-2.5 text-sm font-semibold text-linku-text transition hover:border-linku-coral/50 hover:text-linku-coral disabled:opacity-50"
        >
          {(loading || pending) && <Loader2 size={14} className="animate-spin" />}
          {copy.apply}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
