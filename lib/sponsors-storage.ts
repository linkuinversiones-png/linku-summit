import { createClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n/config';

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'summit-media';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ROOT = 'sponsors';

/**
 * Categorías de sponsors (orden de aparición visual).
 * El `slug` es el nombre de la subcarpeta en summit-media/sponsors/.
 * Sube logos PNG (preferiblemente blancos sobre transparente) en cada
 * carpeta y aparecen automáticamente — sin código, sin admin, sin DB.
 *
 * 'aliados' tiene flag `aliado=true` para renderizarse al final separado.
 */
export type SponsorCategory = {
  slug: string;
  titleEs: string;
  titleEn: string;
  aliado?: boolean;
};

export const SPONSOR_CATEGORIES: SponsorCategory[] = [
  { slug: 'series-c', titleEs: 'Series C Sponsors', titleEn: 'Series C Sponsors' },
  { slug: 'series-b', titleEs: 'Series B Sponsors', titleEn: 'Series B Sponsors' },
  { slug: 'series-a', titleEs: 'Series A Sponsors', titleEn: 'Series A Sponsors' },
  { slug: 'pre-series-a', titleEs: 'Pre-Series A Sponsors', titleEn: 'Pre-Series A Sponsors' },
  { slug: 'seed', titleEs: 'Seed Sponsors', titleEn: 'Seed Sponsors' },
  { slug: 'pre-seed', titleEs: 'Pre-Seed Sponsors', titleEn: 'Pre-Seed Sponsors' },
  { slug: 'angel', titleEs: 'Angel Sponsors', titleEn: 'Angel Sponsors' },
  { slug: 'aliados', titleEs: 'Aliados', titleEn: 'Partners', aliado: true }
];

export type SponsorLogo = {
  name: string; // derivado del filename (sin extensión)
  url: string; // URL pública del PNG
};

export type SponsorGroup = {
  category: SponsorCategory;
  title: string; // ya localizado
  logos: SponsorLogo[];
};

/**
 * Lista los logos de cada categoría leyendo el bucket de Storage.
 * Se omiten archivos no-imagen y placeholders.
 * Devuelve los grupos con al menos 1 logo (ocultamos categorías vacías).
 */
export async function getSponsorGroups(locale: Locale): Promise<SponsorGroup[]> {
  const supabase = createClient();
  const results = await Promise.all(
    SPONSOR_CATEGORIES.map(async (cat) => {
      const { data } = await supabase.storage.from(BUCKET).list(`${ROOT}/${cat.slug}`, {
        limit: 200,
        sortBy: { column: 'name', order: 'asc' }
      });
      const logos: SponsorLogo[] = (data ?? [])
        .filter((f) => isImage(f.name) && !f.name.startsWith('.'))
        .map((f) => ({
          name: stripExt(f.name),
          url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${ROOT}/${cat.slug}/${encodeURIComponent(f.name)}`
        }));
      return {
        category: cat,
        title: locale === 'es' ? cat.titleEs : cat.titleEn,
        logos
      };
    })
  );

  return results.filter((g) => g.logos.length > 0);
}

function isImage(name: string): boolean {
  return /\.(png|jpg|jpeg|webp|svg)$/i.test(name);
}

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}
