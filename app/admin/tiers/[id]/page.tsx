import { notFound } from 'next/navigation';
import TierForm from '../TierForm';
import { updateTier } from '../actions';
import { getTierById } from '@/lib/tickets';

export const metadata = {
  title: 'Editar tier · LINKU Admin',
  robots: { index: false, follow: false }
};

export default async function EditTierPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const tier = await getTierById(params.id);
  if (!tier) notFound();

  // updateTier es (id, prev, form) → curry para que TierForm pase solo (prev, form)
  const action = updateTier.bind(null, tier.id);

  return <TierForm action={action} tier={tier} title={`Editar · ${tier.name_es}`} />;
}
