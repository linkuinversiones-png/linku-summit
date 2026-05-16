import SpeakerForm from '../SpeakerForm';
import { createSpeaker } from '../actions';

export const metadata = { title: 'Nuevo speaker · Admin · LINKU SUMMIT' };

export default function NewSpeakerPage() {
  return <SpeakerForm action={createSpeaker} title="Nuevo speaker" />;
}
