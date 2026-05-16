'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit3, GripVertical, Linkedin, Loader2 } from 'lucide-react';
import type { SpeakerRow } from '@/lib/speakers';
import { getImageUrl } from '@/lib/storage';
import RowActions from './RowActions';
import { reorderSpeakers } from './actions';

type Props = { initialSpeakers: SpeakerRow[] };

export default function SpeakersTable({ initialSpeakers }: Props) {
  const [speakers, setSpeakers] = useState(initialSpeakers);
  const [pending, start] = useTransition();
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = speakers.findIndex((s) => s.id === active.id);
    const newIndex = speakers.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(speakers, oldIndex, newIndex);
    setSpeakers(next);
    setSaving(true);
    start(async () => {
      await reorderSpeakers(next.map((s) => s.id));
      setSaving(false);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-linku-border bg-linku-bg-2">
      <div className="flex items-center justify-between border-b border-linku-border bg-linku-bg-3 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
        <span>Arrastra el {`{::}`} para reordenar — el orden afecta el landing</span>
        {saving && (
          <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-linku-coral">
            <Loader2 size={11} className="animate-spin" /> Guardando…
          </span>
        )}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-linku-bg-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
          <tr>
            <th className="w-10 px-2 py-3"></th>
            <th className="px-2 py-3">Foto</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Rol / empresa</th>
            <th className="px-4 py-3">Track</th>
            <th className="px-4 py-3 text-center">LinkedIn</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={speakers.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {speakers.map((s) => (
                <SortableRow key={s.id} speaker={s} disabled={pending} />
              ))}
            </tbody>
          </SortableContext>
        </DndContext>
      </table>
    </div>
  );
}

function SortableRow({
  speaker: s,
  disabled
}: {
  speaker: SpeakerRow;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: s.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? 'rgba(255,90,95,0.08)' : undefined
  };

  const url = getImageUrl(s.avatar_path);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-t border-linku-border transition hover:bg-white/5"
    >
      <td className="px-2 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-linku-text-dim hover:text-linku-coral active:cursor-grabbing disabled:opacity-30"
          disabled={disabled}
          aria-label="Reordenar"
        >
          <GripVertical size={16} />
        </button>
      </td>
      <td className="px-2 py-3">
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
          {!s.active ? 'Inactivo' : s.confirmed ? 'Confirmado' : 'Por confirmar'}
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
}
