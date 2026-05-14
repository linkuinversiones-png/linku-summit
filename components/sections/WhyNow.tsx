import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import type { UiContent } from '@/lib/i18n/content';

type Item = { title: string; body: string };

type Props = {
  items: Item[];
  ui: UiContent['whyNow'];
};

export default function WhyNow({ items, ui }: Props) {
  return (
    <section className="relative bg-linku-bg-2/40">
      <div className="absolute inset-0 bg-section-glow opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
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
          />
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.08}>
              <article className="linku-card flex h-full flex-col p-7 sm:p-8">
                <span className="text-5xl font-bold leading-none tracking-tighter2 text-linku-coral/80">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-tightish text-linku-text">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-linku-text-muted sm:text-base">
                  {item.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
