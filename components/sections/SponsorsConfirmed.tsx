import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import PartnerLogo from '@/components/ui/PartnerLogo';
import CoralButton from '@/components/ui/CoralButton';

type Sponsor = { id: string; name: string; logo: string; website?: string };
type Tier = { id: string; name: string; sponsors: Sponsor[] };

type Props = {
  sponsors: {
    tiers: Tier[];
    emptyMessage: string;
    ctaEmail: string;
  };
};

const TIER_SIZE: Record<string, string> = {
  'series-a': 'h-20 sm:h-24',
  seed: 'h-16 sm:h-20',
  'pre-seed': 'h-12 sm:h-16',
  esencial: 'h-12 sm:h-14'
};

export default function SponsorsConfirmed({ sponsors }: Props) {
  const hasAny = sponsors.tiers.some((t) => t.sponsors && t.sponsors.length > 0);

  if (!hasAny) {
    return (
      <section className="relative">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-24">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
              Sponsors confirmados
            </p>
            <h3 className="mt-4 text-2xl font-bold tracking-tightish text-linku-text sm:text-3xl">
              Anunciamos sponsors pronto.
            </h3>
            <p className="mt-4 text-base text-linku-text-muted sm:text-lg">
              {sponsors.emptyMessage}
            </p>
            <div className="mt-8 flex justify-center">
              <CoralButton href={`mailto:${sponsors.ctaEmail}?subject=Sponsorship — LinkU Summit 2026`}>
                Quiero ser sponsor
              </CoralButton>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading eyebrow="Sponsors confirmados" title="Quién está adentro." />
        </Reveal>

        <div className="mt-14 space-y-12">
          {sponsors.tiers
            .filter((t) => t.sponsors && t.sponsors.length > 0)
            .map((tier) => (
              <div key={tier.id}>
                <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-linku-text-dim">
                  {tier.name}
                </p>
                <div
                  className={`mt-6 grid items-center justify-items-center gap-x-6 gap-y-8 ${
                    tier.id === 'series-a'
                      ? 'sm:grid-cols-3'
                      : tier.id === 'seed'
                        ? 'sm:grid-cols-4'
                        : 'sm:grid-cols-5'
                  }`}
                >
                  {tier.sponsors.map((s) => (
                    <div key={s.id} className={TIER_SIZE[tier.id] ?? 'h-16'}>
                      <PartnerLogo name={s.name} logo={s.logo} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
