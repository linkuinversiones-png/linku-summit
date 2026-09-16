import { createClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n/config';

/**
 * Ajustes del sitio (tabla site_settings, clave → JSON). Lectura pública,
 * escritura solo admin desde /admin/settings.
 */

export type MeetingsSettings = {
  enabled: boolean;
  url: string;
  title_es: string;
  title_en: string;
  desc_es: string;
  desc_en: string;
  cta_es: string;
  cta_en: string;
  note_es: string;
  note_en: string;
};

export const MEETINGS_DEFAULTS: MeetingsSettings = {
  enabled: false,
  url: '',
  title_es: 'Agenda tus citas 1:1',
  title_en: 'Book your 1:1 meetings',
  desc_es:
    'Reuniones de 20 minutos con inversionistas, gestores y founders, coordinadas antes del summit.',
  desc_en:
    '20-minute meetings with investors, managers and founders, arranged before the summit.',
  cta_es: 'Abrir agenda de citas',
  cta_en: 'Open the meetings scheduler',
  note_es: 'La agenda se habilita más cerca del evento. Te avisaremos por correo.',
  note_en: 'The scheduler opens closer to the event. We will email you.'
};

export type MeetingsSettingsRow = {
  value: MeetingsSettings;
  updated_at: string | null;
  updated_by_email: string | null;
};

/** Ajustes de citas con los valores por defecto rellenando lo que falte. */
export async function getMeetingsSettings(): Promise<MeetingsSettingsRow> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('site_settings')
    .select('value, updated_at, updated_by_email')
    .eq('key', 'meetings')
    .maybeSingle();

  const raw = (data?.value ?? {}) as Partial<MeetingsSettings>;
  return {
    value: { ...MEETINGS_DEFAULTS, ...raw },
    updated_at: data?.updated_at ?? null,
    updated_by_email: data?.updated_by_email ?? null
  };
}

/** Textos de la tarjeta de citas en un idioma, con caída al español. */
export function meetingsCopy(s: MeetingsSettings, locale: Locale) {
  const pick = (es: string, en: string) => (locale === 'en' ? en || es : es);
  return {
    title: pick(s.title_es, s.title_en),
    desc: pick(s.desc_es, s.desc_en),
    cta: pick(s.cta_es, s.cta_en),
    note: pick(s.note_es, s.note_en)
  };
}
