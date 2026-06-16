import EventCard from './EventCard';
import type { DirectoryEvent } from '@/lib/directorio/events';

type Props = {
  id: string;
  title: string;
  events: DirectoryEvent[];
  /** Función que construye el href de cada evento según el locale activo. */
  hrefFor: (slug: string) => string;
};

export default function CategorySection({ id, title, events, hrefFor }: Props) {
  return (
    <section aria-labelledby={`cat-${id}`} className="mt-16 sm:mt-20">
      <h2
        id={`cat-${id}`}
        className="font-bold tracking-tightish text-linku-text text-[clamp(1.6rem,3vw,2.25rem)] leading-tight"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm text-linku-text-dim">
        {events.length} {events.length === 1 ? 'evento' : 'eventos'}
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <EventCard key={e.slug} event={e} href={hrefFor(e.slug)} />
        ))}
      </div>
    </section>
  );
}
