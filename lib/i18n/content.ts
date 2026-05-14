import esSite from '@/content/es/site.json';
import esSpeakers from '@/content/es/speakers.json';
import esSponsors from '@/content/es/sponsors.json';
import esPartners from '@/content/es/partners.json';
import esAgenda from '@/content/es/agenda.json';
import esTickets from '@/content/es/tickets.json';
import esFaq from '@/content/es/faq.json';
import esUi from '@/content/es/ui.json';

import enSite from '@/content/en/site.json';
import enSpeakers from '@/content/en/speakers.json';
import enSponsors from '@/content/en/sponsors.json';
import enPartners from '@/content/en/partners.json';
import enAgenda from '@/content/en/agenda.json';
import enTickets from '@/content/en/tickets.json';
import enFaq from '@/content/en/faq.json';
import enUi from '@/content/en/ui.json';

import type { Locale } from '@/lib/i18n/config';

export type SiteContent = typeof esSite;
export type SpeakersContent = typeof esSpeakers;
export type SponsorsContent = typeof esSponsors;
export type PartnersContent = typeof esPartners;
export type AgendaContent = typeof esAgenda;
export type TicketsContent = typeof esTickets;
export type FaqContent = typeof esFaq;
export type UiContent = typeof esUi;

const BUNDLES = {
  es: {
    site: esSite,
    speakers: esSpeakers,
    sponsors: esSponsors,
    partners: esPartners,
    agenda: esAgenda,
    tickets: esTickets,
    faq: esFaq,
    ui: esUi
  },
  en: {
    site: enSite,
    speakers: enSpeakers,
    sponsors: enSponsors,
    partners: enPartners,
    agenda: enAgenda,
    tickets: enTickets,
    faq: enFaq,
    ui: enUi
  }
} as const;

export function getContent(locale: Locale) {
  return BUNDLES[locale];
}
