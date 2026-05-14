import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import OutlineButton from '@/components/ui/OutlineButton';
import { Briefcase, Rocket, Megaphone } from 'lucide-react';
import type { UiContent } from '@/lib/i18n/content';

type Props = {
  contacts: { invites: string; sponsors: string; partners: string };
  ui: UiContent['forWhom'];
};

export default function ForWhom({ contacts, ui }: Props) {
  const cards = [
    {
      icon: Briefcase,
      title: ui.investors.title,
      lead: ui.investors.lead,
      bullets: ui.investors.bullets,
      cta: {
        label: ui.investors.cta,
        href: `mailto:${contacts.invites}?subject=${encodeURIComponent(ui.investors.ctaSubject)}`
      }
    },
    {
      icon: Rocket,
      title: ui.founders.title,
      lead: ui.founders.lead,
      bullets: ui.founders.bullets,
      cta: {
        label: ui.founders.cta,
        href: `mailto:${contacts.invites}?subject=${encodeURIComponent(ui.founders.ctaSubject)}`
      }
    },
    {
      icon: Megaphone,
      title: ui.sponsors.title,
      lead: ui.sponsors.lead,
      bullets: ui.sponsors.bullets,
      cta: {
        label: ui.sponsors.cta,
        href: `mailto:${contacts.sponsors}?subject=${encodeURIComponent(ui.sponsors.ctaSubject)}`
      }
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

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <article className="linku-card flex h-full flex-col p-7 sm:p-8">
                <header>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-linku-coral/10 text-linku-coral">
                    <c.icon size={20} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-2xl font-bold tracking-tightish text-linku-text">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-base font-medium text-linku-text-muted">{c.lead}</p>
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
                <div className="mt-7">
                  <OutlineButton href={c.cta.href} className="w-full">
                    {c.cta.label}
                  </OutlineButton>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
