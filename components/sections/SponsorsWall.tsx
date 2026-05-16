import Image from 'next/image';
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

        <div className="mt-14 space-y-12">
          {tiers.map((group) => (
            <CategoryBlock key={group.category.slug} group={group} />
          ))}
        </div>

        {aliados && (
          <>
            <div className="mt-20 mb-12 border-t border-linku-border" aria-hidden />
            <CategoryBlock group={aliados} />
          </>
        )}
      </div>
    </section>
  );
}

function CategoryBlock({ group }: { group: SponsorGroup }) {
  return (
    <Reveal>
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-linku-text-dim">
        {group.title}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {group.logos.map((logo) => (
          <LogoTile key={logo.url} name={logo.name} url={logo.url} />
        ))}
      </div>
    </Reveal>
  );
}

function LogoTile({ name, url }: { name: string; url: string }) {
  return (
    <div
      className="group relative flex aspect-[3/2] items-center justify-center border border-linku-border bg-linku-bg-2/60 px-6 py-5 transition hover:border-linku-coral/40 hover:bg-linku-bg-2"
      title={name}
    >
      <Image
        src={url}
        alt={name}
        fill
        sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
        className="object-contain p-6 brightness-0 invert opacity-70 transition group-hover:opacity-100"
      />
    </div>
  );
}
