'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SPONSOR_CATEGORIES } from '@/lib/sponsors';

type FieldErrors = Record<string, string>;

export type SponsorActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'summit-media';
const VALID_CATEGORIES = SPONSOR_CATEGORIES.map((c) => c.slug);

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
    category: get('category'),
    website_url: get('website_url') || null,
    linkedin_url: get('linkedin_url') || null,
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
  if (!data.category) errs.category = 'Categoría requerida';
  else if (!VALID_CATEGORIES.includes(data.category as never))
    errs.category = 'Categoría inválida';
  if (
    data.linkedin_url &&
    !/^https?:\/\/(www\.)?linkedin\.com\//i.test(data.linkedin_url)
  ) {
    errs.linkedin_url = 'Debe ser una URL de LinkedIn válida';
  }
  if (data.website_url && !/^https?:\/\//i.test(data.website_url)) {
    errs.website_url = 'Debe empezar con http:// o https://';
  }
  return errs;
}

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/sponsors');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/?error=unauthorized');
  return user;
}

async function maybeUploadLogo(
  form: FormData,
  slug: string,
  category: string
): Promise<string | null> {
  const file = form.get('logo') as File | null;
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    return null;
  }
  const ext = (file.name.split('.').pop() ?? 'png').toLowerCase();
  if (!/^(png|jpe?g|webp|svg)$/.test(ext)) {
    throw new Error('Formato no soportado (PNG/JPG/WEBP/SVG).');
  }
  const path = `sponsors/${category}/${slug}.${ext}`;
  const sb = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || `image/${ext}`,
    upsert: true,
    cacheControl: '3600'
  });
  if (error) throw new Error(`No se pudo subir el logo: ${error.message}`);
  return path;
}

export async function createSponsor(
  _prev: SponsorActionResult | null,
  form: FormData
): Promise<SponsorActionResult> {
  await assertAdmin();
  const data = readForm(form);
  const fieldErrors = validate(data);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: 'Revisa los campos', fieldErrors };
  }

  let logoPath: string | null = null;
  try {
    logoPath = await maybeUploadLogo(form, data.slug, data.category);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('sponsors')
    .insert({ ...data, logo_path: logoPath });

  if (error) {
    return {
      ok: false,
      message:
        error.code === '23505' ? 'Ya existe un sponsor con ese slug' : error.message
    };
  }

  revalidatePath('/admin/sponsors');
  revalidatePath('/', 'layout');
  redirect('/admin/sponsors');
}

export async function updateSponsor(
  id: string,
  currentLogoPath: string | null,
  _prev: SponsorActionResult | null,
  form: FormData
): Promise<SponsorActionResult> {
  await assertAdmin();
  const data = readForm(form);
  const fieldErrors = validate(data);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: 'Revisa los campos', fieldErrors };
  }

  let logoPath = currentLogoPath;
  try {
    const uploaded = await maybeUploadLogo(form, data.slug, data.category);
    if (uploaded) logoPath = uploaded;
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('sponsors')
    .update({ ...data, logo_path: logoPath })
    .eq('id', id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === '23505' ? 'Ya existe un sponsor con ese slug' : error.message
    };
  }

  revalidatePath('/admin/sponsors');
  revalidatePath(`/admin/sponsors/${id}`);
  revalidatePath('/', 'layout');
  redirect('/admin/sponsors');
}

export async function deleteSponsor(id: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from('sponsors').delete().eq('id', id);
  revalidatePath('/admin/sponsors');
  revalidatePath('/', 'layout');
}

export async function toggleSponsorActive(
  id: string,
  active: boolean
): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from('sponsors').update({ active }).eq('id', id);
  revalidatePath('/admin/sponsors');
  revalidatePath('/', 'layout');
}
