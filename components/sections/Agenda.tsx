'use client';

import { useState } from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';

type AgendaItem = {
  time: string;
  type: string;
  title: string;
  desc: string;
};

type Day = {
  label: string;
  date: string;
  items: AgendaItem[];
};

type Props = {
  agenda: { day1: Day; day2: Day };
};

const TYPE_LABEL: Record<string, string> = {
  registro: 'Registro',
  keynote: 'Keynote',
  panel: 'Panel',
  feria: 'Feria',
  comida: 'Comida',
  networking: 'Networking',
  pitch: 'Pitch stage',
  vip: 'VIP'
};

function isAccent(type: string) {
  return type === 'keynote' || type === 'pitch';
}

export default function Agenda({ agenda }: Props) {
  const [activeDay, setActiveDay] = useState<'day1' | 'day2'>('day1');
  const day = agenda[activeDay];

  return (
    <section id="agenda" className="relative">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Agenda"
            title={
              <>
                Dos días
                <br />
                <span className="text-linku-coral">construidos por bloque.</span>
              </>
            }
            lead="Cada hora del summit está diseñada para que la conversación correcta pase. Sin filler."
          />
        </Reveal>

        <div className="mt-12 inline-flex rounded-xl border border-linku-border bg-linku-bg-2/50 p-1">
          {(['day1', 'day2'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setActiveDay(d)}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeDay === d
                  ? 'bg-linku-coral text-white shadow-coral-glow'
                  : 'text-linku-text-muted hover:text-linku-text'
              }`}
            >
              {d === 'day1' ? 'Día 1' : 'Día 2'}
            </button>
          ))}
        </div>

        <Reveal>
          <p className="mt-8 text-base font-medium text-linku-text-muted sm:text-lg">
            {day.label}
          </p>

          <ol className="mt-8 space-y-1">
            {day.items.map((item) => (
              <li
                key={`${item.time}-${item.title}`}
                className="group relative grid grid-cols-[80px_1fr] gap-4 border-b border-linku-border py-5 sm:grid-cols-[120px_1fr] sm:gap-8 sm:py-7"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <span
                    className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                      isAccent(item.type) ? 'bg-linku-coral' : 'bg-linku-text-dim'
                    }`}
                    aria-hidden
                  />
                  <span
                    className={`text-base font-bold tracking-tightish tabular-nums sm:text-xl ${
                      isAccent(item.type) ? 'text-linku-coral' : 'text-linku-text'
                    }`}
                  >
                    {item.time}
                  </span>
                </div>
                <div>
                  <span className="inline-flex items-center rounded-full border border-linku-border bg-white/[0.02] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-linku-text-dim">
                    {TYPE_LABEL[item.type] ?? item.type}
                  </span>
                  <h4
                    className={`mt-2 text-base font-semibold tracking-tightish sm:text-lg ${
                      isAccent(item.type) ? 'text-linku-text' : 'text-linku-text'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-linku-text-muted">
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
