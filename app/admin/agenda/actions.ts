'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ITEM_TYPE_VALUES } from './constants';

/**
 * Server actions del admin de agenda.
 *
 * Seguridad: TODAS las acciones verifican admin contra la sesión del request
 * (assertAdmin) ANTES de tocar datos con el service client. Los payloads se
 * validan server-side — nunca se confía en lo que mande la UI.
 */

export type AgendaActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

const TIME_RE = /^\d{2}:\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tipos de bloque permitidos. Viven en ./constants para que el <select>
 *  del editor y esta validacion nunca se desincronicen. */
const ALLOWED_TYPES = new Set<string>(ITEM_TYPE_VALUES);

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/agenda');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/?error=unauthorized');
  return user;
}

function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

function cleanStr(v: unknown, max = 500): string {
  return String(v ?? '').trim().slice(0, max);
}

function cleanTime(v: unknown): string | null {
  const s = cleanStr(v, 5);
  return TIME_RE.test(s) ? s : null;
}

function fail(message: string): AgendaActionResult {
  return { ok: false, message };
}

function done(id?: string): AgendaActionResult {
  revalidatePath('/admin/agenda');
  return { ok: true, id };
}

// ---------------------------------------------------------------------
// Días
// ---------------------------------------------------------------------
export type DayInput = {
  label_es: string;
  label_en?: string;
  date?: string; // YYYY-MM-DD
  tagline_es?: string;
  tagline_en?: string;
};

export async function updateDay(dayId: string, input: DayInput): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(dayId)) return fail('Id de día inválido');
  const label_es = cleanStr(input.label_es, 200);
  if (!label_es) return fail('El nombre del día es requerido');
  const date = cleanStr(input.date, 10);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Fecha inválida (YYYY-MM-DD)');

  const sb = createServiceClient();
  const { error } = await sb
    .from('agenda_days')
    .update({
      label_es,
      label_en: cleanStr(input.label_en, 200) || null,
      date: date || null,
      tagline_es: cleanStr(input.tagline_es, 300) || null,
      tagline_en: cleanStr(input.tagline_en, 300) || null
    })
    .eq('id', dayId);
  if (error) return fail(`No se pudo guardar el día: ${error.message}`);
  return done(dayId);
}

// ---------------------------------------------------------------------
// Bloques (agenda_items)
// ---------------------------------------------------------------------
export type ItemInput = {
  start_time: string;
  end_time?: string;
  type: string;
  title_es: string;
  title_en?: string;
  desc_es?: string;
  desc_en?: string;
  speaker_label_es?: string;
  speaker_label_en?: string;
  active?: boolean;
};

function validateItem(input: ItemInput):
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; message: string } {
  const start_time = cleanTime(input.start_time);
  if (!start_time) return { ok: false, message: 'Hora de inicio inválida (HH:MM)' };
  const end_time = input.end_time ? cleanTime(input.end_time) : null;
  if (input.end_time && !end_time) return { ok: false, message: 'Hora de fin inválida (HH:MM)' };
  const type = cleanStr(input.type, 30);
  if (!ALLOWED_TYPES.has(type)) return { ok: false, message: `Tipo de bloque inválido: ${type}` };
  const title_es = cleanStr(input.title_es, 300);
  if (!title_es) return { ok: false, message: 'El título es requerido' };

  return {
    ok: true,
    row: {
      start_time,
      end_time,
      type,
      title_es,
      title_en: cleanStr(input.title_en, 300) || null,
      desc_es: cleanStr(input.desc_es, 2000),
      desc_en: cleanStr(input.desc_en, 2000) || null,
      speaker_label_es: cleanStr(input.speaker_label_es, 300) || null,
      speaker_label_en: cleanStr(input.speaker_label_en, 300) || null,
      active: input.active !== false
    }
  };
}

