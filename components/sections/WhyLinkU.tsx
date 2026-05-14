import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { Check } from 'lucide-react';
import type { UiContent } from '@/lib/i18n/content';

type Item = { title: string; body: string };

type Props = {
  items: Item[];
  ui: UiContent['whyLinkU'];
};

export default function WhyLinkU({ items, ui }: Props) {
  return (
    <section className="relative">
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
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 0.06}>
              <article className="linku-card flex h-full flex-col p-6 sm:p-7">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-linku-coral/10 text-linku-coral">
                  <Check size={18} strokeWidth={2.25} />
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-tightish text-linku-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-linku-text-muted">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
