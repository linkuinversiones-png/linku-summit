import { notFound } from 'next/navigation';
import SpeakerForm from '../SpeakerForm';
import { updateSpeaker } from '../actions';
import { getSpeakerByIdAdmin } from '@/lib/speakers';
import { getImageUrl } from '@/lib/storage';

export const metadata = { title: 'Editar speaker · Admin · LINKU SUMMIT' };
export const dynamic = 'force-dynamic';

export default async function EditSpeakerPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const speaker = await getSpeakerByIdAdmin(params.id);
  if (!speaker) notFound();

  const updateBound = updateSpeaker.bind(null, params.id, speaker.avatar_path);

  return (
    <SpeakerForm
      action={updateBound}
      speaker={speaker}
      currentAvatarUrl={getImageUrl(speaker.avatar_path)}
      title={`Editar · ${speaker.name}`}
    />
  );
}
