import Reveal from '@/components/ui/Reveal';
import PartnerLogo from '@/components/ui/PartnerLogo';
import type { UiContent } from '@/lib/i18n/content';

type Partner = { id: string; name: string; logo: string };

type Props = {
  partners: Partner[];
  ui: UiContent['partners'];
};

export default function Partners({ partners, ui }: Props) {
  if (!partners || partners.length === 0) return null;

  return (
    <section className="relative border-y border-linku-border bg-linku-bg">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
            {ui.eyebrow}
          </p>
          <h3 className="mt-4 text-center text-2xl font-bold tracking-tightish text-linku-text sm:text-3xl">
            {ui.title}
          </h3>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 items-center gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-7">
          {partners.map((p, i) => (
            <Reveal key={p.id} delay={(i % 7) * 0.04}>
              <PartnerLogo name={p.name} logo={p.logo} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
