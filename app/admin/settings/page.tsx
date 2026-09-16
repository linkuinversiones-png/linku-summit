import { getMeetingsSettings } from '@/lib/settings';
import SettingsForm from './SettingsForm';

export const metadata = { title: 'Ajustes · Admin · LINKU CAPITAL SUMMIT 2026' };
export const dynamic = 'force-dynamic';

/**
 * Ajustes editables sin desplegar. Por ahora: la agenda de citas 1:1 que
 * ven los asistentes en /me (enlace al proveedor externo y sus textos).
 */
export default async function AdminSettingsPage() {
  const meetings = await getMeetingsSettings();
  return <SettingsForm meetings={meetings} />;
}
