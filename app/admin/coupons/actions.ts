'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { COURTESY_CATEGORIES, type CouponKind } from '@/lib/coupons';

type FieldErrors = Record<string, string>;

export type CouponActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

const CATEGORY_VALUES = new Set<string>(COURTESY_CATEGORIES.map((c) => c.value));

function readForm(form: FormData) {
  const get = (k: string) => (form.get(k)?.toString() ?? '').trim();
  const getNumber = (k: string): number | null => {
    const v = get(k);
    if (v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const getBool = (k: string) => form.get(k) === 'on' || form.get(k) === 'true';
  const getDate = (k: string): string | null => {
    const v = get(k);
    return v ? new Date(v).toISOString() : null;
  };
  const getList = (k: string) =>
    get(k)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const kind: CouponKind = get('kind') === 'cortesia' ? 'cortesia' : 'descuento';

  return {
    kind,
    code: get('code').toUpperCase(),
    description: get('description') || null,
    // Una cortesía es siempre 100 %; el formulario ni pregunta el valor.
    discount_type: kind === 'cortesia' ? 'percent' : (get('discount_type') as 'percent' | 'fixed') || 'percent',
    discount_value: kind === 'cortesia' ? 100 : getNumber('discount_value'),
    max_uses: getNumber('max_uses'),
    expires_at: getDate('expires_at'),
    active: getBool('active'),
    applies_to_tiers: getList('applies_to_tiers'),
    courtesy_category: get('courtesy_category') || null,
    granted_to_name: get('granted_to_name') || null,
    granted_to_email: get('granted_to_email').toLowerCase() || null,
    granted_to_org: get('granted_to_org') || null,
    notes: get('notes') || null
  };
}

function validate(data: ReturnType<typeof readForm>): FieldErrors {
  const errs: FieldErrors = {};
  if (!data.code) errs.code = 'Código requerido';
  else if (!/^[A-Z0-9_-]+$/.test(data.code))
    errs.code = 'Solo letras mayúsculas, números, guion y guion bajo';

  if (data.kind === 'descuento') {
    if (data.discount_value === null) errs.discount_value = 'Valor requerido';
    else if (data.discount_value <= 0) errs.discount_value = 'Debe ser > 0';
    else if (data.discount_type === 'percent' && data.discount_value > 100)
      errs.discount_value = 'Porcentaje no puede ser > 100';
  } else {
    if (!data.courtesy_category) errs.courtesy_category = 'Elige para qué es la cortesía';
    else if (!CATEGORY_VALUES.has(data.courtesy_category))
      errs.courtesy_category = 'Categoría inválida';
    if (!data.granted_to_org && !data.granted_to_name)
      errs.granted_to_org = 'Indica a quién se otorga: una organización o una persona';
    if (data.max_uses === null)
      errs.max_uses = 'Las cortesías necesitan un tope de usos para poder hacerles seguimiento';
    if (data.granted_to_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.granted_to_email))
      errs.granted_to_email = 'Correo inválido';
  }

  if (data.max_uses !== null && data.max_uses <= 0)
    errs.max_uses = 'Si se especifica, debe ser > 0';
  return errs;
}

async function assertAdmin(): Promise<{ email: string }> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/coupons');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/?error=unauthorized');
  return { email: user.email ?? '' };
}

function payloadFromForm(d: ReturnType<typeof readForm>) {
  const isCourtesy = d.kind === 'cortesia';
  return {
    kind: d.kind,
    code: d.code,
    description: d.description,
    discount_type: d.discount_type,
    discount_value: d.discount_value as number,
    max_uses: d.max_uses,
    expires_at: d.expires_at,
    active: d.active,
    applies_to_tiers: d.applies_to_tiers.length > 0 ? d.applies_to_tiers : null,
    // Los datos de cortesía se limpian si el cupón deja de serlo.
    courtesy_category: isCourtesy ? d.courtesy_category : null,
    granted_to_name: isCourtesy ? d.granted_to_name : null,
    granted_to_email: isCourtesy ? d.granted_to_email : null,
    granted_to_org: isCourtesy ? d.granted_to_org : null,
    notes: d.notes
  };
}

export async function createCoupon(
  _prev: CouponActionResult | null,
  form: FormData
): Promise<CouponActionResult> {
  const admin = await assertAdmin();
  const data = readForm(form);
  const fieldErrors = validate(data);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: 'Revisa los campos', fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('coupons').insert({
    ...payloadFromForm(data),
    granted_by_email: data.kind === 'cortesia' ? admin.email : null
  });

  if (error) {
    return {
      ok: false,
      message:
        error.code === '23505'
          ? 'Ya existe un cupón con ese código'
          : error.message
    };
  }

  revalidatePath('/admin/coupons');
  revalidatePath('/admin/cortesias');
  redirect(data.kind === 'cortesia' ? '/admin/cortesias' : '/admin/coupons');
}

export async function updateCoupon(
  id: string,
  _prev: CouponActionResult | null,
  form: FormData
): Promise<CouponActionResult> {
  await assertAdmin();
  const data = readForm(form);
  const fieldErrors = validate(data);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: 'Revisa los campos', fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('coupons')
    .update(payloadFromForm(data))
    .eq('id', id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === '23505'
          ? 'Ya existe un cupón con ese código'
          : error.message
    };
  }

  revalidatePath('/admin/coupons');
  revalidatePath('/admin/cortesias');
  revalidatePath(`/admin/coupons/${id}`);
  redirect(data.kind === 'cortesia' ? '/admin/cortesias' : '/admin/coupons');
}

export async function deleteCoupon(id: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from('coupons').delete().eq('id', id);
  revalidatePath('/admin/coupons');
  revalidatePath('/admin/cortesias');
}

export async function toggleCouponActive(
  id: string,
  active: boolean
): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from('coupons').update({ active }).eq('id', id);
  revalidatePath('/admin/coupons');
  revalidatePath('/admin/cortesias');
}
