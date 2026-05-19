import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import {
  Building2,
  TrendingUp,
  BarChart3,
  Layers,
  Bitcoin,
  Palette,
  Briefcase,
  Trophy,
  Landmark,
  Sparkles,
  type LucideIcon
} from 'lucide-react';
import type { UiContent } from '@/lib/i18n/content';

type Thesis = { icon: string; title: string; desc: string };

const ICON_MAP: Record<string, LucideIcon> = {
  building: Building2,
  'trending-up': TrendingUp,
  'bar-chart': BarChart3,
  layers: Layers,
  bitcoin: Bitcoin,
  palette: Palette,
  briefcase: Briefcase,
  trophy: Trophy,
  landmark: Landmark,
  sparkles: Sparkles
};

type Props = {
  items: Thesis[];
  ui: UiContent['thesis'];
};

export default function ThesisSection({ items, ui }: Props) {
  return (
    <section id="tesis" className="relative">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow={ui.eyebrow}
            title={
              <>
                {ui.titleA}
                <br />
                <span className="text-linku-coral">{ui.titleB}</span>
              </>
            }
            lead={ui.lead}
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = ICON_MAP[item.icon] ?? Sparkles;
            return (
              <Reveal key={item.title} delay={i * 0.05}>
                <article className="linku-card flex h-full flex-col p-7 sm:p-8">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linku-coral/10 text-linku-coral">
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-xl font-bold tracking-tightish text-linku-text">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-linku-text-muted sm:text-base">
                    {item.desc}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
