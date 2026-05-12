import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { Mic, Users, Store, Wine, type LucideIcon } from 'lucide-react';

type Item = { icon: string; title: string; desc: string };

const ICON_MAP: Record<string, LucideIcon> = {
  mic: Mic,
  users: Users,
  store: Store,
  wine: Wine
};

export default function Experience({ items }: { items: Item[] }) {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Experiencia"
            title={
              <>
                Lo que vas a vivir
                <br />
                <span className="text-linku-coral">en el venue.</span>
              </>
            }
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => {
            const Icon = ICON_MAP[item.icon] ?? Mic;
            return (
              <Reveal key={item.title} delay={i * 0.05}>
                <article className="linku-card flex h-full flex-col p-6 sm:p-7">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-linku-coral/10 text-linku-coral">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-lg font-bold tracking-tightish text-linku-text">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-linku-text-muted">
                    {item.desc}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
