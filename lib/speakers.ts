import { createClient } from '@/lib/supabase/server';
import { getImageUrl } from '@/lib/storage';

export type SpeakerRow = {
  id: string;
  slug: string;
  name: string;
  role: string;
  company: string;
  track: string;
  bio_es: string | null;
  bio_en: string | null;
  linkedin_url: string | null;
  avatar_path: string | null;
  confirmed: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

/** Forma pública usada por el landing — campos planos y URL ya resuelta. */
export type PublicSpeaker = {
  id: string;
  slug: string;
  name: string;
  role: string;
  company: string;
  track: string;
  bio: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
  confirmed: boolean;
};

function toPublic(row: SpeakerRow, locale: 'es' | 'en'): PublicSpeaker {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    role: row.role,
    company: row.company,
    track: row.track,
    bio: (locale === 'es' ? row.bio_es : row.bio_en) ?? null,
    linkedinUrl: row.linkedin_url,
    avatarUrl: getImageUrl(row.avatar_path),
    confirmed: row.confirmed
  };
}

export async function getActiveSpeakers(
  locale: 'es' | 'en'
): Promise<PublicSpeaker[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('speakers')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  return ((data ?? []) as SpeakerRow[]).map((r) => toPublic(r, locale));
}

export async function getAllSpeakersAdmin(): Promise<SpeakerRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('speakers')
    .select('*')
    .order('sort_order', { ascending: true });
  return (data ?? []) as SpeakerRow[];
}

export async function getSpeakerByIdAdmin(id: string): Promise<SpeakerRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('speakers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as SpeakerRow | null) ?? null;
}