export async function createItem(dayId: string, input: ItemInput): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(dayId)) return fail('Id de día inválido');
  const v = validateItem(input);
  if (!v.ok) return fail(v.message);

  const sb = createServiceClient();
  // Al final del día por defecto
  const { data: last } = await sb
    .from('agenda_items')
    .select('sort_order')
    .eq('day_id', dayId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await sb
    .from('agenda_items')
    .insert({ ...v.row, day_id: dayId, sort_order: (last?.sort_order ?? 0) + 10 })
    .select('id')
    .single();
  if (error) return fail(`No se pudo crear el bloque: ${error.message}`);
  return done(data.id);
}

export async function updateItem(itemId: string, input: ItemInput): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(itemId)) return fail('Id de bloque inválido');
  const v = validateItem(input);
  if (!v.ok) return fail(v.message);

  const sb = createServiceClient();
  const { error } = await sb.from('agenda_items').update(v.row).eq('id', itemId);
  if (error) return fail(`No se pudo guardar el bloque: ${error.message}`);
  return done(itemId);
}

export async function deleteItem(itemId: string): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(itemId)) return fail('Id de bloque inválido');
  const sb = createServiceClient();
  // Cascade borra salones, subagendas y vínculos con speakers.
  const { error } = await sb.from('agenda_items').delete().eq('id', itemId);
  if (error) return fail(`No se pudo eliminar: ${error.message}`);
  return done();
}

/** Reordena los bloques de un día según el nuevo orden del drag & drop. */
export async function reorderItems(
  dayId: string,
  orderedItemIds: string[]
): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(dayId)) return fail('Id de día inválido');
  if (!Array.isArray(orderedItemIds) || orderedItemIds.some((id) => !isUuid(id))) {
    return fail('Lista de ids inválida');
  }

  const sb = createServiceClient();
  // Solo reordenamos items que realmente pertenecen a ese día.
  const { data: existing, error: readErr } = await sb
    .from('agenda_items')
    .select('id')
    .eq('day_id', dayId);
  if (readErr) return fail(readErr.message);
  const valid = new Set((existing ?? []).map((r) => r.id));

  const updates = orderedItemIds
    .filter((id) => valid.has(id))
    .map((id, idx) =>
      sb.from('agenda_items').update({ sort_order: (idx + 1) * 10 }).eq('id', id)
    );
  const results = await Promise.all(updates);
  const firstErr = results.find((r) => r.error);
  if (firstErr?.error) return fail(`Error reordenando: ${firstErr.error.message}`);
  return done();
}

// ---------------------------------------------------------------------
// Salones (agenda_salones)
// ---------------------------------------------------------------------
export type SalonInput = {
  code: string;
  name_es: string;
  name_en?: string;
  tag_es?: string;
  tag_en?: string;
  active?: boolean;
};

function validateSalon(input: SalonInput):
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; message: string } {
  const code = cleanStr(input.code, 12);
  if (!code) return { ok: false, message: 'El código del salón es requerido (ej. A, B, 1:1)' };
  const name_es = cleanStr(input.name_es, 200);
  if (!name_es) return { ok: false, message: 'El nombre del salón es requerido' };
  return {
    ok: true,
    row: {
      code,
      name_es,
      name_en: cleanStr(input.name_en, 200) || null,
      tag_es: cleanStr(input.tag_es, 200) || null,
      tag_en: cleanStr(input.tag_en, 200) || null,
      active: input.active !== false
    }
  };
}

export async function createSalon(itemId: string, input: SalonInput): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(itemId)) return fail('Id de bloque inválido');
  const v = validateSalon(input);
  if (!v.ok) return fail(v.message);

  const sb = createServiceClient();
  const { data: last } = await sb
    .from('agenda_salones')
    .select('sort_order')
    .eq('item_id', itemId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await sb
    .from('agenda_salones')
    .insert({ ...v.row, item_id: itemId, sort_order: (last?.sort_order ?? 0) + 10 })
    .select('id')
    .single();
  if (error) return fail(`No se pudo crear el salón: ${error.message}`);
  return done(data.id);
}

