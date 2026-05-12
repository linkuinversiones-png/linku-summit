import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import OutlineButton from '@/components/ui/OutlineButton';
import { Briefcase, Rocket, Megaphone } from 'lucide-react';

type Props = {
  contacts: { invites: string; sponsors: string; partners: string };
};

export default function ForWhom({ contacts }: Props) {
  const cards = [
    {
      icon: Briefcase,
      title: 'Inversionistas',
      lead: 'Vienes a desplegar capital.',
      bullets: [
        'Acceso curado a 30+ proyectos pre-seleccionados por el comité',
        'Salas VIP 1:1 para cierres durante todo el día',
        'Networking con 60% family offices, fund managers y HNWI',
        'Agenda de citas gestionada por la app del summit'
      ],
      cta: { label: 'Solicitar invitación', href: `mailto:${contacts.invites}?subject=Solicito invitación — Inversionista` }
    },
    {
      icon: Rocket,
      title: 'Founders y Desarrolladores',
      lead: 'Vienes a levantar capital.',
      bullets: [
        'Stand premium con tu marca y maqueta del proyecto',
        'Pitch stage con 6 founders seleccionados día 2',
        'Reuniones 1:1 con LPs activos y mandato verificado',
        'Curaduría de inversionistas alineados a tu vertical'
      ],
      cta: { label: 'Postular proyecto', href: `mailto:${contacts.invites}?subject=Postulación de proyecto — Founder` }
    },
    {
      icon: Megaphone,
      title: 'Sponsors y Aliados',
      lead: 'Vienes a posicionarte donde se mueve el capital.',
      bullets: [
        'Branding dominante en venue y comunicación',
        'Acceso al universo de inversionistas pre-evento',
        'Activaciones a medida (lounges, cocktail, kits)',
        'Co-branding en contenido post-evento'
      ],
      cta: { label: 'Hablar con el equipo', href: `mailto:${contacts.sponsors}?subject=Sponsorship — LinkU Summit 2026` }
    }
  ];

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Para quién es"
            title={
              <>
                Tres salas. Tres mandatos.
                <br />
                <span className="text-linku-coral">Una conversación.</span>
              </>
            }
            lead="Cada perfil entra al summit con un objetivo claro. Lo que une la sala es que todos vienen a ejecutar."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <article className="linku-card flex h-full flex-col p-7 sm:p-8">
                <header>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-linku-coral/10 text-linku-coral">
                    <c.icon size={20} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-2xl font-bold tracking-tightish text-linku-text">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-base font-medium text-linku-text-muted">{c.lead}</p>
                </header>
                <ul className="mt-6 flex-1 space-y-3">
                  {c.bullets.map((b) => (
                    <li
                      key={b}
                      className="relative pl-5 text-sm leading-relaxed text-linku-text-muted before:absolute before:left-0 before:top-2.5 before:h-1 before:w-1.5 before:rounded-full before:bg-linku-coral"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <OutlineButton href={c.cta.href} className="w-full">
                    {c.cta.label}
                  </OutlineButton>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
