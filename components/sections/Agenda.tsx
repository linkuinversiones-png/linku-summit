'use client';

import { useState } from 'react';
import { Handshake } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import type { UiContent } from '@/lib/i18n/content';

type Company = { name: string; logoUrl: string | null; websiteUrl: string | null };

type SalonTalk = {
  time?: string;
  endTime?: string;
  title: string;
  speaker?: string;
  desc?: string;
  companies?: Company[];
};

type SubItem = { code: string; name: string; tag?: string; talks?: SalonTalk[] };

type AgendaItem = {
  time: string;
  endTime?: string;
  type: string;
  title: string;
  speaker?: string;
  desc: string;
  companies?: Company[];
  subItems?: SubItem[];
};

type Day = {
  label: string;
  date: string;
  tagline?: string;
  parallel?: { title: string; desc?: string; time?: string };
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

/** Fila de empresas vinculadas: logo pequeño + nombre; link solo si hay web. */
function CompanyChips({ companies }: { companies?: Company[] }) {
  if (!companies || companies.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {companies.map((c, i) => {
        const inner = (
          <>
            {c.logoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={c.logoUrl}
                alt=""
                loading="lazy"
                className="h-7 w-auto max-w-[96px] object-contain brightness-0 invert opacity-70 sm:h-8"
              />
            )}
            <span className="text-xs font-medium text-linku-text-muted">{c.name}</span>
          </>
        );
        const cls =
          'flex items-center gap-2 rounded-lg border border-linku-border bg-white/[0.03] px-2.5 py-1.5';
        return (
          <li key={`${c.name}-${i}`}>
            {c.websiteUrl ? (
              <a
                href={c.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cls} transition hover:border-linku-coral/40 hover:bg-white/[0.06]`}
              >
                {inner}
              </a>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
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

          {day.parallel && (
            <div className="mt-6 flex items-start gap-4 rounded-2xl border border-linku-coral/40 bg-linku-coral/5 p-5 sm:gap-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-linku-coral/40 bg-linku-coral/10 text-linku-coral">
                <Handshake size={22} aria-hidden />
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-linku-coral">
                  {ui.parallelLabel}
                </span>
                <h4 className="mt-1.5 text-lg font-bold tracking-tightish text-linku-text sm:text-xl">
                  {day.parallel.title}
                </h4>
                {day.parallel.time && (
                  <p className="mt-1 text-sm font-bold tabular-nums text-linku-coral">
                    {day.parallel.time}
                  </p>
                )}
                {day.parallel.desc && (
                  <p className="mt-2 text-sm leading-relaxed text-linku-text-muted sm:text-base">
                    {day.parallel.desc}
                  </p>
                )}
              </div>
            </div>
          )}

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
                        <CompanyChips companies={item.companies} />
                        {item.subItems && (
                          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {item.subItems.map((sub) => (
                              <li
                                key={sub.code}
                                className="linku-card flex flex-col gap-3 p-4"
                              >
                                <div className="flex items-start gap-3">
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
                                </div>
                                {sub.talks && sub.talks.length > 0 && (
                                  <ul className="space-y-2 border-t border-linku-border pt-3">
                                    {sub.talks.map((talk, ti) => (
                                      <li key={`${talk.title}-${ti}`} className="flex flex-col">
                                        <span className="text-[13px] font-medium text-linku-text">
                                          {talk.time && (
                                            <span className="mr-1.5 font-bold tabular-nums text-linku-coral">
                                              {talk.endTime
                                                ? `${talk.time}–${talk.endTime}`
                                                : talk.time}
                                            </span>
                                          )}
                                          {talk.title}
                                        </span>
                                        {talk.speaker && (
                                          <span className="mt-0.5 text-[12px] italic text-linku-coral/80">
                                            {talk.speaker}
                                          </span>
                                        )}
                                        {talk.desc && (
                                          <span className="mt-0.5 text-[12px] leading-relaxed text-linku-text-muted">
                                            {talk.desc}
                                          </span>
                                        )}
                                        <CompanyChips companies={talk.companies} />
                                      </li>
                                    ))}
                                  </ul>
                                )}
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
                    <CompanyChips companies={item.companies} />
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
