'use client';

import { useState } from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import type { UiContent } from '@/lib/i18n/content';

type SubItem = { code: string; name: string; tag?: string };

type AgendaItem = {
  time: string;
  endTime?: string;
  type: string;
  title: string;
  speaker?: string;
  desc: string;
  subItems?: SubItem[];
};

type Day = {
  label: string;
  date: string;
  tagline?: string;
  items: AgendaItem[];
};

type Props = {
  agenda: {
    intro?: { lead: string };
    day1: Day;
    day2: Day;
  };
  ui: UiContent['agenda'];
};

const ACCENT_TYPES = new Set(['apertura', 'charla', 'keynote', 'pitch']);
const SPECIAL_BLOCK_TYPES = new Set(['salones', 'relacionamiento']);

function formatTime(item: AgendaItem) {
  return item.endTime ? `${item.time} – ${item.endTime}` : item.time;
}

export default function Agenda({ agenda, ui }: Props) {
  const [activeDay, setActiveDay] = useState<'day1' | 'day2'>('day1');
  const day = agenda[activeDay];

  const typeLabel = (t: string) =>
    (ui.types as Record<string, string>)[t] ?? t;

  return (
    <section id="agenda" className="relative">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow={ui.eyebrow}
            title={
              <>
                {ui.titleA}
                <br />
                <span className="text-linku-coral">{ui.titleB}</span>
              </>
            }
            lead={agenda.intro?.lead}
          />
        </Reveal>

        <div className="mt-10 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:items-center sm:gap-5">
          <div className="inline-flex rounded-xl border border-linku-border bg-linku-bg-2/50 p-1">
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
                {d === 'day1' ? ui.day1 : ui.day2}
              </button>
            ))}
          </div>
          {day.tagline && (
            <p className="text-sm italic text-linku-text-muted sm:text-base">
              {day.tagline}
            </p>
          )}
        </div>

        <Reveal>
          <p className="mt-7 text-base font-medium text-linku-text sm:text-lg">
            {day.label}
          </p>

          <ol className="mt-6 space-y-1">
            {day.items.map((item) => {
              const isAccent = ACCENT_TYPES.has(item.type);
              const isSpecial = SPECIAL_BLOCK_TYPES.has(item.type);

              if (isSpecial) {
                return (
                  <li
                    key={`${item.time}-${item.title}`}
                    className="border-b border-linku-border py-7 sm:py-9"
                  >
                    <div className="grid grid-cols-[88px_1fr] gap-4 sm:grid-cols-[140px_1fr] sm:gap-8">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-linku-coral" aria-hidden />
                        <span className="text-sm font-bold tracking-tightish tabular-nums text-linku-coral sm:text-base">
                          {formatTime(item)}
                        </span>
                      </div>
                      <div>
                        <span className="inline-flex items-center rounded-full border border-linku-coral/30 bg-linku-coral/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-linku-coral">
                          {typeLabel(item.type)}
                        </span>
                        <h4 className="mt-3 text-lg font-bold tracking-tightish text-linku-text sm:text-xl">
                          {item.title}
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-linku-text-muted sm:text-base">
                          {item.desc}
                        </p>
                        {item.subItems && (
                          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {item.subItems.map((sub) => (
                              <li
                                key={sub.code}
                                className="linku-card flex items-start gap-3 p-4"
                              >
                                <span className="flex h-9 min-w-[36px] items-center justify-center rounded-lg border border-linku-coral/40 bg-linku-coral/10 px-2 text-xs font-bold uppercase tracking-tightish text-linku-coral">
                                  {sub.code}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-linku-text">
                                    {sub.name}
                                  </span>
                                  {sub.tag && (
                                    <span className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-linku-text-dim">
                                      {sub.tag}
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={`${item.time}-${item.title}`}
                  className="group relative grid grid-cols-[88px_1fr] gap-4 border-b border-linku-border py-5 sm:grid-cols-[140px_1fr] sm:gap-8 sm:py-7"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                        isAccent ? 'bg-linku-coral' : 'bg-linku-text-dim'
                      }`}
                      aria-hidden
                    />
                    <span
                      className={`text-sm font-bold tracking-tightish tabular-nums sm:text-base ${
                        isAccent ? 'text-linku-coral' : 'text-linku-text'
                      }`}
                    >
                      {formatTime(item)}
                    </span>
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full border border-linku-border bg-white/[0.02] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-linku-text-dim">
                      {typeLabel(item.type)}
                    </span>
                    <h4 className="mt-2 text-base font-semibold tracking-tightish text-linku-text sm:text-lg">
                      {item.title}
                    </h4>
                    {item.speaker && (
                      <p className="mt-1 text-sm italic text-linku-coral/80">
                        {item.speaker}
                      </p>
                    )}
                    {item.desc && (
                      <p className="mt-1.5 text-sm leading-relaxed text-linku-text-muted">
                        {item.desc}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
