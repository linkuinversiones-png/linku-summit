'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getImageUrl } from '@/lib/storage';

type Speaker = {
  id: string;
  name: string;
  role: string;
  company: string;
  track: string;
  avatar: string | null;
  confirmed: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

export default function SpeakerCard({ speaker }: { speaker: Speaker }) {
  const [imgFailed, setImgFailed] = useState(false);
  const resolvedAvatar = getImageUrl(speaker.avatar);
  const showPlaceholder = !resolvedAvatar || !speaker.confirmed || imgFailed;

  return (
    <article className="linku-card group overflow-hidden">
      <div className="relative aspect-square w-full overflow-hidden rounded-t-[20px] bg-linku-bg-3">
        {showPlaceholder ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-linku-bg-3 to-linku-bg-2">
            {speaker.confirmed ? (
              <span className="text-3xl font-bold tracking-tighter2 text-linku-coral sm:text-4xl">
                {initials(speaker.name)}
              </span>
            ) : (
              <>
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-linku-text-dim"
                  aria-hidden
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-linku-coral">
                  Por confirmar
                </span>
              </>
            )}
          </div>
        ) : (
          <Image
            src={resolvedAvatar as string}
            alt={speaker.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-all duration-500 [filter:url(#linku-duotone)] group-hover:scale-[1.03] group-hover:[filter:none]"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
      <div className="px-5 py-4">
        <h3 className="text-base font-semibold tracking-tightish text-linku-text">
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
      </div>
    </article>
  );
}
