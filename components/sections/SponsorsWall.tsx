import SectionHeading from '@/components/ui/SectionHeading';
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
        <Reveal>
          <SectionHeading eyebrow={copy.eyebrow} title={copy.title} />
        </Reveal>

        <div className="mt-14 divide-y divide-linku-border border-t border-linku-border">
          {tiers.map((group) => (
            <CategoryRow key={group.category.slug} group={group} />
          ))}
        </div>

        {aliados && (
          <div className="mt-16 border-t border-linku-border-2 pt-4">
            <div className="divide-y divide-linku-border">
              <CategoryRow group={aliados} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CategoryRow({ group }: { group: SponsorGroup }) {
  return (
    <Reveal>
      <div className="grid gap-6 py-8 sm:grid-cols-[180px_1fr] sm:gap-10 sm:py-10 lg:grid-cols-[220px_1fr]">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-linku-text-dim sm:pt-1">
          {group.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
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
      className="h-8 w-auto max-w-[140px] object-contain brightness-0 invert opacity-60 transition hover:opacity-100 sm:h-10"
    />
  );
}
