'use client';

import { useEffect, useState } from 'react';

type Props = {
  targetDate: string;
  labels?: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
};

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function diff(target: number): Parts {
  const now = Date.now();
  const total = Math.max(0, target - now);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);
  return { days, hours, minutes, seconds };
}

const pad = (n: number) => String(n).padStart(2, '0');

const FALLBACK = { days: 'Días', hours: 'Horas', minutes: 'Minutos', seconds: 'Segundos' };

export default function Countdown({ targetDate, labels = FALLBACK }: Props) {
  const target = new Date(targetDate).getTime();
  const [mounted, setMounted] = useState(false);
  const [parts, setParts] = useState<Parts>(() => diff(target));

  useEffect(() => {
    setMounted(true);
    const id = window.setInterval(() => setParts(diff(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const blocks: Array<{ label: string; value: string }> = [
    { label: labels.days, value: mounted ? String(parts.days) : '—' },
    { label: labels.hours, value: mounted ? pad(parts.hours) : '—' },
    { label: labels.minutes, value: mounted ? pad(parts.minutes) : '—' },
    { label: labels.seconds, value: mounted ? pad(parts.seconds) : '—' }
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl">
      {blocks.map((b) => (
        <div
          key={b.label}
          className="linku-card flex flex-col items-center justify-center px-2 py-4 sm:py-5"
        >
          <span className="font-bold tracking-tighter2 text-linku-text text-[clamp(1.75rem,5vw,3rem)] leading-none tabular-nums">
            {b.value}
          </span>
          <span className="mt-2 text-[10px] sm:text-xs font-medium uppercase tracking-[0.18em] text-linku-text-muted">
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}
