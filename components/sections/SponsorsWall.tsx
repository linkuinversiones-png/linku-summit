import Reveal from '@/components/ui/Reveal';
import { getSponsorGroups, type SponsorGroup } from '@/lib/sponsors';
import type { Locale } from '@/lib/i18n/config';
import CoralButton from '@/components/ui/CoralButton';

type Copy = {
  eyebrow: string;
  title: string;
  emptyTitle: string;
  emptyLead: string;
  emptyCta: string;
  emptyCtaSubject: string;
  contactEmail: string;
};

export default async function SponsorsWall({
  locale,
  copy
}: {
  locale: Locale;
  copy: Copy;
}) {
  const groups = await getSponsorGroups(locale);
  const tiers = groups.filter((g) => !g.category.aliado);
  const aliados = groups.find((g) => g.category.aliado);

  if (tiers.length === 0 && !aliados) {
    return (
      <section id="sponsors" className="relative bg-linku-bg-2/40">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-24">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
              {copy.eyebrow}
            </p>
            <h3 className="mt-4 text-2xl font-bold tracking-tightish text-linku-text sm:text-3xl">
              {copy.emptyTitle}
            </h3>
            <p className="mt-4 text-base text-linku-text-muted sm:text-lg">
              {copy.emptyLead}
            </p>
            <div className="mt-8 flex justify-center">
              <CoralButton
                href={`mailto:${copy.contactEmail}?subject=${encodeURIComponent(copy.emptyCtaSubject)}`}
              >
                {copy.emptyCta}
              </CoralButton>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section id="sponsors" className="relative bg-linku-bg-2/40">
      <div className="absolute inset-0 bg-section-glow opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(280px,360px)] lg:gap-14">
          {/* Columna izquierda: categorías de logos */}
          <div className="order-2 lg:order-1">
            {tiers.length > 0 && (
              <div className="divide-y divide-linku-border border-t border-linku-border">
                {tiers.map((group) => (
                  <CategoryRow key={group.category.slug} group={group} />
                ))}
              </div>
            )}

            {aliados && (
              <div className="mt-12 border-t-2 border-linku-border-2 pt-2 lg:mt-16">
                <div className="divide-y divide-linku-border">
                  <CategoryRow group={aliados} />
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha: título grande sticky */}
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-linku-coral">
                  {copy.eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tightish text-linku-text sm:text-4xl lg:text-5xl">
                  {copy.title}
                </h2>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Tamaño de logos según jerarquía del tier.
 * Series C / Aliados: los más grandes (sponsors top + partners institucionales).
 * Series B → Angel: escalación descendente.
 */
const SIZE_BY_SLUG: Record<string, string> = {
  'series-c': 'h-14 max-w-[180px] sm:h-16 sm:max-w-[200px]',
  'series-b': 'h-12 max-w-[160px] sm:h-14 sm:max-w-[180px]',
  'series-a': 'h-10 max-w-[140px] sm:h-12 sm:max-w-[160px]',
  'pre-series-a': 'h-9 max-w-[125px] sm:h-10 sm:max-w-[140px]',
  seed: 'h-8 max-w-[110px] sm:h-9 sm:max-w-[125px]',
  'pre-seed': 'h-7 max-w-[100px] sm:h-8 sm:max-w-[115px]',
  angel: 'h-6 max-w-[90px] sm:h-7 sm:max-w-[105px]',
  aliados: 'h-14 max-w-[180px] sm:h-16 sm:max-w-[200px]'
};

const DEFAULT_SIZE = 'h-9 max-w-[120px] sm:h-10 sm:max-w-[140px]';

/**
 * Gap entre logos: mayor en tiers grandes para que respiren.
 */
const GAP_BY_SLUG: Record<string, string> = {
  'series-c': 'gap-x-10 gap-y-7',
  'series-b': 'gap-x-9 gap-y-6',
  'series-a': 'gap-x-8 gap-y-6',
  'pre-series-a': 'gap-x-7 gap-y-5',
  seed: 'gap-x-6 gap-y-5',
  'pre-seed': 'gap-x-5 gap-y-4',
  angel: 'gap-x-5 gap-y-4',
  aliados: 'gap-x-10 gap-y-7'
};

function CategoryRow({ group }: { group: SponsorGroup }) {
  const size = SIZE_BY_SLUG[group.category.slug] ?? DEFAULT_SIZE;
  const gap = GAP_BY_SLUG[group.category.slug] ?? 'gap-x-7 gap-y-5';
  return (
    <Reveal>
      <div className="grid gap-5 py-7 sm:grid-cols-[160px_1fr] sm:gap-8 sm:py-9 lg:grid-cols-[180px_1fr]">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-linku-text-dim sm:pt-1">
          {group.title}
        </p>
        <div className={`flex flex-wrap items-center ${gap}`}>
          {group.logos.map((logo) =>
            logo.logoUrl ? (
              <LogoTile
                key={logo.id}
                name={logo.name}
                url={logo.logoUrl}
                href={logo.websiteUrl ?? logo.linkedinUrl}
                sizeClass={size}
              />
            ) : null
          )}
        </div>
      </div>
    </Reveal>
  );
}

function LogoTile({
  name,
  url,
  href,
  sizeClass
}: {
  name: string;
  url: string;
  href: string | null;
  sizeClass: string;
}) {
  const img = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt={name}
      title={name}
      className={`w-auto object-contain brightness-0 invert opacity-60 transition hover:opacity-100 ${sizeClass}`}
    />
  );
  if (!href) return img;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={name}>
      {img}
    </a>
  );
}
