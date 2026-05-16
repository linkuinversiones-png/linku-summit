import SponsorForm from '../SponsorForm';
import { createSponsor } from '../actions';

export const metadata = { title: 'Nuevo sponsor · Admin · LINKU SUMMIT' };

export default function NewSponsorPage() {
  return <SponsorForm action={createSponsor} title="Nuevo sponsor" />;
}
