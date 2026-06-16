import CoralButton from '@/components/ui/CoralButton';
import OutlineButton from '@/components/ui/OutlineButton';

type Props = {
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export default function DirectoryCTA({
  eyebrow,
  title,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref
}: Props) {
  return (
    <section
      aria-labelledby="dir-cta-title"
      className="mt-20 rounded-3xl border border-linku-coral/30 bg-linku-coral/[0.06] p-7 sm:mt-24 sm:p-12"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-linku-coral">
        {eyebrow}
      </div>
      <h2
        id="dir-cta-title"
        className="mt-4 font-bold tracking-tightish text-linku-text text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight"
      >
        {title}
      </h2>
      <p className="mt-5 max-w-3xl text-base text-linku-text-muted leading-relaxed sm:text-lg">
        {body}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <CoralButton href={primaryHref} size="lg">
          {primaryLabel}
        </CoralButton>
        <OutlineButton href={secondaryHref} size="lg">
          {secondaryLabel}
        </OutlineButton>
      </div>
    </section>
  );
}
