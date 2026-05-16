'use client';

import { useTransition } from 'react';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { deleteSpeaker, toggleSpeakerActive } from './actions';

export default function RowActions({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <>
      <button
        type="button"
        onClick={() =>
          start(async () => {
            await toggleSpeakerActive(id, !active);
          })
        }
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border border-linku-border-2 px-2.5 py-1.5 text-xs font-medium text-linku-text-muted transition hover:border-white/25 hover:text-linku-text disabled:opacity-50"
        title={active ? 'Desactivar' : 'Activar'}
      >
        {active ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      <button
        type="button"
        onClick={() => {
          if (!confirm('¿Borrar este speaker? La foto en Storage se queda (puedes borrarla desde el dashboard).')) return;
          start(async () => {
            await deleteSpeaker(id);
          });
        }}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:border-red-500/50 hover:bg-red-500/20 disabled:opacity-50"
        title="Borrar"
      >
        <Trash2 size={12} />
      </button>
    </>
  );
}
