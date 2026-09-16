'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MEETINGS_DEFAULTS, type MeetingsSettings } from '@/lib/settings';

export type SettingsActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function assertAdmin(): Promise<{ email: string }> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/settings');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/?error=unauthorized');
  return { email: user.email ?? '' };
}

/** Guarda los ajustes de la agenda de citas 1:1 que se muestran en /me. */
export async function saveMeetingsSettings(
  _prev: SettingsActionResult | null,
  form: FormData
): Promise<SettingsActionResult> {
  const admin = await assertAdmin();
  const get = (k: string) => String(form.get(k) ?? '').trim();

  const value: MeetingsSettings = {
    enabled: form.get('enabled') === 'on',
    url: get('url'),
    title_es: get('title_es') || MEETINGS_DEFAULTS.title_es,
    title_en: get('title_en'),
    desc_es: get('desc_es'),
    desc_en: get('desc_en'),
    cta_es: get('cta_es') || MEETINGS_DEFAULTS.cta_es,
    cta_en: get('cta_en'),
    note_es: get('note_es'),
    note_en: get('note_en')
  };

  const fieldErrors: Record<string, string> = {};
  if (value.url) {
    let ok = false;
    try {
      const u = new URL(value.url);
      ok = u.protocol === 'https:' || u.protocol === 'http:';
    } catch {
      ok = false;
    }
    if (!ok) fieldErrors.url = 'Pega la dirección completa, empezando por https://';
  }
  if (value.enabled && !value.url) {
    fieldErrors.url = 'Para activar la agenda hace falta el enlace del proveedor';
  }
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: 'Revisa los campos', fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: 'meetings', value, updated_by_email: admin.email }, { onConflict: 'key' });
  if (error) return { ok: false, message: `No se pudo guardar: ${error.message}` };

  revalidatePath('/admin/settings');
  return {
    ok: true,
    message: value.enabled
      ? 'Guardado. La agenda de citas ya está visible en la cuenta de cada asistente.'
      : 'Guardado. La agenda queda apagada: en /me se muestra el aviso de "próximamente".'
  };
}
