import TierForm from '../TierForm';
import { createTier } from '../actions';

export const metadata = {
  title: 'Nuevo tier · LINKU Admin',
  robots: { index: false, follow: false }
};

export default function NewTierPage() {
  return <TierForm action={createTier} title="Nuevo tier" />;
}
