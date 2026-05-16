import CouponForm from '../CouponForm';
import { createCoupon } from '../actions';

export const metadata = { title: 'Nuevo cupón · Admin · LINKU SUMMIT' };

export default function NewCouponPage() {
  return <CouponForm action={createCoupon} title="Nuevo cupón" />;
}
