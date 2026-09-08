'use client';

import { useState, useTransition } from 'react';
import { CalendarDays, Loader2, Plus } from 'lucide-react';
import { createItem, reorderItems, updateDay } from './actions';
import ItemEditor from './ItemEditor';
import { SortableList } from './Sortable';
import { Area, ErrorBanner, Field, GhostButton, SaveButton, type SpeakerOption } from './ui';
import { orNull, str, type DayNode, type ItemNode } from './tree';

type Props = {
  initialDays: DayNode[];
  speakers: SpeakerOption[];
};

/**
 * Editor de la agenda del summit.
 *
 * El árbol completo vive en estado local y cada guardado llama a su server
 * action; al confirmar, el estado local se actualiza con lo mismo que quedó
 * en la DB. Así el editor no recarga la página entera en cada cambio.
 */
export default function AgendaEditor({ initialDays, speakers }: Props) {
  const [days, setDays] = useState<DayNode[]>(initialDays);
  const [activeDayId, setActiveDayId] = useState<string>(initialDays[0]?.id ?? '');

  const day = days.find((d) => d.id === activeDayId) ?? days[0];

  function patchDay(dayId: string, patch: Partial<DayNode>) {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, ...patch } : d)));
  }

  if (!day) {
    return (
      <div className="mx-auto max-w-5xl">
        <Header />
        <p className="linku-card mt-8 p-6 text-sm text-linku-text-muted">
          No hay días de agenda en la base de datos. Corre la migración{' '}
          <code className="text-linku-coral">0014_agenda.sql</code> para crearlos.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Header />

      <div className="mt-6 flex flex-wrap gap-2">
        {days.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setActiveDayId(d.id)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              d.id === day.id
                ? 'border-linku-coral/50 bg-linku-coral/10 text-linku-coral'
                : 'border-linku-border-2 text-linku-text-muted hover:border-white/25 hover:text-linku-text'
            }`}
          >
            {d.label_es}
            <span className="ml-2 text-[11px] font-normal text-linku-text-dim">
              {d.agenda_items.length} bloques
            </span>
          </button>
        ))}
      </div>

      <DayPanel key={day.id} day={day} speakers={speakers} onPatchDay={patchDay} />
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tightish text-linku-text">
        <CalendarDays size={22} className="text-linku-coral" /> Agenda
      </h1>
      <p className="text-sm text-linku-text-muted">
        Lo que edites aquí sale en el landing. Arrastra la agarradera para reordenar y abre
        cualquier fila para editarla. Si un campo en inglés queda vacío, el landing en inglés
        muestra el texto en español.
      </p>
    </div>
  );
}

/** Cabecera editable del día + su lista de bloques. */
function DayPanel({
  day,
  speakers,
  onPatchDay
}: {
  day: DayNode;
  speakers: SpeakerOption[];
  onPatchDay: (dayId: string, patch: Partial<DayNode>) => void;
}) {
  const [editingDay, setEditingDay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function saveDay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      label_es: str(fd.get('label_es')),
      label_en: str(fd.get('label_en')),
      date: str(fd.get('date')),
      tagline_es: str(fd.get('tagline_es')),
      tagline_en: str(fd.get('tagline_en'))
    };
    start(async () => {
      const res = await updateDay(day.id, input);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setError(null);
      onPatchDay(day.id, {
        label_es: input.label_es,
        label_en: orNull(input.label_en),
        date: orNull(input.date),
        tagline_es: orNull(input.tagline_es),
        tagline_en: orNull(input.tagline_en)
      });
      setEditingDay(false);
    });
  }

  function addItem() {
    const last = day.agenda_items.at(-1);
    start(async () => {
      const res = await createItem(day.id, {
        start_time: last?.end_time ?? '09:00',
        type: 'charla',
        title_es: 'Nuevo bloque',
        desc_es: ''
      });
      if (!res.ok || !res.id) {
        setError(res.ok ? 'No se recibió el id del bloque' : res.message);
        return;
      }
      setError(null);
      const item: ItemNode = {
        id: res.id,
        day_id: day.id,
        sort_order: (last?.sort_order ?? 0) + 10,
        start_time: last?.end_time ?? '09:00',
        end_time: null,
        type: 'charla',
        title_es: 'Nuevo bloque',
        title_en: null,
        desc_es: '',
        desc_en: null,
        speaker_label_es: null,
        speaker_label_en: null,
        active: true,
        agenda_item_speakers: [],
        agenda_salones: []
      };
      onPatchDay(day.id, { agenda_items: [...day.agenda_items, item] });
    });
  }

  function reorder(next: ItemNode[]) {
    onPatchDay(day.id, { agenda_items: next });
    start(async () => {
      const res = await reorderItems(
        day.id,
        next.map((i) => i.id)
      );
      if (!res.ok) setError(res.message);
    });
  }

  function patchItem(itemId: string, patch: Partial<ItemNode>) {
    onPatchDay(day.id, {
      agenda_items: day.agenda_items.map((i) => (i.id === itemId ? { ...i, ...patch } : i))
    });
  }

  function removeItem(itemId: string) {
    onPatchDay(day.id, {
      agenda_items: day.agenda_items.filter((i) => i.id !== itemId)
    });
  }

  return (
    <section className="mt-6">
      <div className="linku-card p-5">
        {editingDay ? (
          <form onSubmit={saveDay} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Nombre del día (ES) *" name="label_es" defaultValue={day.label_es} required />
              <Field label="Nombre del día (EN)" name="label_en" defaultValue={day.label_en} />
              <Field
                label="Fecha (YYYY-MM-DD)"
                name="date"
                defaultValue={day.date}
                placeholder="2026-10-05"
              />
              <Area
                label="Bajada (ES)"
                name="tagline_es"
                defaultValue={day.tagline_es}
                rows={2}
                className="sm:col-span-3"
              />
              <Area
                label="Bajada (EN)"
                name="tagline_en"
                defaultValue={day.tagline_en}
                rows={2}
                className="sm:col-span-3"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <GhostButton onClick={() => setEditingDay(false)} disabled={pending}>
                Cancelar
              </GhostButton>
              <SaveButton pending={pending} />
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-linku-text">{day.label_es}</h2>
              <p className="mt-0.5 text-xs text-linku-text-dim">
                {day.date ?? 'sin fecha'} · {day.agenda_items.length} bloques
              </p>
              {day.tagline_es && (
                <p className="mt-1 max-w-xl text-sm italic text-linku-text-muted">
                  {day.tagline_es}
                </p>
              )}
            </div>
            <GhostButton onClick={() => setEditingDay(true)}>Editar día</GhostButton>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
          Bloques del día
        </span>
        <div className="flex items-center gap-2">
          {pending && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-linku-coral">
              <Loader2 size={11} className="animate-spin" /> Guardando…
            </span>
          )}
          <GhostButton onClick={addItem} disabled={pending}>
            <Plus size={12} /> Añadir bloque
          </GhostButton>
        </div>
      </div>

      <div className="mt-3">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-3">
        {day.agenda_items.length === 0 ? (
          <p className="linku-card p-6 text-sm text-linku-text-muted">
            Este día no tiene bloques todavía.
          </p>
        ) : (
          <SortableList
            items={day.agenda_items}
            onReorder={reorder}
            renderItem={(item, handle) => (
              <ItemEditor
                item={item}
                speakers={speakers}
                handle={handle}
                onPatch={patchItem}
                onDelete={removeItem}
              />
            )}
          />
        )}
      </div>
    </section>
  );
}

