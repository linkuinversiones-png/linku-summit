import {
  DIRECTORY_BASE_PATH,
  DIRECTORY_EVENTS,
  type DirectoryEvent
} from '@/lib/directorio/events';

export const SITE_URL = 'https://www.linkusummit.com';

/** URL absoluta de una ruta del directorio. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** URL absoluta del evento dentro del directorio. */
export function eventUrl(slug: string): string {
  return `${SITE_URL}${DIRECTORY_BASE_PATH}/${slug}`;
}

type FaqItem = { q: string; a: string };

/** JSON-LD CollectionPage para la pillar page. */
export function directoryCollectionJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  events: DirectoryEvent[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: 'es-CO',
    isPartOf: {
      '@type': 'WebSite',
      name: 'LINKU Summit',
      url: SITE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: 'LINKU Ventures',
      url: SITE_URL,
      logo: `${SITE_URL}/brand/linku-icon.png`
    },
    about: [
      'venture capital',
      'private equity',
      'family office',
      'wealth management',
      'fintech',
      'crypto',
      'real estate',
      'Latin America'
    ],
    hasPart: opts.events.map((e) => ({
      '@type': 'Article',
      name: e.nombre,
      url: eventUrl(e.slug)
    }))
  };
}

/** JSON-LD FAQPage. */
export function faqJsonLd(items: ReadonlyArray<FaqItem>) {
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

/** JSON-LD BreadcrumbList. */
export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url
    }))
  };
}

/** JSON-LD Article para una página hija de evento. */
export function eventArticleJsonLd(opts: {
  event: DirectoryEvent;
  headline: string;
  description: string;
  updated: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    url: eventUrl(opts.event.slug),
    inLanguage: 'es-CO',
    dateModified: opts.updated,
    author: {
      '@type': 'Organization',
      name: 'LINKU Ventures',
      url: SITE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: 'LINKU Ventures',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/brand/linku-icon.png` }
    },
    about: opts.event.asset_classes
  };
}

/** Lista de todos los slugs del directorio (para generateStaticParams). */
export function directorySlugs(): string[] {
  return DIRECTORY_EVENTS.map((e) => e.slug);
}
