import Link from 'next/link';
import { ArrowUpRight, Calendar, MapPin } from 'lucide-react';
import type { DirectoryEvent } from '@/lib/directorio/events';

type Props = {
  event: DirectoryEvent;
  /** URL relativa al directorio actual (con o sin prefijo de locale). */
  href: string;
};

export default function EventCard({ event, href }: Props) {
  const { nombre, hook, donde, cuando, asset_classes, datos_clave, posiciona_por, published } =
    event;
  return (
    <article className="group flex flex-col rounded-2xl border border-linku-border-2 bg-white/[0.02] p-6 transition hover:border-linku-coral/40 hover:bg-linku-coral/[0.04] sm:p-7">
      <header>
        <h3 className="text-lg font-bold tracking-tight text-linku-text sm:text-xl">
          <Link
            href={href}
            className="hover:text-linku-coral focus:outline-none focus:text-linku-coral"
          >
            {nombre}
          </Link>
        </h3>
        <p className="mt-3 text-sm text-linku-text-muted leading-relaxed sm:text-[15px]">
          {hook}
        </p>
      </header>

      <dl className="mt-5 space-y-2 text-sm text-linku-text-muted">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="mt-[3px] shrink-0 text-linku-text-dim" aria-hidden />
          <dt className="sr-only">Sede</dt>
          <dd>{donde}</dd>
        </div>
        <div className="flex items-start gap-2">
          <Calendar size={14} className="mt-[3px] shrink-0 text-linku-text-dim" aria-hidden />
          <dt className="sr-only">Fecha</dt>
          <dd>{cuando}</dd>
        </div>
      </dl>

      <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Clases de activo">
        {asset_classes.map((c) => (
          <li
            key={c}
            className="rounded-full border border-linku-border-2 bg-linku-bg/40 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-linku-text-muted"
          >
            {c}
          </li>
        ))}
      </ul>

      <p className="mt-5 text-sm text-linku-text-muted leading-relaxed">
        <span className="font-semibold text-linku-text">Datos clave:</span> {datos_clave}
      </p>

      {posiciona_por.length > 0 && (
        <p className="mt-4 text-xs text-linku-text-dim leading-relaxed">
          <span className="font-semibold uppercase tracking-[0.16em] text-linku-text-dim/80">
            Posiciona por:
          </span>{' '}
          {posiciona_por.join(' · ')}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 pt-5 border-t border-linku-border">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-linku-coral transition hover:text-linku-coral-soft"
        >
          {published ? 'Leer el artículo completo' : 'Ver ficha del evento'}
          <ArrowUpRight size={14} aria-hidden />
        </Link>
        {!published && (
          <span className="rounded-full border border-linku-border-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-linku-text-dim">
            Próximamente
          </span>
        )}
      </div>
    </article>
  );
}
