'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

type FieldErrors = Record<string, string>;

export type SpeakerActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'summit-media';

function readForm(form: FormData) {
  const get = (k: string) => (form.get(k)?.toString() ?? '').trim();
  const getBool = (k: string) => form.get(k) === 'on' || form.get(k) === 'true';
  const getNumber = (k: string): number | null => {
    const v = get(k);
    if (v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    slug: get('slug'),
    name: get('name'),
    role: get('role'),
    company: get('company'),
    track: get('track'),
    bio_es: get('bio_es') || null,
    bio_en: get('bio_en') || null,
    linkedin_url: get('linkedin_url') || null,
    confirmed: getBool('confirmed'),
    active: getBool('active'),
    sort_order: getNumber('sort_order') ?? 0
  };
}

function validate(data: ReturnType<typeof readForm>): FieldErrors {
  const errs: FieldErrors = {};
  if (!data.slug) errs.slug = 'Slug requerido';
  else if (!/^[a-z0-9-]+$/.test(data.slug))
    errs.slug = 'Solo minúsculas, números y guiones';
  if (!data.name) errs.name = 'Nombre requerido';
  if (
    data.linkedin_url &&
    !/^https?:\/\/(www\.)?linkedin\.com\//i.test(data.linkedin_url)
  ) {
    errs.linkedin_url = 'Debe ser una URL de LinkedIn válida';
  }
  return errs;
}

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/speakers');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/?error=unauthorized');
  return user;
}

/**
 * Sube el avatar al bucket si el form trae uno nuevo.
 * Path: `speakers/<slug>.<ext>`. Sobreescribe si ya existe.
 * Retorna el path final o null si no se subió nada.
 */
async function maybeUploadAvatar(
  form: FormData,
  slug: string
): Promise<string | null> {
  const file = form.get('avatar') as File | null;
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    return null;
  }
  const ext = (file.name.split('.').pop() ?? 'png').toLowerCase();
  if (!/^(png|jpe?g|webp|avif|gif)$/.test(ext)) {
    throw new Error('Formato de imagen no soportado (usa PNG/JPG/WEBP).');
  }
  const path = `speakers/${slug}.${ext}`;
  const sb = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || `image/${ext}`,
    upsert: true,
    cacheControl: '3600'
  });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
  return path;
}

export async function createSpeaker(
  _prev: SpeakerActionResult | null,
  form: FormData
): Promise<SpeakerActionResult> {
  await assertAdmin();
  const data = readForm(form);
  const fieldErrors = validate(data);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: 'Revisa los campos', fieldErrors };
  }

  let avatarPath: string | null = null;
  try {
    avatarPath = await maybeUploadAvatar(form, data.slug);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('speakers')
    .insert({ ...data, avatar_path: avatarPath });

  if (error) {
    return {
      ok: false,
      message:
        error.code === '23505' ? 'Ya existe un speaker con ese slug' : error.message
    };
  }

  revalidatePath('/admin/speakers');
  revalidatePath('/', 'layout');
  redirect('/admin/speakers');
}

export async function updateSpeaker(
  id: string,
  currentAvatarPath: string | null,
  _prev: SpeakerActionResult | null,
  form: FormData
): Promise<SpeakerActionResult> {
  await assertAdmin();
  const data = readForm(form);
  const fieldErrors = validate(data);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: 'Revisa los campos', fieldErrors };
  }

  let avatarPath = currentAvatarPath;
  try {
    const uploaded = await maybeUploadAvatar(form, data.slug);
    if (uploaded) avatarPath = uploaded;
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('speakers')
    .update({ ...data, avatar_path: avatarPath })
    .eq('id', id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === '23505' ? 'Ya existe un speaker con ese slug' : error.message
    };
  }

  revalidatePath('/admin/speakers');
  revalidatePath(`/admin/speakers/${id}`);
  revalidatePath('/', 'layout');
  redirect('/admin/speakers');
}

export async function deleteSpeaker(id: string): Promise<void> {
  await assertAdmin();
  const supabase = createClient();
  await supabase.from('speakers').delete().eq('id', id);
  revalidatePath('/admin/speakers');
  revalidatePath('/', 'layout');
}

export async function toggleSpeakerActive(
  id: string,
  active: boolean
): Promise<void> {
  await assertAdmin();
  const supabase = createClient();
  await supabase.from('speakers').update({ active }).eq('id', id);
  revalidatePath('/admin/speakers');
  revalidatePath('/', 'layout');
}
