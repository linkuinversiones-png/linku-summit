import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import FaqItem from '@/components/ui/FaqItem';
import type { UiContent } from '@/lib/i18n/content';

type Item = { q: string; a: string };

type Props = {
  items: Item[];
  ui: UiContent['faq'];
};

export default function FAQ({ items, ui }: Props) {
  return (
    <section id="faq" className="relative">
      <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow={ui.eyebrow}
            title={ui.title}
            align="center"
          />
        </Reveal>

        <div className="mt-12 space-y-3">
          {items.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.04}>
              <FaqItem question={item.q} answer={item.a} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
