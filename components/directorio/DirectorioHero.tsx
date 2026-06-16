import Pill from '@/components/ui/Pill';
import RichText from './RichText';

type Props = {
  eyebrow: string;
  h1: string;
  answerFirst: string;
  updated: string;
};

export default function DirectorioHero({ eyebrow, h1, answerFirst, updated }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-linku-border bg-linku-bg pt-32 sm:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,107,71,0.16),transparent_70%)]"
      />
      <div className="mx-auto max-w-5xl px-5 pb-16 sm:px-8 sm:pb-20">
        <Pill pulse={false}>{eyebrow}</Pill>
        <h1 className="mt-6 font-bold tracking-tightish text-linku-text text-[clamp(2.2rem,4.4vw,3.6rem)] leading-[1.05]">
          {h1}
        </h1>
        <p className="mt-6 max-w-3xl text-base text-linku-text-muted sm:text-lg leading-relaxed">
          <RichText text={answerFirst} />
        </p>
        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-linku-text-dim">
          Actualizado: {formatDate(updated)} · Por LINKU Ventures
        </p>
      </div>
    </section>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
}
