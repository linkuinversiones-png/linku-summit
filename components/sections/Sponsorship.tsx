import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import SponsorTier from '@/components/ui/SponsorTier';
import { Check } from 'lucide-react';

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
  sponsorship: {
    tiers: Tier[];
    essential: {
      name: string;
      price: string;
      description: string;
      benefits: string[];
    };
    addons: { name: string; tag: string }[];
  };
};

export default function Sponsorship({ sponsorship }: Props) {
  const ordered = [...sponsorship.tiers].sort((a, b) => {
    const order = ['pre-seed', 'seed', 'series-a'];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });

  return (
    <section id="sponsors" className="relative bg-linku-bg-2/40">
      <div className="absolute inset-0 bg-section-glow opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Sponsorship"
            title={
              <>
                Pon tu marca donde
                <br />
                <span className="text-linku-coral">se mueve el capital.</span>
              </>
            }
            lead="Tres tiers principales más Branding Esencial y add-ons. Armamos el paquete a medida."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {ordered.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 0.07}>
              <SponsorTier tier={tier} />
            </Reveal>
          ))}
        </div>

        {/* Branding Esencial */}
        <Reveal>
          <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
            <div className="linku-card p-7 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
                Branding Esencial
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tightish text-linku-text sm:text-3xl">
                {sponsorship.essential.name}
              </h3>
              <p className="mt-2 text-lg font-semibold text-linku-text">
                {sponsorship.essential.price}
              </p>
              <p className="mt-4 text-base text-linku-text-muted">
                {sponsorship.essential.description}
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {sponsorship.essential.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-linku-text-muted">
                    <Check size={16} className="mt-0.5 shrink-0 text-linku-coral" strokeWidth={2.25} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
                Add-ons
              </p>
              <h3 className="mt-3 text-xl font-bold tracking-tightish text-linku-text sm:text-2xl">
                Activaciones a medida.
              </h3>
              <ul className="mt-6 space-y-3">
                {sponsorship.addons.map((a) => (
                  <li
                    key={a.name}
                    className="linku-card flex items-start gap-4 p-4 sm:p-5"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-linku-text">{a.name}</p>
                      <p className="mt-0.5 text-xs text-linku-text-muted">{a.tag}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
