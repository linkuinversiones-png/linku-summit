'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  createSalon,
  deleteItem,
  reorderSalones,
  setItemSpeakers,
  updateItem
} from './actions';
import { ITEM_TYPES } from './constants';
import SalonEditor from './SalonEditor';
import { SortableList } from './Sortable';
import {
  Area,
  Check,
  ErrorBanner,
  Field,
  GhostButton,
  SaveButton,
  Select,
  SpeakerPicker,
  normalizeTime,
  type SpeakerOption
} from './ui';
import {
  linkedNames,
  linksFor,
  nextSalonCode,
  orNull,
  str,
  type ItemNode,
  type SalonNode
} from './tree';

type Props = {
  item: ItemNode;
  speakers: SpeakerOption[];
  handle: React.ReactNode;
  onPatch: (itemId: string, patch: Partial<ItemNode>) => void;
  onDelete: (itemId: string) => void;
};

/**
 * Un bloque de la agenda de un día. Plegado muestra hora, tipo, título y
 * crédito de speakers; abierto muestra el formulario completo más la lista
 * de salones paralelos.
 */
export default function ItemEditor({ item, speakers, handle, onPatch, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const names = linkedNames(item.agenda_item_speakers);
  const credit = names.length > 0 ? names.join(' · ') : item.speaker_label_es;

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const speakerIds = fd.getAll('speaker_ids').map(String);
    const input = {
      start_time: normalizeTime(fd.get('start_time')),
      end_time: normalizeTime(fd.get('end_time')),
      type: str(fd.get('type')),
      title_es: str(fd.get('title_es')),
      title_en: str(fd.get('title_en')),
      desc_es: str(fd.get('desc_es')),
      desc_en: str(fd.get('desc_en')),
      speaker_label_es: str(fd.get('speaker_label_es')),
      speaker_label_en: str(fd.get('speaker_label_en')),
      active: fd.get('active') === 'on'
    };
    start(async () => {
      const res = await updateItem(item.id, input);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      const linkRes = await setItemSpeakers(item.id, speakerIds);
      if (!linkRes.ok) {
        setError(linkRes.message);
        return;
      }
      setError(null);
      onPatch(item.id, {
        start_time: input.start_time,
        end_time: input.end_time || null,
        type: input.type,
        title_es: input.title_es,
        title_en: orNull(input.title_en),
        desc_es: input.desc_es,
        desc_en: orNull(input.desc_en),
        speaker_label_es: orNull(input.speaker_label_es),
        speaker_label_en: orNull(input.speaker_label_en),
        active: input.active,
        agenda_item_speakers: linksFor(speakerIds, speakers)
      });
      setOpen(false);
    });
  }

  /** Toggle rápido de visibilidad sin abrir el formulario. */
  function toggleActive() {
    const next = !item.active;
    start(async () => {
      const res = await updateItem(item.id, {
        start_time: item.start_time,
        end_time: item.end_time ?? undefined,
        type: item.type,
        title_es: item.title_es,
        title_en: item.title_en ?? undefined,
        desc_es: item.desc_es,
        desc_en: item.desc_en ?? undefined,
        speaker_label_es: item.speaker_label_es ?? undefined,
        speaker_label_en: item.speaker_label_en ?? undefined,
        active: next
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onPatch(item.id, { active: next });
    });
  }

  function remove() {
    if (!confirm(`Borrar el bloque "${item.title_es}" con sus salones y charlas?`)) return;
    start(async () => {
      const res = await deleteItem(item.id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onDelete(item.id);
    });
  }

  function addSalon() {
    const code = nextSalonCode(item.agenda_salones);
    start(async () => {
      const res = await createSalon(item.id, { code, name_es: 'Nuevo salón' });
      if (!res.ok || !res.id) {
        setError(res.ok ? 'No se recibió el id del salón' : res.message);
        return;
      }
      setError(null);
      const salon: SalonNode = {
        id: res.id,
        item_id: item.id,
        sort_order: (item.agenda_salones.at(-1)?.sort_order ?? 0) + 10,
        code,
        name_es: 'Nuevo salón',
        name_en: null,
        tag_es: null,
        tag_en: null,
        active: true,
        agenda_salon_items: []
      };
      onPatch(item.id, { agenda_salones: [...item.agenda_salones, salon] });
      setOpen(true);
    });
  }

  function reorderSalonList(next: SalonNode[]) {
    onPatch(item.id, { agenda_salones: next });
    start(async () => {
      const res = await reorderSalones(
        item.id,
        next.map((s) => s.id)
      );
      if (!res.ok) setError(res.message);
    });
  }

  function patchSalon(salonId: string, patch: Partial<SalonNode>) {
    onPatch(item.id, {
      agenda_salones: item.agenda_salones.map((s) =>
        s.id === salonId ? { ...s, ...patch } : s
      )
    });
  }

  function removeSalonFromState(salonId: string) {
    onPatch(item.id, {
      agenda_salones: item.agenda_salones.filter((s) => s.id !== salonId)
    });
  }

  return (
    <div
      className={`mb-2.5 rounded-xl border border-linku-border bg-linku-bg-2 ${
        item.active ? '' : 'opacity-60'
      }`}
    >
      <div className="flex items-center gap-2.5 p-3">
        {handle}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 flex-col gap-1 text-left"
        >
          <span className="flex flex-wrap items-center gap-2">
            {open ? (
              <ChevronDown size={14} className="text-linku-text-dim" />
            ) : (
              <ChevronRight size={14} className="text-linku-text-dim" />
            )}
            <span className="text-sm font-bold tabular-nums text-linku-coral">
              {item.start_time}
              {item.end_time ? ` – ${item.end_time}` : ''}
            </span>
            <span className="rounded-full border border-linku-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-linku-text-dim">
              {item.type}
            </span>
            <span className="text-sm font-semibold text-linku-text">{item.title_es}</span>
            {!item.active && (
              <span className="text-[10px] font-bold uppercase text-amber-400">Inactivo</span>
            )}
          </span>
          {(credit || item.agenda_salones.length > 0) && (
            <span className="flex flex-wrap items-center gap-2 pl-6 text-[11px]">
              {credit && <span className="italic text-linku-coral/80">{credit}</span>}
              {item.agenda_salones.length > 0 && (
                <span className="text-linku-text-dim">
                  {item.agenda_salones.length} salones paralelos
                </span>
              )}
            </span>
          )}
        </button>
        {pending && <Loader2 size={14} className="animate-spin text-linku-coral" />}
        <GhostButton
          onClick={toggleActive}
          disabled={pending}
          title={item.active ? 'Ocultar del landing' : 'Mostrar en el landing'}
        >
          {item.active ? <EyeOff size={12} /> : <Eye size={12} />}
        </GhostButton>
      </div>

      {open && (
        <div className="space-y-5 border-t border-linku-border p-4">
          <ErrorBanner message={error} />

          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field
                label="Inicio * (HH:MM)"
                name="start_time"
                defaultValue={item.start_time}
                required
                placeholder="08:30"
              />
              <Field label="Fin (HH:MM)" name="end_time" defaultValue={item.end_time} placeholder="09:15" />
              <Select
                label="Tipo *"
                name="type"
                defaultValue={item.type}
                options={ITEM_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                className="sm:col-span-2"
              />
              <Field
                label="Título (ES) *"
                name="title_es"
                defaultValue={item.title_es}
                required
                className="sm:col-span-2"
              />
              <Field
                label="Título (EN)"
                name="title_en"
                defaultValue={item.title_en}
                className="sm:col-span-2"
              />
              <Area
                label="Descripción (ES)"
                name="desc_es"
                defaultValue={item.desc_es}
                className="sm:col-span-2"
              />
              <Area
                label="Descripción (EN)"
                name="desc_en"
                defaultValue={item.desc_en}
                className="sm:col-span-2"
              />
              <Field
                label="Crédito de speakers (ES)"
                name="speaker_label_es"
                defaultValue={item.speaker_label_es}
                placeholder="4 panelistas + moderador"
                className="sm:col-span-2"
              />
              <Field
                label="Crédito de speakers (EN)"
                name="speaker_label_en"
                defaultValue={item.speaker_label_en}
                className="sm:col-span-2"
              />
            </div>

            <SpeakerPicker
              speakers={speakers}
              selectedIds={item.agenda_item_speakers.map((l) => l.speaker_id)}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Check label="Visible en el landing" name="active" defaultChecked={item.active} />
              <div className="flex items-center gap-2">
                <GhostButton onClick={remove} disabled={pending} danger>
                  <Trash2 size={12} /> Borrar bloque
                </GhostButton>
                <SaveButton pending={pending} />
              </div>
            </div>
          </form>

          <div className="space-y-2 border-t border-linku-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
                Salones paralelos
              </span>
              <GhostButton onClick={addSalon} disabled={pending}>
                <Plus size={12} /> Añadir salón
              </GhostButton>
            </div>
            {item.agenda_salones.length === 0 ? (
              <p className="text-[11px] text-linku-text-dim">
                Sin salones. Añade uno solo si este bloque se divide en tracks paralelos.
              </p>
            ) : (
              <div className="space-y-2">
                <SortableList
                  items={item.agenda_salones}
                  onReorder={reorderSalonList}
                  renderItem={(salon, salonHandle) => (
                    <div className="pb-2">
                      <SalonEditor
                        salon={salon}
                        speakers={speakers}
                        handle={salonHandle}
                        onPatch={patchSalon}
                        onDelete={removeSalonFromState}
                      />
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
