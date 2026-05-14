import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import SponsorTier from '@/components/ui/SponsorTier';
import type { UiContent } from '@/lib/i18n/content';

type Tier = {
  id: string;
  name: string;
  label: string;
  price: string;
  priceNote?: string;
  highlight: boolean;
  badge?: string;
  benefits: string[];
  ctaLabel: string;
  ctaHref: string;
};

type Props = {
  tickets: {
    intro: { title: string; lead: string };
    tiers: Tier[];
  };
  ui: UiContent['tickets'];
};

export default function Tickets({ tickets, ui }: Props) {
  return (
    <section id="tickets" className="relative">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow={tickets.intro.title}
            title={
              <>
                {ui.titleA}
                <br />
                <span className="text-linku-coral">{ui.titleB}</span>
              </>
            }
            lead={tickets.intro.lead}
          />
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 md:gap-7">
          {tickets.tiers.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 0.06}>
              <SponsorTier tier={tier} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
