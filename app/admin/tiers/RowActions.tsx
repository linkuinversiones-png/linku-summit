'use client';

import { useTransition } from 'react';
import { Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';
import { deleteTier, toggleTierActive } from './actions';

export default function RowActions({
  id,
  active
}: {
  id: string;
  active: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await toggleTierActive(id, !active);
          })
        }
        title={active ? 'Ocultar del público' : 'Activar'}
        className="inline-flex items-center gap-1 rounded-lg border border-linku-border-2 px-2.5 py-1.5 text-xs font-medium text-linku-text-muted transition hover:border-white/25 hover:text-linku-text disabled:opacity-50"
      >
        {pending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : active ? (
          <EyeOff size={12} />
        ) : (
          <Eye size={12} />
        )}
        {active ? 'Ocultar' : 'Activar'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm('¿Eliminar este tier? Esta acción no se puede deshacer.'))
            return;
          start(async () => {
            await deleteTier(id);
          });
        }}
        title="Eliminar"
        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-50"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
