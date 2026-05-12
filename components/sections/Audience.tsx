import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';

type Props = {
  audience: {
    title: string;
    lead: string;
    splits: { value: string; label: string }[];
    filters: string[];
  };
};

export default function Audience({ audience }: Props) {
  return (
    <section className="relative bg-linku-bg-2/40">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={audience.title}
              title={
                <>
                  Calidad,
                  <br />
                  <span className="text-linku-coral">no volumen.</span>
                </>
              }
              lead={audience.lead}
            />

            <div className="mt-10 space-y-7">
              {audience.splits.map((s) => (
                <div
                  key={s.label}
                  className="flex items-baseline gap-5 border-b border-linku-border pb-7 last:border-0 last:pb-0"
                >
                  <span className="font-bold tracking-tighter2 text-linku-coral text-[clamp(2.75rem,6vw,4.5rem)] leading-none tabular-nums">
                    {s.value}
                  </span>
                  <span className="text-sm font-medium text-linku-text sm:text-base">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="linku-card p-7 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
                Curaduría
              </p>
              <h3 className="mt-4 text-2xl font-bold tracking-tightish text-linku-text sm:text-3xl">
                Cuatro filtros antes de entrar a la sala.
              </h3>
              <ol className="mt-8 space-y-5">
                {audience.filters.map((f, i) => (
                  <li key={f} className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-linku-coral/40 bg-linku-coral/5 text-sm font-bold text-linku-coral">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="pt-1.5 text-base leading-relaxed text-linku-text">
                      {f}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