export async function updateSalon(salonId: string, input: SalonInput): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(salonId)) return fail('Id de salón inválido');
  const v = validateSalon(input);
  if (!v.ok) return fail(v.message);

  const sb = createServiceClient();
  const { error } = await sb.from('agenda_salones').update(v.row).eq('id', salonId);
  if (error) return fail(`No se pudo guardar el salón: ${error.message}`);
  return done(salonId);
}

export async function deleteSalon(salonId: string): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(salonId)) return fail('Id de salón inválido');
  const sb = createServiceClient();
  const { error } = await sb.from('agenda_salones').delete().eq('id', salonId);
  if (error) return fail(`No se pudo eliminar el salón: ${error.message}`);
  return done();
}

export async function reorderSalones(
  itemId: string,
  orderedSalonIds: string[]
): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(itemId)) return fail('Id de bloque inválido');
  if (!Array.isArray(orderedSalonIds) || orderedSalonIds.some((id) => !isUuid(id))) {
    return fail('Lista de ids inválida');
  }

  const sb = createServiceClient();
  const { data: existing, error: readErr } = await sb
    .from('agenda_salones')
    .select('id')
    .eq('item_id', itemId);
  if (readErr) return fail(readErr.message);
  const valid = new Set((existing ?? []).map((r) => r.id));

  const results = await Promise.all(
    orderedSalonIds
      .filter((id) => valid.has(id))
      .map((id, idx) =>
        sb.from('agenda_salones').update({ sort_order: (idx + 1) * 10 }).eq('id', id)
      )
  );
  const firstErr = results.find((r) => r.error);
  if (firstErr?.error) return fail(`Error reordenando salones: ${firstErr.error.message}`);
  return done();
}

// ---------------------------------------------------------------------
// Subagenda de salón (agenda_salon_items)
// ---------------------------------------------------------------------
export type SalonTalkInput = {
  start_time?: string;
  end_time?: string;
  title_es: string;
  title_en?: string;
  desc_es?: string;
  desc_en?: string;
  speaker_label_es?: string;
  speaker_label_en?: string;
  active?: boolean;
};

function validateSalonTalk(input: SalonTalkInput):
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; message: string } {
  const start_time = input.start_time ? cleanTime(input.start_time) : null;
  if (input.start_time && !start_time)
    return { ok: false, message: 'Hora de inicio inválida (HH:MM)' };
  const end_time = input.end_time ? cleanTime(input.end_time) : null;
  if (input.end_time && !end_time) return { ok: false, message: 'Hora de fin inválida (HH:MM)' };
  const title_es = cleanStr(input.title_es, 300);
  if (!title_es) return { ok: false, message: 'El título es requerido' };
  return {
    ok: true,
    row: {
      start_time,
      end_time,
      title_es,
      title_en: cleanStr(input.title_en, 300) || null,
      desc_es: cleanStr(input.desc_es, 2000),
      desc_en: cleanStr(input.desc_en, 2000) || null,
      speaker_label_es: cleanStr(input.speaker_label_es, 300) || null,
      speaker_label_en: cleanStr(input.speaker_label_en, 300) || null,
      active: input.active !== false
    }
  };
}

export async function createSalonTalk(
  salonId: string,
  input: SalonTalkInput
): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(salonId)) return fail('Id de salón inválido');
  const v = validateSalonTalk(input);
  if (!v.ok) return fail(v.message);

  const sb = createServiceClient();
  const { data: last } = await sb
    .from('agenda_salon_items')
    .select('sort_order')
    .eq('salon_id', salonId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await sb
    .from('agenda_salon_items')
    .insert({ ...v.row, salon_id: salonId, sort_order: (last?.sort_order ?? 0) + 10 })
    .select('id')
    .single();
  if (error) return fail(`No se pudo crear la charla: ${error.message}`);
  return done(data.id);
}

