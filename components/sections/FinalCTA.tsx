import Reveal from '@/components/ui/Reveal';
import Pill from '@/components/ui/Pill';
import CoralButton from '@/components/ui/CoralButton';
import OutlineButton from '@/components/ui/OutlineButton';
import { ArrowRight } from 'lucide-react';

type Cta = { label: string; href: string };

type Props = {
  finalCTA: {
    eyebrow: string;
    title: string;
    highlight: string;
    lead: string;
    primaryCta: Cta;
    secondaryCta: Cta;
  };
};

export default function FinalCTA({ finalCTA }: Props) {
  return (
    <section className="relative overflow-hidden bg-linku-bg-2/40">
      <div className="absolute inset-0 bg-section-glow opacity-90" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-px bg-coral-divider" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-px bg-coral-divider" aria-hidden />

      <div className="relative mx-auto max-w-5xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <Reveal>
          <div className="mb-6 flex justify-center">
            <Pill>{finalCTA.eyebrow}</Pill>
          </div>

          <h2 className="font-bold tracking-tighter2 text-linku-text leading-[1.05] text-[clamp(2.5rem,7vw,5.5rem)]">
            {finalCTA.title}
            <br />
            <span className="text-linku-coral">{finalCTA.highlight}</span>
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-base text-linku-text-muted sm:text-lg lg:text-xl leading-relaxed">
            {finalCTA.lead}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <CoralButton href={finalCTA.primaryCta.href} size="lg">
              {finalCTA.primaryCta.label} <ArrowRight size={16} />
            </CoralButton>
            <OutlineButton href={finalCTA.secondaryCta.href} size="lg">
              {finalCTA.secondaryCta.label}
            </OutlineButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
