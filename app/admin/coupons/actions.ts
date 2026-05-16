'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type FieldErrors = Record<string, string>;

export type CouponActionResult =
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
  const getDate = (k: string): string | null => {
    const v = get(k);
    return v ? new Date(v).toISOString() : null;
  };
  const getList = (k: string) =>
    get(k)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    code: get('code').toUpperCase(),
    description: get('description') || null,
    discount_type: (get('discount_type') as 'percent' | 'fixed') || 'percent',
    discount_value: getNumber('discount_value'),
    max_uses: getNumber('max_uses'),
    expires_at: getDate('expires_at'),
    active: getBool('active'),
    applies_to_tiers: getList('applies_to_tiers')
  };
}

function validate(data: ReturnType<typeof readForm>): FieldErrors {
  const errs: FieldErrors = {};
  if (!data.code) errs.code = 'Código requerido';
  else if (!/^[A-Z0-9_-]+$/.test(data.code))
    errs.code = 'Solo letras mayúsculas, números, guion y guion bajo';
  if (data.discount_value === null) errs.discount_value = 'Valor requerido';
  else if (data.discount_value <= 0) errs.discount_value = 'Debe ser > 0';
  else if (data.discount_type === 'percent' && data.discount_value > 100)
    errs.discount_value = 'Porcentaje no puede ser > 100';
  if (data.max_uses !== null && data.max_uses <= 0)
    errs.max_uses = 'Si se especifica, debe ser > 0';
  return errs;
}

async function assertAdmin() {
  const supabase = createClient();
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
}

function payloadFromForm(d: ReturnType<typeof readForm>) {
  return {
    code: d.code,
    description: d.description,
    discount_type: d.discount_type,
    discount_value: d.discount_value as number,
    max_uses: d.max_uses,
    expires_at: d.expires_at,
    active: d.active,
    applies_to_tiers:
      d.applies_to_tiers.length > 0 ? d.applies_to_tiers : null
  };
}

export async function createCoupon(
  _prev: CouponActionResult | null,
  form: FormData
): Promise<CouponActionResult> {
  await assertAdmin();
  const data = readForm(form);
  const fieldErrors = validate(data);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: 'Revisa los campos', fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase.from('coupons').insert(payloadFromForm(data));

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
  redirect('/admin/coupons');
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

  const supabase = createClient();
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
  revalidatePath(`/admin/coupons/${id}`);
  redirect('/admin/coupons');
}

export async function deleteCoupon(id: string): Promise<void> {
  await assertAdmin();
  const supabase = createClient();
  await supabase.from('coupons').delete().eq('id', id);
  revalidatePath('/admin/coupons');
}

export async function toggleCouponActive(
  id: string,
  active: boolean
): Promise<void> {
  await assertAdmin();
  const supabase = createClient();
  await supabase.from('coupons').update({ active }).eq('id', id);
  revalidatePath('/admin/coupons');
}
