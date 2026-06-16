import { createClient } from '@/lib/supabase/server';
import { localizePath, type Locale } from '@/lib/i18n/config';

/**
 * Forma "pública" de un tier en el idioma activo.
 * Compatible con el componente <Tickets> existente.
 */
export type PublicTier = {
  id: string;
  slug: string;
  name: string;
  label: string;
  price: string;
  priceCop: number;
  priceNote?: string;
  highlight: boolean;
  badge?: string;
  benefits: string[];
  ctaLabel: string;
  ctaHref: string;
};

/**
 * Forma cruda en DB. Lo usa el admin.
 */
export type TierRow = {
  id: string;
  slug: string;
  name_es: string;
  name_en: string;
  label_es: string | null;
  label_en: string | null;
  price_cop: number;
  price_note_es: string | null;
  price_note_en: string | null;
  benefits_es: string[];
  benefits_en: string[];
  highlight: boolean;
  badge_es: string | null;
  badge_en: string | null;
  cta_label_es: string;
  cta_label_en: string;
  cta_href: string;
  max_quantity: number | null;
  sold_count: number;
  active: boolean;
  sort_order: number;
  visible_from: string | null;
  visible_until: string | null;
  created_at: string;
  updated_at: string;
};

export function formatCop(value: number): string {
  return `COP $${value.toLocaleString('es-CO')}`;
}

/**
 * Resuelve el href de CTA del tier para el landing:
 *   - http/https/mailto → tal cual
 *   - /checkout (sin query) → auto-append ?tier=<slug>
 *   - paths internos → prefija con locale si no es default
 */
function resolveCtaHref(href: string, locale: Locale, slug: string): string {
  if (!href) return href;
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href.startsWith('mailto:')) return href;
  if (!href.startsWith('/')) return href;

  let final = href;
  // Si apunta a /checkout sin query, le pegamos el tier automáticamente.
  // Evita que el admin tenga que recordar agregarlo a mano.
  if (
    (final === '/checkout' || final.startsWith('/checkout?') === false) &&
    final.startsWith('/checkout') &&
    !final.includes('?')
  ) {
    final = `${final}?tier=${encodeURIComponent(slug)}`;
  }

  return localizePath(final, locale);
}

function toPublic(row: TierRow, locale: Locale): PublicTier {
  const isEs = locale === 'es';
  return {
    id: row.id,
    slug: row.slug,
    name: isEs ? row.name_es : row.name_en,
    label: (isEs ? row.label_es : row.label_en) ?? '',
    price: formatCop(row.price_cop),
    priceCop: row.price_cop,
    priceNote: (isEs ? row.price_note_es : row.price_note_en) ?? undefined,
    highlight: row.highlight,
    badge: (isEs ? row.badge_es : row.badge_en) ?? undefined,
    benefits: isEs ? row.benefits_es : row.benefits_en,
    ctaLabel: isEs ? row.cta_label_es : row.cta_label_en,
    ctaHref: resolveCtaHref(row.cta_href, locale, row.slug)
  };
}

/**
 * Lee los tiers ACTIVOS (visibles para el público) en el idioma indicado.
 * Filtra por ventanas de visibilidad (`visible_from` / `visible_until`).
 */
export async function getActiveTiers(locale: Locale): Promise<PublicTier[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('ticket_tiers')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];

  return (data as TierRow[])
    .filter((row) => !row.visible_from || row.visible_from <= now)
    .filter((row) => !row.visible_until || row.visible_until >= now)
    .map((row) => toPublic(row, locale));
}

/**
 * Para uso en /admin: trae TODOS los tiers, incluyendo inactivos.
 */
export async function getAllTiersAdmin(): Promise<TierRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ticket_tiers')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data as TierRow[];
}

export async function getTierById(id: string): Promise<TierRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ticket_tiers')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as TierRow;
}
