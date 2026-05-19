import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { Briefcase, BriefcaseBusiness, Rocket, Megaphone } from 'lucide-react';
import type { UiContent } from '@/lib/i18n/content';

type Props = {
  ui: UiContent['forWhom'];
};

export default function ForWhom({ ui }: Props) {
  const cards = [
    {
      icon: Briefcase,
      title: ui.investors.title,
      lead: ui.investors.lead,
      bullets: ui.investors.bullets
    },
    {
      icon: BriefcaseBusiness,
      title: ui.managers.title,
      lead: ui.managers.lead,
      bullets: ui.managers.bullets
    },
    {
      icon: Rocket,
      title: ui.founders.title,
      lead: ui.founders.lead,
      bullets: ui.founders.bullets
    },
    {
      icon: Megaphone,
      title: ui.sponsors.title,
      lead: ui.sponsors.lead,
      bullets: ui.sponsors.bullets
    }
  ];

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
            lead={ui.lead}
          />
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.06}>
              <article className="linku-card flex h-full flex-col p-6 sm:p-7">
                <header>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-linku-coral/10 text-linku-coral">
                    <c.icon size={20} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-xl font-bold tracking-tightish text-linku-text">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-linku-text-muted sm:text-base">
                    {c.lead}
                  </p>
                </header>
                <ul className="mt-6 flex-1 space-y-3">
                  {c.bullets.map((b) => (
                    <li
                      key={b}
                      className="relative pl-5 text-sm leading-relaxed text-linku-text-muted before:absolute before:left-0 before:top-2.5 before:h-1 before:w-1.5 before:rounded-full before:bg-linku-coral"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
