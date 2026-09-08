import { createClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n/config';
import { getContent } from '@/lib/i18n/content';

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
export type PublicSalonTalk = {
  time?: string;
  endTime?: string;
  title: string;
  speaker?: string;
  desc?: string;
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
  subItems?: PublicSubItem[];
};

export type PublicAgendaDay = {
  label: string;
  date: string;
  tagline?: string;
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

function toPublicDay(day: DayWithChildren, locale: Locale): PublicAgendaDay {
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
                desc: pick(locale, t.desc_es, t.desc_en) || undefined
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
        subItems: salones.length > 0 ? salones : undefined
      };
    });

  return {
    label: pick(locale, day.label_es, day.label_en),
    date: day.date ?? '',
    tagline: pick(locale, day.tagline_es, day.tagline_en) || undefined,
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

    return {
      intro: fallback.intro, // el lead de la sección sigue viniendo del JSON
      day1: toPublicDay(d1, locale),
      day2: toPublicDay(d2, locale)
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
