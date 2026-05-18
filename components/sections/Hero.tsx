import Pill from '@/components/ui/Pill';
import AssetClassPill from '@/components/ui/AssetClassPill';
import CoralButton from '@/components/ui/CoralButton';
import OutlineButton from '@/components/ui/OutlineButton';
import Countdown from '@/components/ui/Countdown';
import { ArrowRight, MapPin } from 'lucide-react';
import type { UiContent } from '@/lib/i18n/content';

type Props = {
  site: {
    eventName: string;
    tagline: string;
    heroLead: string;
    dateLabel: string;
    heroPill: string;
    startDate: string;
    contacts: { invites: string };
  };
  ui: UiContent['hero'];
  countdownLabels: UiContent['countdown'];
};

export default function Hero({ site, ui, countdownLabels }: Props) {
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-36 lg:pt-44">
      <div
        className="pointer-events-none absolute inset-0 bg-hero-glow opacity-90"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at top, black, transparent 70%)'
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-5 pb-20 sm:px-8 sm:pb-28 lg:pb-36">
        <div className="flex flex-col gap-8">
          <div>
            <Pill>{site.heroPill}</Pill>
          </div>

          <h1 className="font-bold tracking-tighter2 text-linku-text leading-[0.95] text-[clamp(2.75rem,9vw,7rem)]">
            LINKU <span className="text-linku-coral">SUMMIT</span>
            <br />
            2026
          </h1>

          <p className="max-w-3xl text-base text-linku-text-muted sm:text-xl lg:text-2xl leading-relaxed">
            {site.tagline}.
          </p>

          <p className="max-w-3xl text-sm text-linku-text-dim sm:text-base lg:text-lg leading-relaxed">
            {site.heroLead}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-linku-text-muted">
            <MapPin size={16} className="text-linku-coral" />
            <span className="text-linku-text">{site.dateLabel}</span>
          </div>

          <div className="mt-2">
            <Countdown targetDate={site.startDate} labels={countdownLabels} />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <CoralButton href="#tickets" size="lg">
              {ui.ctaBuy} <ArrowRight size={16} />
            </CoralButton>
            <OutlineButton href="#agenda" size="lg">
              {ui.ctaInvite}
            </OutlineButton>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {ui.assetClasses.map((c) => (
              <AssetClassPill key={c} label={c} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
