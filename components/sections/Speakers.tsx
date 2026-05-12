import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import SpeakerCard from '@/components/ui/SpeakerCard';

type Speaker = {
  id: string;
  name: string;
  role: string;
  company: string;
  track: string;
  avatar: string | null;
  confirmed: boolean;
};

export default function Speakers({ speakers }: { speakers: Speaker[] }) {
  if (!speakers || speakers.length === 0) {
    return (
      <section id="speakers" className="relative">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <SectionHeading
            eyebrow="Speakers"
            title="Anunciamos speakers pronto."
            lead="Estamos cerrando el line-up. Si quieres ser de los primeros en saber quién sube al escenario, solicita tu invitación."
          />
        </div>
      </section>
    );
  }

  const confirmedCount = speakers.filter((s) => s.confirmed).length;

  return (
    <section id="speakers" className="relative bg-linku-bg-2/40">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Speakers"
            title={
              <>
                {confirmedCount}+ voces que están
                <br />
                <span className="text-linku-coral">moviendo capital hoy.</span>
              </>
            }
            lead="Fund managers activos, family offices, founders en ronda y operadores de los activos que están definiendo Latam."
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {speakers.map((s, i) => (
            <Reveal key={s.id} delay={(i % 4) * 0.05}>
              <SpeakerCard speaker={s} />
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-linku-text-muted">
          + speakers adicionales por confirmar.
        </p>
      </div>
    </section>
  );
}
