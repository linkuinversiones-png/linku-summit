import SponsorForm from '../SponsorForm';
import { createSponsor } from '../actions';
import { SPONSOR_CATEGORIES } from '@/lib/sponsors-constants';

export const metadata = { title: 'Nuevo sponsor · Admin · LINKU SUMMIT' };

export default async function NewSponsorPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  // ?category=empresa-agenda preselecciona la categoría (solo si es válida).
  const cat = (await searchParams).category;
  const defaultCategory = SPONSOR_CATEGORIES.some((c) => c.slug === cat) ? cat : undefined;
  return (
    <SponsorForm action={createSponsor} title="Nuevo sponsor" defaultCategory={defaultCategory} />
  );
}
