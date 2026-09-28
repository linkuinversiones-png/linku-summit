'use client';

import { useRef, useState } from 'react';
import Reveal from '@/components/ui/Reveal';
import SpeakerCard from '@/components/ui/SpeakerCard';
import SpeakerModal from '@/components/ui/SpeakerModal';
import type { PublicSpeaker } from '@/lib/speakers';

type Props = {
  speakers: PublicSpeaker[];
  tbdLabel: string;
  modalLabels: { close: string; viewLinkedin: string };
};

export default function SpeakersGrid({ speakers, tbdLabel, modalLabels }: Props) {
  const [active, setActive] = useState<PublicSpeaker | null>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const returnFocusRef = useRef<HTMLElement | null>(null);

  function handleOpen(speaker: PublicSpeaker) {
    returnFocusRef.current = cardRefs.current.get(speaker.id) ?? null;
    setActive(speaker);
  }

  function handleClose() {
    setActive(null);
  }

  return (
    <>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {speakers.map((s, i) => (
          <Reveal key={s.id} delay={(i % 4) * 0.05}>
            <SpeakerCard
              ref={(el) => {
                if (el) cardRefs.current.set(s.id, el);
                else cardRefs.current.delete(s.id);
              }}
              speaker={s}
              tbdLabel={tbdLabel}
              onOpen={handleOpen}
            />
          </Reveal>
        ))}
      </div>

      <SpeakerModal
        speaker={active}
        labels={modalLabels}
        onClose={handleClose}
        returnFocusRef={returnFocusRef}
      />
    </>
  );
}
