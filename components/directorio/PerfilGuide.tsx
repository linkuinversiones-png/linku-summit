import { UserCircle2 } from 'lucide-react';
import RichText from './RichText';

type Item = { perfil: string; recomendacion: string };

type Props = {
  title: string;
  items: ReadonlyArray<Item>;
};

export default function PerfilGuide({ title, items }: Props) {
  return (
    <section aria-labelledby="perfil-guide-title" className="mt-14 sm:mt-20">
      <h2
        id="perfil-guide-title"
        className="font-bold tracking-tightish text-linku-text text-[clamp(1.6rem,3vw,2.25rem)] leading-tight"
      >
        {title}
      </h2>
      <ul className="mt-7 grid gap-4 sm:grid-cols-2">
        {items.map((it, i) => (
          <li
            key={i}
            className="rounded-2xl border border-linku-border-2 bg-white/[0.02] p-6 transition hover:border-linku-coral/40 hover:bg-linku-coral/[0.04]"
          >
            <div className="flex items-center gap-2 text-linku-coral">
              <UserCircle2 size={16} aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Perfil
              </span>
            </div>
            <p className="mt-3 text-base text-linku-text leading-relaxed sm:text-[17px]">
              <strong className="font-semibold text-linku-text">{it.perfil}:</strong>{' '}
              <span className="text-linku-text-muted">
                <RichText text={it.recomendacion} />
              </span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
