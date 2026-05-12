import Reveal from '@/components/ui/Reveal';
import { ArrowUpRight } from 'lucide-react';

type Action = { label: string; tag: string; href: string };

type Props = {
  finalCTA: {
    title: string;
    highlight: string;
    actions: Action[];
  };
};

export default function FinalCTA({ finalCTA }: Props) {
  return (
    <section className="relative overflow-hidden bg-linku-bg-2/40">
      <div className="absolute inset-0 bg-section-glow opacity-90" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-px bg-coral-divider" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-px bg-coral-divider" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <Reveal>
          <h2 className="font-bold tracking-tighter2 text-linku-text leading-[1.05] text-[clamp(2.5rem,7vw,5.5rem)]">
            {finalCTA.title}
            <br />
            <span className="text-linku-coral">{finalCTA.highlight}</span>
          </h2>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {finalCTA.actions.map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="group linku-card flex flex-col items-start p-6 text-left transition hover:border-linku-coral/40 sm:p-7"
              >
                <span className="flex w-full items-center justify-between">
                  <span className="text-2xl font-bold tracking-tightish text-linku-text">
                    {a.label}
                  </span>
                  <ArrowUpRight
                    size={20}
                    strokeWidth={1.75}
                    className="text-linku-text-dim transition group-hover:text-linku-coral group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
                <span className="mt-2 text-xs text-linku-text-muted">{a.tag}</span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
