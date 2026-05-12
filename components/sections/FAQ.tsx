import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import FaqItem from '@/components/ui/FaqItem';

type Item = { q: string; a: string };

export default function FAQ({ items }: { items: Item[] }) {
  return (
    <section id="faq" className="relative">
      <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Preguntas frecuentes"
            title="Lo que la gente nos pregunta antes de entrar."
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
