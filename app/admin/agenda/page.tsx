import { getAgendaAdmin } from '@/lib/agenda';
import { getAllSpeakersAdmin } from '@/lib/speakers';
import AgendaEditor from './AgendaEditor';
import type { DayNode } from './tree';

export const dynamic = 'force-dynamic';

/**
 * Admin de agenda: días, bloques, salones paralelos y subagendas.
 * La lectura es server-side; toda la edición vive en <AgendaEditor />.
 */
export default async function AdminAgendaPage() {
  const [days, speakers] = await Promise.all([getAgendaAdmin(), getAllSpeakersAdmin()]);

  return (
    <AgendaEditor
      initialDays={days as DayNode[]}
      speakers={speakers.map((s) => ({ id: s.id, name: s.name, company: s.company }))}
    />
  );
}
