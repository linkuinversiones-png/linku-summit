import CouponForm from '../CouponForm';
import { createCoupon } from '../actions';

export const metadata = { title: 'Nuevo cupón · Admin · LINKU CAPITAL SUMMIT 2026' };

/**
 * /admin/coupons/new           → descuento
 * /admin/coupons/new?kind=cortesia → arranca como cortesía (desde /admin/cortesias)
 */
export default async function NewCouponPage(props: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await props.searchParams;
  const isCourtesy = kind === 'cortesia';
  return (
    <CouponForm
      action={createCoupon}
      title={isCourtesy ? 'Nueva cortesía' : 'Nuevo cupón'}
      initialKind={isCourtesy ? 'cortesia' : 'descuento'}
    />
  );
}
