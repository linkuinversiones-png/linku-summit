import { createClient } from '@/lib/supabase/server';
import { getImageUrl } from '@/lib/storage';
import type { Locale } from '@/lib/i18n/config';
import { SPONSOR_CATEGORIES, type SponsorCategory } from '@/lib/sponsors-constants';

// Re-export para que el resto del código que ya importaba desde aquí
// siga funcionando sin cambios.
export { SPONSOR_CATEGORIES };
export type { SponsorCategory };

export type SponsorRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  logo_path: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicSponsor = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
};

export type SponsorGroup = {
  category: SponsorCategory;
  title: string;
  logos: PublicSponsor[]; // mantengo 'logos' por compatibilidad con SponsorsWall
};

export async function getSponsorGroups(locale: Locale): Promise<SponsorGroup[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('sponsors')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  const rows = (data ?? []) as SponsorRow[];
  const byCategory = new Map<string, PublicSponsor[]>();
  for (const r of rows) {
    const existing = byCategory.get(r.category) ?? [];
    existing.push({
      id: r.id,
      slug: r.slug,
      name: r.name,
      logoUrl: getImageUrl(r.logo_path),
      websiteUrl: r.website_url,
      linkedinUrl: r.linkedin_url
    });
    byCategory.set(r.category, existing);
  }

  return SPONSOR_CATEGORIES.filter((c) => (byCategory.get(c.slug)?.length ?? 0) > 0).map(
    (c) => ({
      category: c,
      title: locale === 'es' ? c.titleEs : c.titleEn,
      logos: byCategory.get(c.slug) ?? []
    })
  );
}

export async function getAllSponsorsAdmin(): Promise<SponsorRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('sponsors')
    .select('*')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });
  return (data ?? []) as SponsorRow[];
}

export async function getSponsorByIdAdmin(id: string): Promise<SponsorRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('sponsors')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as SponsorRow | null) ?? null;
}
