import { notFound } from 'next/navigation';
import CouponForm from '../CouponForm';
import { updateCoupon } from '../actions';
import { getCouponByIdAdmin, getRedemptionsForCouponAdmin } from '@/lib/coupons';
import { formatCop } from '@/lib/tickets';

export const metadata = { title: 'Editar cupón · Admin · LINKU SUMMIT' };
export const dynamic = 'force-dynamic';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default async function EditCouponPage({
  params
}: {
  params: { id: string };
}) {
  const [coupon, redemptions] = await Promise.all([
    getCouponByIdAdmin(params.id),
    getRedemptionsForCouponAdmin(params.id)
  ]);

  if (!coupon) notFound();

  const updateBound = updateCoupon.bind(null, params.id);

  return (
    <div className="space-y-10">
      <CouponForm
        action={updateBound}
        coupon={coupon}
        title={`Editar cupón · ${coupon.code}`}
      />

      <div className="mx-auto max-w-3xl">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-linku-coral">
          Historial de uso ({redemptions.length})
        </h2>
        {redemptions.length === 0 ? (
          <p className="mt-4 rounded-xl border border-linku-border bg-linku-bg-2 px-6 py-8 text-center text-sm text-linku-text-muted">
            Aún nadie ha usado este cupón.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-linku-border bg-linku-bg-2">
            <table className="w-full text-sm">
              <thead className="bg-linku-bg-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Orden</th>
                  <th className="px-4 py-3 text-right">Descuento aplicado</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} className="border-t border-linku-border">
                    <td className="px-4 py-3 text-linku-text-muted">
                      {fmtDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/admin/orders/${r.order_id}`}
                        className="font-mono text-xs text-linku-coral hover:text-linku-coral-soft"
                      >
                        {r.order_id.slice(0, 8)}…
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-linku-text">
                      {formatCop(r.discount_cop)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