export async function updateSalonTalk(
  talkId: string,
  input: SalonTalkInput
): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(talkId)) return fail('Id de charla inválido');
  const v = validateSalonTalk(input);
  if (!v.ok) return fail(v.message);

  const sb = createServiceClient();
  const { error } = await sb.from('agenda_salon_items').update(v.row).eq('id', talkId);
  if (error) return fail(`No se pudo guardar la charla: ${error.message}`);
  return done(talkId);
}

export async function deleteSalonTalk(talkId: string): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(talkId)) return fail('Id de charla inválido');
  const sb = createServiceClient();
  const { error } = await sb.from('agenda_salon_items').delete().eq('id', talkId);
  if (error) return fail(`No se pudo eliminar la charla: ${error.message}`);
  return done();
}

export async function reorderSalonTalks(
  salonId: string,
  orderedTalkIds: string[]
): Promise<AgendaActionResult> {
  await assertAdmin();
  if (!isUuid(salonId)) return fail('Id de salón inválido');
  if (!Array.isArray(orderedTalkIds) || orderedTalkIds.some((id) => !isUuid(id))) {
    return fail('Lista de ids inválida');
  }

  const sb = createServiceClient();
  const { data: existing, error: readErr } = await sb
    .from('agenda_salon_items')
    .select('id')
    .eq('salon_id', salonId);
  if (readErr) return fail(readErr.message);
  const valid = new Set((existing ?? []).map((r) => r.id));

  const results = await Promise.all(
    orderedTalkIds
      .filter((id) => valid.has(id))
      .map((id, idx) =>
        sb.from('agenda_salon_items').update({ sort_order: (idx + 1) * 10 }).eq('id', id)
      )
  );
  const firstErr = results.find((r) => r.error);
  if (firstErr?.error) return fail(`Error reordenando charlas: ${firstErr.error.message}`);
  return done();
}

// ---------------------------------------------------------------------
// Vínculos con speakers
// ---------------------------------------------------------------------
async function replaceSpeakerLinks(
  table: 'agenda_item_speakers' | 'agenda_salon_item_speakers',
  fkColumn: 'item_id' | 'salon_item_id',
  parentId: string,
  speakerIds: string[]
): Promise<AgendaActionResult> {
  if (!isUuid(parentId)) return fail('Id inválido');
  if (!Array.isArray(speakerIds) || speakerIds.some((id) => !isUuid(id))) {
    return fail('Lista de speakers inválida');
  }

  const sb = createServiceClient();
  // Reemplazo total: refleja exactamente la selección de la UI.
  const { error: delErr } = await sb.from(table).delete().eq(fkColumn, parentId);
  if (delErr) return fail(`Error actualizando speakers: ${delErr.message}`);

  if (speakerIds.length > 0) {
    const rows = speakerIds.map((speaker_id, idx) => ({
      [fkColumn]: parentId,
      speaker_id,
      sort_order: (idx + 1) * 10
    }));
    const { error: insErr } = await sb.from(table).insert(rows);
    if (insErr) return fail(`Error vinculando speakers: ${insErr.message}`);
  }
  return done();
}

/** Reemplaza los speakers vinculados a un bloque de agenda. */
export async function setItemSpeakers(
  itemId: string,
  speakerIds: string[]
): Promise<AgendaActionResult> {
  await assertAdmin();
  return replaceSpeakerLinks('agenda_item_speakers', 'item_id', itemId, speakerIds);
}

/** Reemplaza los speakers vinculados a una charla de subagenda. */
export async function setSalonTalkSpeakers(
  talkId: string,
  speakerIds: string[]
): Promise<AgendaActionResult> {
  await assertAdmin();
  return replaceSpeakerLinks('agenda_salon_item_speakers', 'salon_item_id', talkId, speakerIds);
}
