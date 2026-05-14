import Image from 'next/image';
import { Instagram, Linkedin, Mail } from 'lucide-react';
import type { UiContent } from '@/lib/i18n/content';

type Props = {
  site: {
    eventName: string;
    contacts: { sponsors: string; invites: string; partners: string };
    social: { instagram: string; linkedin: string; website: string };
  };
  ui: UiContent['footer'];
};

export default function Footer({ site, ui }: Props) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-linku-border bg-linku-bg">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/brand/linku-icon.png"
                alt="LinkU"
                width={80}
                height={80}
                className="h-10 w-10"
              />
              <span className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tightish text-linku-text">
                  LINKU <span className="text-linku-coral">SUMMIT</span>
                </span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-linku-coral/70">
                  {ui.poweredBy}
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-linku-text-muted">
              {site.eventName} {ui.tagline}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-text-dim">
              {ui.contactTitle}
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${site.contacts.invites}`}
                  className="flex items-center gap-2 text-linku-text-muted transition hover:text-linku-coral"
                >
                  <Mail size={14} /> {site.contacts.invites}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.contacts.sponsors}`}
                  className="flex items-center gap-2 text-linku-text-muted transition hover:text-linku-coral"
                >
                  <Mail size={14} /> {site.contacts.sponsors}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.contacts.partners}`}
                  className="flex items-center gap-2 text-linku-text-muted transition hover:text-linku-coral"
                >
                  <Mail size={14} /> {site.contacts.partners}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-text-dim">
              {ui.socialTitle}
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href={site.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-linku-text-muted transition hover:text-linku-coral"
                >
                  <Instagram size={14} /> Instagram
                </a>
              </li>
              <li>
                <a
                  href={site.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-linku-text-muted transition hover:text-linku-coral"
                >
                  <Linkedin size={14} /> LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-linku-border pt-6 text-xs text-linku-text-dim sm:flex-row sm:items-center">
          <span>© {year} LinkU Ventures. {ui.rights}</span>
          <span>{ui.madeIn}</span>
        </div>
      </div>
    </footer>
  );
}
