import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  pulse?: boolean;
};

export default function Pill({ children, pulse = true }: Props) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-linku-coral/40 bg-linku-coral/5 px-4 py-1.5 text-xs font-medium text-linku-text backdrop-blur-sm">
      <span
        className={`relative inline-block h-2 w-2 rounded-full bg-linku-coral ${
          pulse ? 'animate-pulse-coral' : ''
        }`}
        aria-hidden
      />
      <span className="tracking-wide">{children}</span>
    </span>
  );
}
