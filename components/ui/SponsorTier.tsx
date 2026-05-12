import { Check } from 'lucide-react';
import CoralButton from './CoralButton';
import OutlineButton from './OutlineButton';

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

export default function SponsorTier({ tier }: { tier: Tier }) {
  return (
    <article
      className={`linku-card relative flex h-full flex-col p-7 sm:p-8 ${
        tier.highlight ? 'linku-card-coral' : ''
      }`}
    >
      {tier.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-linku-coral px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-coral-glow">
          {tier.badge}
        </span>
      )}
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
          {tier.label}
        </p>
        <h3 className="mt-2 text-2xl font-bold tracking-tightish text-linku-text sm:text-3xl">
          {tier.name}
        </h3>
        <p className="mt-3 text-lg font-semibold text-linku-text">{tier.price}</p>
        {tier.priceNote && (
          <p className="mt-1 text-xs text-linku-text-muted">{tier.priceNote}</p>
        )}
      </header>
      <ul className="mt-6 flex-1 space-y-3">
        {tier.benefits.map((b) => (
          <li key={b} className="flex items-start gap-3 text-sm text-linku-text-muted">
            <Check size={16} className="mt-0.5 shrink-0 text-linku-coral" strokeWidth={2.25} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7">
        {tier.highlight ? (
          <CoralButton href={tier.ctaHref} className="w-full">
            {tier.ctaLabel}
          </CoralButton>
        ) : (
          <OutlineButton href={tier.ctaHref} className="w-full">
            {tier.ctaLabel}
          </OutlineButton>
        )}
      </div>
    </article>
  );
}
