import { getMeetingsSettings } from '@/lib/settings';
import { createClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';

export const metadata = { title: 'Ajustes · Admin · LINKU CAPITAL SUMMIT 2026' };
export const dynamic = 'force-dynamic';

/**
 * Ajustes editables sin desplegar. Por ahora: la agenda de citas 1:1 que
 * ven los asistentes en /me (enlace al proveedor externo y sus textos).
 */
export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [meetings, { data: tiers }] = await Promise.all([
    getMeetingsSettings(),
    supabase.from('ticket_tiers').select('slug, name_es').order('price_cop', { ascending: true })
  ]);
  return (
    <SettingsForm
      meetings={meetings}
      tiers={(tiers ?? []).map((t) => ({ slug: t.slug, name: t.name_es }))}
    />
  );
}
