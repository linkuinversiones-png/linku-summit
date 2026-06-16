import { notFound } from 'next/navigation';
import SponsorForm from '../SponsorForm';
import { updateSponsor } from '../actions';
import { getSponsorByIdAdmin } from '@/lib/sponsors';
import { getImageUrl } from '@/lib/storage';

export const metadata = { title: 'Editar sponsor · Admin · LINKU SUMMIT' };
export const dynamic = 'force-dynamic';

export default async function EditSponsorPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const sponsor = await getSponsorByIdAdmin(params.id);
  if (!sponsor) notFound();

  const updateBound = updateSponsor.bind(null, params.id, sponsor.logo_path);

  return (
    <SponsorForm
      action={updateBound}
      sponsor={sponsor}
      currentLogoUrl={getImageUrl(sponsor.logo_path)}
      title={`Editar · ${sponsor.name}`}
    />
  );
}
