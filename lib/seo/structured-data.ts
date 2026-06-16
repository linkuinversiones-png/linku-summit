import type { Locale } from '@/lib/i18n/config';

const SITE_URL = 'https://www.linkusummit.com';

type SiteData = {
  eventName: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  venue: string;
  tagline: string;
};

type TicketTier = {
  id: string;
  name: string;
  price: string;
  ctaHref: string;
};

type FaqItem = { q: string; a: string };

export function eventJsonLd(site: SiteData, tiers: TicketTier[], locale: Locale) {
  const url = locale === 'es' ? SITE_URL : `${SITE_URL}/${locale}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: site.eventName,
    description: site.tagline,
    startDate: site.startDate,
    endDate: site.endDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: site.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: site.city,
        addressCountry: site.country
      }
    },
    image: [`${SITE_URL}/og/og-image.jpg`],
    organizer: {
      '@type': 'Organization',
      name: 'LinkU Ventures',
      url: SITE_URL
    },
    offers: tiers.map((t) => ({
      '@type': 'Offer',
      name: t.name,
      price: t.price,
      priceCurrency: 'COP',
      url: `${url}#tickets`,
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString()
    })),
    inLanguage: locale === 'es' ? 'es-CO' : 'en'
  };
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.a
      }
    }))
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LinkU Ventures',
    url: SITE_URL,
    logo: `${SITE_URL}/brand/linku-icon.png`,
    sameAs: [
      'https://instagram.com/linkuventures',
      'https://linkedin.com/company/linkuventures'
    ]
  };
}
