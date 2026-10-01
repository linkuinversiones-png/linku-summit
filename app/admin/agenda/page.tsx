import { getAgendaAdmin, getAgendaCompaniesAdmin } from '@/lib/agenda';
import { getAllSpeakersAdmin } from '@/lib/speakers';
import { getAllSponsorsAdmin, SPONSOR_CATEGORIES } from '@/lib/sponsors';
import AgendaEditor from './AgendaEditor';
import type { DayNode } from './tree';

export const dynamic = 'force-dynamic';

/**
 * Admin de agenda: días, bloques, salones paralelos y subagendas.
 * La lectura es server-side; toda la edición vive en <AgendaEditor />.
 */
export default async function AdminAgendaPage() {
  const [days, speakers, sponsors, links] = await Promise.all([
    getAgendaAdmin(),
    getAllSpeakersAdmin(),
    getAllSponsorsAdmin(),
    getAgendaCompaniesAdmin()
  ]);

  const categoryLabel = new Map(SPONSOR_CATEGORIES.map((c) => [c.slug, c.titleEs]));
  // Empresas vinculables: todos los sponsors activos, cualquier categoría.
  const options = sponsors
    .filter((s) => s.active)
    .map((s) => ({
      id: s.id,
      name: s.name,
      category: categoryLabel.get(s.category) ?? s.category
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  // Cada nodo lleva sus empresas vinculadas (ids en orden) para el editor.
  const tree = days as DayNode[];
  for (const d of tree) {
    for (const i of d.agenda_items) {
      i.company_ids = links.items[i.id] ?? [];
      for (const s of i.agenda_salones) {
        for (const t of s.agenda_salon_items) {
          t.company_ids = links.talks[t.id] ?? [];
        }
      }
    }
  }

  return (
    <AgendaEditor
      initialDays={tree}
      speakers={speakers.map((s) => ({ id: s.id, name: s.name, company: s.company }))}
      companies={{ available: links.available, options }}
    />
  );
}
