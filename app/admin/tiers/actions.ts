'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type FieldErrors = Record<string, string>;

export type TierActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

function readForm(form: FormData) {
  const get = (k: string) => (form.get(k)?.toString() ?? '').trim();
  const getNumber = (k: string): number | null => {
    const v = get(k);
    if (v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const getBool = (k: string) => form.get(k) === 'on' || form.get(k) === 'true';
  const getList = (k: string) =>
    get(k)
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  const getDate = (k: string): string | null => {
    const v = get(k);
    return v ? new Date(v).toISOString() : null;
  };

  return {
    slug: get('slug'),
    name_es: get('name_es'),
    name_en: get('name_en'),
    label_es: get('label_es') || null,
    label_en: get('label_en') || null,
    price_cop: getNumber('price_cop'),
    price_note_es: get('price_note_es') || null,
    price_note_en: get('price_note_en') || null,
    benefits_es: getList('benefits_es'),
    benefits_en: getList('benefits_en'),
    badge_es: get('badge_es') || null,
    badge_en: get('badge_en') || null,
    cta_label_es: get('cta_label_es') || 'Comprar entrada',
    cta_label_en: get('cta_label_en') || 'Buy ticket',
    cta_href: get('cta_href') || '/checkout',
    max_quantity: getNumber('max_quantity'),
    highlight: getBool('highlight'),
    active: getBool('active'),
    sort_order: getNumber('sort_order') ?? 0,
    visible_from: getDate('visible_from'),
    visible_until: getDate('visible_until')
  };
}

function validate(data: ReturnType<typeof readForm>): FieldErrors {
  const errs: FieldErrors = {};
  if (!data.slug) errs.slug = 'Slug requerido';
  else if (!/^[a-z0-9-]+$/.test(data.slug))
    errs.slug = 'Solo minúsculas, números y guiones';
  if (!data.name_es) errs.name_es = 'Nombre ES requerido';
  if (!data.name_en) errs.name_en = 'Nombre EN requerido';
  if (data.price_cop === null) errs.price_cop = 'Precio requerido';
  else if (data.price_cop <= 0) errs.price_cop = 'Precio debe ser > 0';
  return errs;
}

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/tiers');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/?error=unauthorized');
}

export async function createTier(
  _prev: TierActionResult | null,
  form: FormData
): Promise<TierActionResult> {
  await assertAdmin();
  const data = readForm(form);
  const fieldErrors = validate(data);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: 'Revisa los campos', fieldErrors };
  }

  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('ticket_tiers')
    .insert(data)
    .select('id')
    .single();

  if (error) {
    return {
      ok: false,
      message:
        error.code === '23505'
          ? 'Ya existe un tier con ese slug'
          : error.message
    };
  }

  revalidatePath('/admin/tiers');
  // 'layout' invalida toda la subtree (incluyendo / y /en) para que la
  // landing refleje cambios de tiers inmediatamente.
  revalidatePath('/', 'layout');
  redirect('/admin/tiers');
}

export async function updateTier(
  id: string,
  _prev: TierActionResult | null,
  form: FormData
): Promise<TierActionResult> {
  await assertAdmin();
  const data = readForm(form);
  const fieldErrors = validate(data);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: 'Revisa los campos', fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('ticket_tiers')
    .update(data)
    .eq('id', id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === '23505'
          ? 'Ya existe un tier con ese slug'
          : error.message
    };
  }

  revalidatePath('/admin/tiers');
  revalidatePath(`/admin/tiers/${id}`);
  revalidatePath('/');
  revalidatePath('/en');
  // Redirect fuerza navegación fresca → la tabla muestra el cambio inmediatamente
  // (sin esto, el router cache del cliente muestra los datos viejos).
  redirect('/admin/tiers');
}

export async function deleteTier(id: string): Promise<void> {
  await assertAdmin();
  const supabase = createClient();
  await supabase.from('ticket_tiers').delete().eq('id', id);
  revalidatePath('/admin/tiers');
  // 'layout' invalida toda la subtree (incluyendo / y /en) para que la
  // landing refleje cambios de tiers inmediatamente.
  revalidatePath('/', 'layout');
}

export async function toggleTierActive(id: string, active: boolean): Promise<void> {
  await assertAdmin();
  const supabase = createClient();
  await supabase.from('ticket_tiers').update({ active }).eq('id', id);
  revalidatePath('/admin/tiers');
  // 'layout' invalida toda la subtree (incluyendo / y /en) para que la
  // landing refleje cambios de tiers inmediatamente.
  revalidatePath('/', 'layout');
}
