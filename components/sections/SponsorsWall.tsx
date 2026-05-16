import Reveal from '@/components/ui/Reveal';
import { getSponsorGroups, type SponsorGroup } from '@/lib/sponsors-storage';
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

function CategoryRow({ group }: { group: SponsorGroup }) {
  return (
    <Reveal>
      <div className="grid gap-5 py-7 sm:grid-cols-[160px_1fr] sm:gap-8 sm:py-9 lg:grid-cols-[180px_1fr]">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-linku-text-dim sm:pt-1">
          {group.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-5">
          {group.logos.map((logo) => (
            <LogoTile key={logo.url} name={logo.name} url={logo.url} />
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function LogoTile({ name, url }: { name: string; url: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt={name}
      title={name}
      className="h-8 w-auto max-w-[120px] object-contain brightness-0 invert opacity-60 transition hover:opacity-100 sm:h-9"
    />
  );
}
