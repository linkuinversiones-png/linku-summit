/**
 * Constantes y tipos puros de sponsors — SAFE para importar desde
 * client components. No importa supabase/server ni next/headers.
 *
 * Las queries con DB viven en lib/sponsors.ts (server-only).
 */

export type SponsorCategory = {
  slug: string;
  titleEs: string;
  titleEn: string;
  aliado?: boolean;
  /** Empresa invitada solo para la agenda: nunca se muestra en el muro público. */
  soloAgenda?: boolean;
};

export const SPONSOR_CATEGORIES: SponsorCategory[] = [
  { slug: 'series-c', titleEs: 'Series C Sponsors', titleEn: 'Series C Sponsors' },
  { slug: 'series-b', titleEs: 'Series B Sponsors', titleEn: 'Series B Sponsors' },
  { slug: 'series-a', titleEs: 'Series A Sponsors', titleEn: 'Series A Sponsors' },
  { slug: 'pre-series-a', titleEs: 'Pre-Series A Sponsors', titleEn: 'Pre-Series A Sponsors' },
  { slug: 'seed', titleEs: 'Seed Sponsors', titleEn: 'Seed Sponsors' },
  { slug: 'pre-seed', titleEs: 'Pre-Seed Sponsors', titleEn: 'Pre-Seed Sponsors' },
  { slug: 'angel', titleEs: 'Angel Sponsors', titleEn: 'Angel Sponsors' },
  // Bloque de aliados: se pintan en este orden, debajo de los sponsors.
  {
    slug: 'aliado-academico',
    titleEs: 'Aliado Académico',
    titleEn: 'Academic Partner',
    aliado: true
  },
  { slug: 'aliados', titleEs: 'Aliados', titleEn: 'Partners', aliado: true },
  { slug: 'media-partner', titleEs: 'Media Partner', titleEn: 'Media Partner', aliado: true },
  // Empresas que solo se vinculan a espacios de la agenda (ej. Elevator
  // Pitches). NO aparecen en el muro de sponsors.
  {
    slug: 'empresa-agenda',
    titleEs: 'Empresa invitada (solo agenda)',
    titleEn: 'Invited company (agenda only)',
    soloAgenda: true
  }
];
