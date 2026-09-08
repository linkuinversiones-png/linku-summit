'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, ChevronRight, Loader2, Plus, Trash2, X } from 'lucide-react';
import {
  createSalonTalk,
  deleteSalon,
  deleteSalonTalk,
  reorderSalonTalks,
  setSalonTalkSpeakers,
  updateSalon,
  updateSalonTalk
} from './actions';
import { SortableList } from './Sortable';
import {
  Area,
  Check,
  ErrorBanner,
  Field,
  GhostButton,
  SaveButton,
  SpeakerPicker,
  normalizeTime,
  type SpeakerOption
} from './ui';
import { linkedNames, linksFor, orNull, str, type SalonNode, type TalkNode } from './tree';

type Props = {
  salon: SalonNode;
  speakers: SpeakerOption[];
  handle: React.ReactNode;
  onPatch: (salonId: string, patch: Partial<SalonNode>) => void;
  onDelete: (salonId: string) => void;
};

/**
 * Un salón paralelo dentro de un bloque, con su subagenda de charlas.
 * Cabecera plegada por defecto; al abrir aparece el formulario del salón
 * y la lista reordenable de charlas.
 */
export default function SalonEditor({ salon, speakers, handle, onPatch, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function saveSalon(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      code: str(fd.get('code')),
      name_es: str(fd.get('name_es')),
      name_en: str(fd.get('name_en')),
      tag_es: str(fd.get('tag_es')),
      tag_en: str(fd.get('tag_en')),
      active: fd.get('active') === 'on'
    };
    start(async () => {
      const res = await updateSalon(salon.id, input);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setError(null);
      onPatch(salon.id, {
        code: input.code,
        name_es: input.name_es,
        name_en: orNull(input.name_en),
        tag_es: orNull(input.tag_es),
        tag_en: orNull(input.tag_en),
        active: input.active
      });
    });
  }

  function removeSalon() {
    if (!confirm(`Borrar el salon "${salon.name_es}" y todas sus charlas?`)) return;
    start(async () => {
      const res = await deleteSalon(salon.id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onDelete(salon.id);
    });
  }

  function addTalk() {
    start(async () => {
      const res = await createSalonTalk(salon.id, {
        title_es: 'Nueva charla',
        desc_es: ''
      });
      if (!res.ok || !res.id) {
        setError(res.ok ? 'No se recibió el id de la charla' : res.message);
        return;
      }
      setError(null);
      const talk: TalkNode = {
        id: res.id,
        salon_id: salon.id,
        sort_order: (salon.agenda_salon_items.at(-1)?.sort_order ?? 0) + 10,
        start_time: null,
        end_time: null,
        title_es: 'Nueva charla',
        title_en: null,
        desc_es: '',
        desc_en: null,
        speaker_label_es: null,
        speaker_label_en: null,
        active: true,
        agenda_salon_item_speakers: []
      };
      onPatch(salon.id, { agenda_salon_items: [...salon.agenda_salon_items, talk] });
      setOpen(true);
    });
  }

  function reorderTalks(next: TalkNode[]) {
    onPatch(salon.id, { agenda_salon_items: next });
    start(async () => {
      const res = await reorderSalonTalks(
        salon.id,
        next.map((t) => t.id)
      );
      if (!res.ok) setError(res.message);
    });
  }

  function patchTalk(talkId: string, patch: Partial<TalkNode>) {
    onPatch(salon.id, {
      agenda_salon_items: salon.agenda_salon_items.map((t) =>
        t.id === talkId ? { ...t, ...patch } : t
      )
    });
  }

  function removeTalk(talkId: string) {
    onPatch(salon.id, {
      agenda_salon_items: salon.agenda_salon_items.filter((t) => t.id !== talkId)
    });
  }

  return (
    <div
      className={`rounded-xl border border-linku-border-2 bg-white/[0.02] ${
        salon.active ? '' : 'opacity-60'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        {handle}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 flex-wrap items-center gap-2 text-left"
        >
          {open ? (
            <ChevronDown size={14} className="text-linku-text-dim" />
          ) : (
            <ChevronRight size={14} className="text-linku-text-dim" />
          )}
          <span className="rounded border border-linku-coral/40 bg-linku-coral/10 px-1.5 py-0.5 text-[10px] font-bold text-linku-coral">
            {salon.code}
          </span>
          <span className="text-xs font-semibold text-linku-text">{salon.name_es}</span>
          {!salon.active && (
            <span className="text-[10px] font-bold uppercase text-amber-400">Inactivo</span>
          )}
          <span className="text-[10px] text-linku-text-dim">
            {salon.agenda_salon_items.length > 0
              ? `${salon.agenda_salon_items.length} charlas`
              : 'sin charlas'}
          </span>
        </button>
        {pending && <Loader2 size={13} className="animate-spin text-linku-coral" />}
      </div>

      {open && (
        <div className="space-y-4 border-t border-linku-border-2 p-3">
          <ErrorBanner message={error} />

          <form onSubmit={saveSalon} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Código *"
                name="code"
                defaultValue={salon.code}
                required
                placeholder="A"
              />
              <Field
                label="Nombre (ES) *"
                name="name_es"
                defaultValue={salon.name_es}
                required
                className="sm:col-span-2"
              />
              <Field label="Nombre (EN)" name="name_en" defaultValue={salon.name_en} />
              <Field
                label="Etiqueta (ES)"
                name="tag_es"
                defaultValue={salon.tag_es}
                placeholder="Crecimiento y capital privado"
              />
              <Field label="Etiqueta (EN)" name="tag_en" defaultValue={salon.tag_en} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Check label="Visible en el landing" name="active" defaultChecked={salon.active} />
              <div className="flex items-center gap-2">
                <GhostButton onClick={removeSalon} disabled={pending} danger>
                  <Trash2 size={12} /> Borrar salón
                </GhostButton>
                <SaveButton pending={pending} />
              </div>
            </div>
          </form>

          <div className="space-y-2 border-t border-linku-border-2 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
                Subagenda del salón
              </span>
              <GhostButton onClick={addTalk} disabled={pending}>
                <Plus size={12} /> Añadir charla
              </GhostButton>
            </div>
            {salon.agenda_salon_items.length === 0 ? (
              <p className="text-[11px] text-linku-text-dim">
                Sin charlas. El salón se muestra solo con su nombre y etiqueta.
              </p>
            ) : (
              <div className="space-y-1.5">
                <SortableList
                  items={salon.agenda_salon_items}
                  onReorder={reorderTalks}
                  renderItem={(talk, talkHandle) => (
                    <TalkEditor
                      talk={talk}
                      speakers={speakers}
                      handle={talkHandle}
                      onPatch={patchTalk}
                      onDelete={removeTalk}
                    />
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

/** Una charla dentro de la subagenda de un salón. */
function TalkEditor({
  talk,
  speakers,
  handle,
  onPatch,
  onDelete
}: {
  talk: TalkNode;
  speakers: SpeakerOption[];
  handle: React.ReactNode;
  onPatch: (talkId: string, patch: Partial<TalkNode>) => void;
  onDelete: (talkId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const names = linkedNames(talk.agenda_salon_item_speakers);
  const credit = names.length > 0 ? names.join(' · ') : talk.speaker_label_es;

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const speakerIds = fd.getAll('speaker_ids').map(String);
    const input = {
      start_time: normalizeTime(fd.get('start_time')),
      end_time: normalizeTime(fd.get('end_time')),
      title_es: str(fd.get('title_es')),
      title_en: str(fd.get('title_en')),
      desc_es: str(fd.get('desc_es')),
      desc_en: str(fd.get('desc_en')),
      speaker_label_es: str(fd.get('speaker_label_es')),
      speaker_label_en: str(fd.get('speaker_label_en')),
      active: fd.get('active') === 'on'
    };
    start(async () => {
      const res = await updateSalonTalk(talk.id, input);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      const linkRes = await setSalonTalkSpeakers(talk.id, speakerIds);
      if (!linkRes.ok) {
        setError(linkRes.message);
        return;
      }
      setError(null);
      onPatch(talk.id, {
        start_time: input.start_time || null,
        end_time: input.end_time || null,
        title_es: input.title_es,
        title_en: orNull(input.title_en),
        desc_es: input.desc_es,
        desc_en: orNull(input.desc_en),
        speaker_label_es: orNull(input.speaker_label_es),
        speaker_label_en: orNull(input.speaker_label_en),
        active: input.active,
        agenda_salon_item_speakers: linksFor(speakerIds, speakers)
      });
      setOpen(false);
    });
  }

  function remove() {
    if (!confirm(`Borrar la charla "${talk.title_es}"?`)) return;
    start(async () => {
      const res = await deleteSalonTalk(talk.id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onDelete(talk.id);
    });
  }

  return (
    <div className={`rounded-lg bg-linku-bg-3/60 ${talk.active ? '' : 'opacity-60'}`}>
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        {handle}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 flex-wrap items-center gap-2 text-left text-[11px]"
        >
          {talk.start_time && (
            <span className="font-bold tabular-nums text-linku-coral">{talk.start_time}</span>
          )}
          <span className="text-linku-text">{talk.title_es}</span>
          {credit && <span className="text-linku-text-dim">· {credit}</span>}
          {!talk.active && (
            <span className="text-[10px] font-bold uppercase text-amber-400">Inactiva</span>
          )}
        </button>
        {pending && <Loader2 size={12} className="animate-spin text-linku-coral" />}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-linku-text-dim transition hover:text-linku-text"
          aria-label={open ? 'Cerrar' : 'Editar charla'}
        >
          {open ? <X size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="space-y-3 border-t border-linku-border-2 p-3">
          <ErrorBanner message={error} />
          <div className="grid gap-3 sm:grid-cols-4">
            <Field
              label="Inicio"
              name="start_time"
              defaultValue={talk.start_time}
              placeholder="14:10"
            />
            <Field label="Fin" name="end_time" defaultValue={talk.end_time} placeholder="14:40" />
            <Field
              label="Título (ES) *"
              name="title_es"
              defaultValue={talk.title_es}
              required
              className="sm:col-span-2"
            />
            <Field
              label="Título (EN)"
              name="title_en"
              defaultValue={talk.title_en}
              className="sm:col-span-2"
            />
            <Field
              label="Crédito de speaker (ES)"
              name="speaker_label_es"
              defaultValue={talk.speaker_label_es}
              placeholder="Por confirmar"
              className="sm:col-span-2"
            />
            <Field
              label="Crédito de speaker (EN)"
              name="speaker_label_en"
              defaultValue={talk.speaker_label_en}
              className="sm:col-span-2"
            />
            <Area
              label="Descripción (ES)"
              name="desc_es"
              defaultValue={talk.desc_es}
              rows={2}
              className="sm:col-span-2"
            />
            <Area
              label="Descripción (EN)"
              name="desc_en"
              defaultValue={talk.desc_en}
              rows={2}
              className="sm:col-span-2"
            />
          </div>
          <SpeakerPicker
            speakers={speakers}
            selectedIds={talk.agenda_salon_item_speakers.map((l) => l.speaker_id)}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Check label="Visible en el landing" name="active" defaultChecked={talk.active} />
            <div className="flex items-center gap-2">
              <GhostButton onClick={remove} disabled={pending} danger>
                <Trash2 size={12} /> Borrar
              </GhostButton>
              <SaveButton pending={pending} />
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
