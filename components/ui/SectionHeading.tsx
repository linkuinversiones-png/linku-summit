import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'left',
  className = ''
}: Props) {
  const alignCls = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`max-w-3xl ${alignCls} ${className}`}>
      {eyebrow && (
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
          {eyebrow}
        </div>
      )}
      <h2 className="font-bold tracking-tightish text-linku-text text-[clamp(2rem,4vw,3.25rem)] leading-[1.05]">
        {title}
      </h2>
      {lead && (
        <p className="mt-5 text-base text-linku-text-muted sm:text-lg leading-relaxed">{lead}</p>
      )}
    </div>
  );
}
