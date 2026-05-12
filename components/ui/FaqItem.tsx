'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

type Props = {
  question: string;
  answer: string;
};

export default function FaqItem({ question, answer }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="linku-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
      >
        <span className="text-base font-semibold tracking-tightish text-linku-text sm:text-lg">
          {question}
        </span>
        <Plus
          size={20}
          strokeWidth={1.75}
          className={`shrink-0 text-linku-coral transition-transform duration-300 ${
            open ? 'rotate-45' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-6 pr-12 text-sm leading-relaxed text-linku-text-muted sm:px-6 sm:text-base">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
