import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { Calendar, MapPin, Users, Layers } from 'lucide-react';

type Props = {
  about: { title: string; lead: string; body: string };
  site: {
    dateLabel: string;
    city: string;
    venue: string;
  };
};

export default function About({ about, site }: Props) {
  const facts = [
    { icon: Calendar, label: 'Fecha', value: 'Octubre 2026' },
    { icon: MapPin, label: 'Ciudad', value: `${site.city}, Colombia` },
    { icon: Users, label: 'Asistentes', value: '300+ por invitación' },
    { icon: Layers, label: 'Asset classes', value: '6 en la misma sala' }
  ];

  return (
    <section id="evento" className="relative">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="El evento"
              title={
                <>
                  No es un evento masivo.
                  <br />
                  <span className="text-linku-coral">Es una sala curada.</span>
                </>
              }
            />
            <p className="mt-6 text-lg leading-relaxed text-linku-text">{about.lead}</p>
            <p className="mt-5 text-base leading-relaxed text-linku-text-muted sm:text-lg">
              {about.body}
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="linku-card p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
                Datos clave
              </p>
              <dl className="mt-6 space-y-5">
                {facts.map((f) => (
                  <div key={f.label} className="flex items-center gap-4 border-b border-linku-border pb-5 last:border-0 last:pb-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linku-coral/10 text-linku-coral">
                      <f.icon size={18} strokeWidth={1.75} />
                    </span>
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium uppercase tracking-wider text-linku-text-dim">
                        {f.label}
                      </dt>
                      <dd className="mt-0.5 text-base font-semibold text-linku-text">
                        {f.value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
