import { createClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n/config';
import { getContent } from '@/lib/i18n/content';
import { getImageUrl } from '@/lib/storage';

/**
 * Agenda administrable (migración 0014). La home lee de DB; si la DB está
 * vacía o sin configurar, cae al JSON estático (mismo patrón que tiers).
 */

// ---------------------------------------------------------------------
// Filas crudas de DB
// ---------------------------------------------------------------------
export type AgendaDayRow = {
  id: string;
  day_number: number;
  label_es: string;
  label_en: string | null;
  date: string | null;
  tagline_es: string | null;
  tagline_en: string | null;
  active: boolean;
  // Actividad paralela de todo el día (migración 0021). Opcionales: si la
  // migración aún no está aplicada, las columnas no vienen en el select('*').
  parallel_title_es?: string | null;
  parallel_title_en?: string | null;
  parallel_desc_es?: string | null;
  parallel_desc_en?: string | null;
  parallel_time_es?: string | null;
  parallel_time_en?: string | null;
};

export type AgendaItemRow = {
  id: string;
  day_id: string;
  sort_order: number;
  start_time: string;
  end_time: string | null;
  type: string;
  title_es: string;
  title_en: string | null;
  desc_es: string;
  desc_en: string | null;
  speaker_label_es: string | null;
  speaker_label_en: string | null;
  active: boolean;
};

export type AgendaSalonRow = {
  id: string;
  item_id: string;
  sort_order: number;
  code: string;
  name_es: string;
  name_en: string | null;
  tag_es: string | null;
  tag_en: string | null;
  active: boolean;
};

export type AgendaSalonItemRow = {
  id: string;
  salon_id: string;
  sort_order: number;
  start_time: string | null;
  end_time: string | null;
  title_es: string;
  title_en: string | null;
  desc_es: string;
  desc_en: string | null;
  speaker_label_es: string | null;
  speaker_label_en: string | null;
  active: boolean;
};

export type LinkedSpeaker = { speaker_id: string; sort_order: number; speakers: { name: string } | null };

// ---------------------------------------------------------------------
// Forma pública que consume el componente Agenda del home
// ---------------------------------------------------------------------
export type PublicCompany = {
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
};

export type PublicSalonTalk = {
  time?: string;
  endTime?: string;
  title: string;
  speaker?: string;
  desc?: string;
  companies?: PublicCompany[];
};

export type PublicSubItem = {
  code: string;
  name: string;
  tag?: string;
  talks?: PublicSalonTalk[];
};

export type PublicAgendaItem = {
  time: string;
  endTime?: string;
  type: string;
  title: string;
  speaker?: string;
  desc: string;
  companies?: PublicCompany[];
  subItems?: PublicSubItem[];
};

export type PublicAgendaDay = {
  label: string;
  date: string;
  tagline?: string;
  /** Actividad paralela de todo el día; solo si hay título en el idioma. */
  parallel?: { title: string; desc?: string; time?: string };
  items: PublicAgendaItem[];
};

export type PublicAgenda = {
  intro?: { lead: string };
  day1: PublicAgendaDay;
  day2: PublicAgendaDay;
};

function pick(locale: Locale, es: string | null | undefined, en: string | null | undefined): string {
  const esv = es ?? '';
  if (locale === 'es') return esv;
  return en || esv; // EN cae a ES si no hay traducción
}

/** Nombres de speakers vinculados; si no hay, usa el texto libre. */
function speakerText(
  locale: Locale,
  linked: LinkedSpeaker[] | null | undefined,
  labelEs: string | null,
  labelEn: string | null
): string | undefined {
  const names = (linked ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((l) => l.speakers?.name)
    .filter(Boolean) as string[];
  if (names.length > 0) return names.join(' · ');
  const label = pick(locale, labelEs, labelEn);
  return label || undefined;
}

// ---------------------------------------------------------------------
// Empresas vinculadas (migración 0023). Se leen en consultas APARTE del
// select principal: si la migración aún no está aplicada (o la consulta
// falla) la agenda sigue funcionando, solo que sin empresas.
// ---------------------------------------------------------------------
type CompanyLinkRow = {
  item_id?: string;
  salon_item_id?: string;
  sort_order: number;
  sponsors: {
    name: string;
    logo_path: string | null;
    website_url: string | null;
    active: boolean;
  } | null;
};

type CompaniesByParent = Map<string, PublicCompany[]>;

async function fetchCompanies(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itemIds: string[],
  talkIds: string[]
): Promise<{ items: CompaniesByParent; talks: CompaniesByParent }> {
  const items: CompaniesByParent = new Map();
  const talks: CompaniesByParent = new Map();
  try {
    const group = (rows: CompanyLinkRow[], key: 'item_id' | 'salon_item_id', out: CompaniesByParent) => {
      const sorted = rows.slice().sort((a, b) => a.sort_order - b.sort_order);
      for (const r of sorted) {
        const parent = r[key];
        // La RLS ya oculta sponsors inactivos a anónimos; se revalida igual.
        if (!parent || !r.sponsors || !r.sponsors.active) continue;
        const list = out.get(parent) ?? [];
        list.push({
          name: r.sponsors.name,
          logoUrl: getImageUrl(r.sponsors.logo_path),
          websiteUrl: r.sponsors.website_url
        });
        out.set(parent, list);
      }
    };
    if (itemIds.length > 0) {
      const { data, error } = await supabase
        .from('agenda_item_companies')
        .select('item_id, sort_order, sponsors ( name, logo_path, website_url, active )')
        .in('item_id', itemIds);
      if (!error && data) group(data as unknown as CompanyLinkRow[], 'item_id', items);
    }
    if (talkIds.length > 0) {
      const { data, error } = await supabase
        .from('agenda_salon_item_companies')
        .select('salon_item_id, sort_order, sponsors ( name, logo_path, website_url, active )')
        .in('salon_item_id', talkIds);
      if (!error && data) group(data as unknown as CompanyLinkRow[], 'salon_item_id', talks);
    }
  } catch {
    // Sin empresas: no rompe la agenda.
  }
  return { items, talks };
}

export type DayWithChildren = AgendaDayRow & {
  agenda_items: Array<
    AgendaItemRow & {
      agenda_item_speakers: LinkedSpeaker[];
      agenda_salones: Array<
        AgendaSalonRow & {
          agenda_salon_items: Array<
            AgendaSalonItemRow & { agenda_salon_item_speakers: LinkedSpeaker[] }
          >;
        }
      >;
    }
  >;
};

const AGENDA_SELECT = `
  *,
  agenda_items (
    *,
    agenda_item_speakers ( speaker_id, sort_order, speakers ( name ) ),
    agenda_salones (
      *,
      agenda_salon_items (
        *,
        agenda_salon_item_speakers ( speaker_id, sort_order, speakers ( name ) )
      )
    )
  )
`;

type CompanyMaps = { items: CompaniesByParent; talks: CompaniesByParent };

function toPublicDay(
  day: DayWithChildren,
  locale: Locale,
  companies: CompanyMaps
): PublicAgendaDay {
  const items = (day.agenda_items ?? [])
    .filter((i) => i.active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item): PublicAgendaItem => {
      const salones = (item.agenda_salones ?? [])
        .filter((s) => s.active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((salon): PublicSubItem => {
          const talks = (salon.agenda_salon_items ?? [])
            .filter((t) => t.active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(
              (t): PublicSalonTalk => ({
                time: t.start_time ?? undefined,
                endTime: t.end_time ?? undefined,
                title: pick(locale, t.title_es, t.title_en),
                speaker: speakerText(
                  locale,
                  t.agenda_salon_item_speakers,
                  t.speaker_label_es,
                  t.speaker_label_en
                ),
                desc: pick(locale, t.desc_es, t.desc_en) || undefined,
                companies: companies.talks.get(t.id)
              })
            );
          return {
            code: salon.code,
            name: pick(locale, salon.name_es, salon.name_en),
            tag: pick(locale, salon.tag_es, salon.tag_en) || undefined,
            talks: talks.length > 0 ? talks : undefined
          };
        });

      return {
        time: item.start_time,
        endTime: item.end_time ?? undefined,
        type: item.type,
        title: pick(locale, item.title_es, item.title_en),
        speaker: speakerText(
          locale,
          item.agenda_item_speakers,
          item.speaker_label_es,
          item.speaker_label_en
        ),
        desc: pick(locale, item.desc_es, item.desc_en),
        companies: companies.items.get(item.id),
        subItems: salones.length > 0 ? salones : undefined
      };
    });

  const parallelTitle = pick(locale, day.parallel_title_es, day.parallel_title_en);
  const parallel = parallelTitle
    ? {
        title: parallelTitle,
        desc: pick(locale, day.parallel_desc_es, day.parallel_desc_en) || undefined,
        time: pick(locale, day.parallel_time_es, day.parallel_time_en) || undefined
      }
    : undefined;

  return {
    label: pick(locale, day.label_es, day.label_en),
    date: day.date ?? '',
    tagline: pick(locale, day.tagline_es, day.tagline_en) || undefined,
    parallel,
    items
  };
}

/** Agenda pública para el home. DB primero; fallback al JSON estático. */
export async function getAgenda(locale: Locale): Promise<PublicAgenda> {
  const fallback = getContent(locale).agenda as PublicAgenda;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return fallback;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('agenda_days')
      .select(AGENDA_SELECT)
      .eq('active', true)
      .order('day_number', { ascending: true });

    if (error || !data || data.length === 0) return fallback;

    const days = data as unknown as DayWithChildren[];
    const d1 = days.find((d) => d.day_number === 1);
    const d2 = days.find((d) => d.day_number === 2);
    if (!d1 || !d2) return fallback;

    // Empresas vinculadas: consulta aparte, tolerante a fallos (ver arriba).
    const allItems = days.flatMap((d) => d.agenda_items ?? []);
    const companies = await fetchCompanies(
      supabase,
      allItems.map((i) => i.id),
      allItems.flatMap((i) =>
        (i.agenda_salones ?? []).flatMap((s) => (s.agenda_salon_items ?? []).map((t) => t.id))
      )
    );

    return {
      intro: fallback.intro, // el lead de la sección sigue viniendo del JSON
      day1: toPublicDay(d1, locale, companies),
      day2: toPublicDay(d2, locale, companies)
    };
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------
// Lectura completa para el admin (incluye inactivos y ambos idiomas)
// ---------------------------------------------------------------------
export type AdminAgendaTree = Array<DayWithChildren>;

export async function getAgendaAdmin(): Promise<AdminAgendaTree> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agenda_days')
    .select(AGENDA_SELECT)
    .order('day_number', { ascending: true });
  if (error) throw new Error(`Error leyendo agenda: ${error.message}`);
  const days = (data ?? []) as unknown as DayWithChildren[];
  // Orden estable de hijos para el admin
  for (const d of days) {
    d.agenda_items.sort((a, b) => a.sort_order - b.sort_order);
    for (const i of d.agenda_items) {
      i.agenda_salones.sort((a, b) => a.sort_order - b.sort_order);
      for (const s of i.agenda_salones) {
        s.agenda_salon_items.sort((a, b) => a.sort_order - b.sort_order);
      }
    }
  }
  return days;
}

/**
 * Vínculos de empresas para el admin: { sponsor_id, sort_order } por bloque y
 * por charla. `available` es false si las tablas (migración 0023) aún no
 * existen; en ese caso el editor deshabilita la sección.
 */
export type AdminCompanyLinks = {
  available: boolean;
  items: Record<string, string[]>; // item_id → sponsor_ids en orden
  talks: Record<string, string[]>; // salon_item_id → sponsor_ids en orden
};

export async function getAgendaCompaniesAdmin(): Promise<AdminCompanyLinks> {
  const empty: AdminCompanyLinks = { available: false, items: {}, talks: {} };
  try {
    const supabase = await createClient();
    const [a, b] = await Promise.all([
      supabase.from('agenda_item_companies').select('item_id, sponsor_id, sort_order'),
      supabase.from('agenda_salon_item_companies').select('salon_item_id, sponsor_id, sort_order')
    ]);
    if (a.error || b.error) return empty;
    const build = (rows: Array<Record<string, unknown>>, key: string) => {
      const out: Record<string, string[]> = {};
      const sorted = rows.slice().sort((x, y) => Number(x.sort_order) - Number(y.sort_order));
      for (const r of sorted) {
        const k = String(r[key]);
        (out[k] ??= []).push(String(r.sponsor_id));
      }
      return out;
    };
    return {
      available: true,
      items: build((a.data ?? []) as Array<Record<string, unknown>>, 'item_id'),
      talks: build((b.data ?? []) as Array<Record<string, unknown>>, 'salon_item_id')
    };
  } catch {
    return empty;
  }
}
