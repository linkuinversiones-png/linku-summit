import Link from 'next/link';
import { Plus, Users2 } from 'lucide-react';
import { getAllSpeakersAdmin } from '@/lib/speakers';
import SpeakersTable from './SpeakersTable';

export const metadata = { title: 'Speakers · Admin · LINKU SUMMIT' };
export const dynamic = 'force-dynamic';

export default async function AdminSpeakersPage() {
  const speakers = await getAllSpeakersAdmin();

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tightish text-linku-text">
            Speakers
          </h1>
          <p className="mt-1 text-sm text-linku-text-muted">
            Aparecen en el landing en el mismo orden que ves aquí. Arrastra
            cualquier fila para reordenar — se guarda automático.
          </p>
        </div>
        <Link
          href="/admin/speakers/new"
          className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-4 py-2.5 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft"
        >
          <Plus size={16} /> Nuevo speaker
        </Link>
      </header>

      {speakers.length === 0 ? (
        <div className="rounded-2xl border border-linku-border bg-linku-bg-2 px-6 py-16 text-center">
          <Users2 size={32} className="mx-auto text-linku-text-dim" />
          <p className="mt-3 text-sm text-linku-text-muted">
            Aún no hay speakers. Crea el primero.
          </p>
        </div>
      ) : (
        <SpeakersTable initialSpeakers={speakers} />
      )}
    </div>
  );
}
