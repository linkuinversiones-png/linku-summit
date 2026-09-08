import type {
  AgendaDayRow,
  AgendaItemRow,
  AgendaSalonRow,
  AgendaSalonItemRow,
  LinkedSpeaker
} from '@/lib/agenda';
import type { SpeakerOption } from './ui';

/**
 * Nodos del árbol que el editor mantiene en estado local.
 * Misma forma que devuelve getAgendaAdmin(), nombrada aparte para
 * que los componentes no dependan del tipo interno de la query.
 */
export type TalkNode = AgendaSalonItemRow & {
  agenda_salon_item_speakers: LinkedSpeaker[];
};

export type SalonNode = AgendaSalonRow & {
  agenda_salon_items: TalkNode[];
};

export type ItemNode = AgendaItemRow & {
  agenda_item_speakers: LinkedSpeaker[];
  agenda_salones: SalonNode[];
};

export type DayNode = AgendaDayRow & {
  agenda_items: ItemNode[];
};

/** Texto de un campo de formulario, ya recortado. */
export function str(v: FormDataEntryValue | null | undefined): string {
  return String(v ?? '').trim();
}

/** Igual que str(), pero vacío se guarda como NULL (como hace la DB). */
export function orNull(v: FormDataEntryValue | null | undefined): string | null {
  const s = str(v);
  return s === '' ? null : s;
}

/** Construye los vínculos de speakers para reflejar la selección en el estado local. */
export function linksFor(ids: string[], speakers: SpeakerOption[]): LinkedSpeaker[] {
  const byId = new Map(speakers.map((s) => [s.id, s.name]));
  return ids.map((speaker_id, idx) => ({
    speaker_id,
    sort_order: (idx + 1) * 10,
    speakers: { name: byId.get(speaker_id) ?? '' }
  }));
}

/** Nombres a mostrar para un conjunto de vínculos, en orden. */
export function linkedNames(links: LinkedSpeaker[]): string[] {
  return links
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((l) => l.speakers?.name)
    .filter((n): n is string => Boolean(n));
}

/** Siguiente código sugerido para un salón nuevo: A, B, C… */
export function nextSalonCode(existing: SalonNode[]): string {
  const used = new Set(existing.map((s) => s.code.toUpperCase()));
  for (let i = 0; i < 26; i++) {
    const c = String.fromCharCode(65 + i);
    if (!used.has(c)) return c;
  }
  return `S${existing.length + 1}`;
}
