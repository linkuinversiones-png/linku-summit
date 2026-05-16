import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import SpeakerCard from '@/components/ui/SpeakerCard';
import type { UiContent } from '@/lib/i18n/content';
import type { PublicSpeaker } from '@/lib/speakers';

type Props = {
  speakers: PublicSpeaker[];
  ui: UiContent['speakers'];
};

export default function Speakers({ speakers, ui }: Props) {
  if (!speakers || speakers.length === 0) {
    return (
      <section id="speakers" className="relative">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <SectionHeading
            eyebrow={ui.eyebrow}
            title={ui.empty.title}
            lead={ui.empty.lead}
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
            eyebrow={ui.eyebrow}
            title={
              <>
                {confirmedCount}+ {ui.titleA}
                <br />
                <span className="text-linku-coral">{ui.titleB}</span>
              </>
            }
            lead={ui.lead}
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {speakers.map((s, i) => (
            <Reveal key={s.id} delay={(i % 4) * 0.05}>
              <SpeakerCard speaker={s} tbdLabel={ui.placeholderTBD} />
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-linku-text-muted">
          {ui.more}
        </p>
      </div>
    </section>
  );
}
