import Link from 'next/link';
import { Plus, Users2, Edit3, Linkedin } from 'lucide-react';
import { getAllSpeakersAdmin } from '@/lib/speakers';
import { getImageUrl } from '@/lib/storage';
import RowActions from './RowActions';

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
            Ponentes del summit. Aparecen en la landing por orden ascendente
            de “Orden”.
          </p>
        </div>
        <Link
          href="/admin/speakers/new"
          className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-4 py-2.5 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft"
        >
          <Plus size={16} /> Nuevo speaker
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl border border-linku-border bg-linku-bg-2">
        {speakers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users2 size={32} className="mx-auto text-linku-text-dim" />
            <p className="mt-3 text-sm text-linku-text-muted">
              Aún no hay speakers. Crea el primero.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-linku-bg-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
              <tr>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Rol / empresa</th>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3 text-center">LinkedIn</th>
                <th className="px-4 py-3 text-center">Orden</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {speakers.map((s) => {
                const url = getImageUrl(s.avatar_path);
                return (
                  <tr
                    key={s.id}
                    className="border-t border-linku-border transition hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      {url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={url}
                          alt={s.name}
                          className="h-12 w-12 rounded-lg object-cover ring-1 ring-linku-border"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linku-bg-3 text-[10px] text-linku-text-dim ring-1 ring-linku-border">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-linku-text">{s.name}</p>
                      <p className="text-[11px] text-linku-text-dim">{s.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-linku-text-muted">
                      <p>{s.role || '—'}</p>
                      {s.company && (
                        <p className="text-[11px] text-linku-text-dim">{s.company}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-linku-text-muted">{s.track || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {s.linkedin_url ? (
                        <a
                          href={s.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-linku-coral hover:text-linku-coral-soft"
                        >
                          <Linkedin size={14} />
                        </a>
                      ) : (
                        <span className="text-linku-text-dim">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-linku-text-muted tabular-nums">
                      {s.sort_order}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          s.active
                            ? s.confirmed
                              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                              : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                            : 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300'
                        }`}
                      >
                        {!s.active
                          ? 'Inactivo'
                          : s.confirmed
                          ? 'Confirmado'
                          : 'Por confirmar'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/speakers/${s.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-linku-border-2 px-2.5 py-1.5 text-xs font-medium text-linku-text-muted transition hover:border-white/25 hover:text-linku-text"
                        >
                          <Edit3 size={12} /> Editar
                        </Link>
                        <RowActions id={s.id} active={s.active} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
