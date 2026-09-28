'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Linkedin, X } from 'lucide-react';
import type { PublicSpeaker } from '@/lib/speakers';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

type ModalLabels = {
  close: string;
  viewLinkedin: string;
};

type Props = {
  speaker: PublicSpeaker | null;
  labels: ModalLabels;
  onClose: () => void;
  /** Elemento al que devolver el foco al cerrar. */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

export default function SpeakerModal({ speaker, labels, onClose, returnFocusRef }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isOpen = Boolean(speaker);

  // Escape para cerrar.
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Bloquea el scroll de la página mientras el modal está abierto.
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Foco al abrir y devolución de foco al cerrar.
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    } else {
      returnFocusRef?.current?.focus();
    }
  }, [isOpen, returnFocusRef]);

  const titleId = speaker ? `speaker-modal-title-${speaker.id}` : undefined;

  return (
    <AnimatePresence>
      {speaker && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative z-10 flex h-full w-full max-h-none flex-col overflow-hidden bg-linku-bg-2 shadow-2xl outline-none sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-2xl sm:rounded-[20px] sm:border sm:border-linku-border"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: 0.98 }
            }
            animate={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: 0.98 }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={labels.close}
              className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-linku-bg/85 text-linku-text backdrop-blur-sm ring-1 ring-white/10 transition hover:bg-linku-coral hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="overflow-y-auto px-6 py-6 pr-14 sm:px-7 sm:py-7 sm:pr-16">
              {/* Encabezado: foto a la izquierda (proporción fija 4:5, nunca se
                  estira con el largo de la bio) y a la derecha nombre, cargo,
                  track y LinkedIn. La descripción va debajo, a todo el ancho,
                  para no dejar espacio vacío bajo la foto cuando la bio es larga. */}
              <div className="flex items-center gap-4 sm:items-start sm:gap-6">
                <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl sm:w-40 sm:rounded-2xl">
                  {speaker.avatarUrl ? (
                    <Image
                      src={speaker.avatarUrl}
                      alt={speaker.name}
                      fill
                      sizes="(max-width: 640px) 96px, 160px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-linku-bg-3 to-linku-bg-2">
                      <span className="text-2xl font-bold tracking-tighter2 text-linku-coral sm:text-4xl">
                        {initials(speaker.name)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 sm:pt-1">
                  <h3
                    id={titleId}
                    className="text-lg font-semibold tracking-tightish text-linku-text sm:text-2xl"
                  >
                    {speaker.name}
                  </h3>
                  <p className="mt-1 text-sm text-linku-text-muted">
                    {speaker.role}
                    {speaker.company ? ` · ${speaker.company}` : ''}
                  </p>
                  {speaker.track && (
                    <span className="mt-3 inline-flex items-center rounded-full border border-linku-border bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium text-linku-text-dim">
                      {speaker.track}
                    </span>
                  )}

                  {speaker.linkedinUrl && (
                    <a
                      href={speaker.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-linku-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-linku-coral-soft"
                    >
                      <Linkedin size={16} />
                      {labels.viewLinkedin}
                    </a>
                  )}
                </div>
              </div>

              {speaker.bio && (
                <>
                  <div className="mt-6 border-t border-linku-border" aria-hidden />
                  <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-linku-text-muted">
                    {speaker.bio}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
