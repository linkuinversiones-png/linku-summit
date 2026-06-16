import type { Metadata } from 'next';
import { DEFAULT_LOCALE, isLocale, localizePath, type Locale } from '@/lib/i18n/config';
import JsonLd from '@/components/seo/JsonLd';
import {
  DIRECTORY_BASE_PATH,
  DIRECTORY_EVENTS,
  eventsByCategory
} from '@/lib/directorio/events';
import {
  SITE_URL,
  absoluteUrl,
  breadcrumbJsonLd,
  directoryCollectionJsonLd,
  faqJsonLd
} from '@/lib/directorio/seo';
import { DIRECTORY_INDEX_COPY } from '@/lib/directorio/content';
import DirectorioHero from '@/components/directorio/DirectorioHero';
import TldrBox from '@/components/directorio/TldrBox';
import PerfilGuide from '@/components/directorio/PerfilGuide';
import CategorySection from '@/components/directorio/CategorySection';
import DirectoryFAQ from '@/components/directorio/DirectoryFAQ';
import DirectoryCTA from '@/components/directorio/DirectoryCTA';
import Breadcrumbs from '@/components/directorio/Breadcrumbs';
import RichText from '@/components/directorio/RichText';

export const dynamic = 'force-static';

const COPY = DIRECTORY_INDEX_COPY;

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: COPY.meta.title,
    description: COPY.meta.description,
    keywords: [
      'directorio de eventos de capital Latam',
      'eventos de inversión Latinoamérica 2026',
      'eventos de capital privado Colombia',
      'eventos venture capital Latam',
      'eventos family office Latinoamérica',
      'conferencias fintech Latam 2026',
      'eventos cripto Latinoamérica',
      'eventos de inversión Medellín',
      'summit de inversión multi-activo',
      'wealth management eventos Latam'
    ],
    authors: [{ name: 'LINKU Ventures' }],
    alternates: {
      canonical: COPY.meta.canonical
    },
    openGraph: {
      type: 'article',
      locale: 'es_CO',
      url: COPY.meta.canonical,
      siteName: 'LINKU Summit',
      title: COPY.meta.title,
      description: COPY.meta.description,
      images: [
        {
          url: '/og/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Directorio LINKU Summit'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: COPY.meta.title,
      description: COPY.meta.description,
      images: ['/og/og-image.jpg']
    }
  };
}

export default async function DirectorioPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await props.params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const groups = eventsByCategory();
  const directorioBase = localizePath(DIRECTORY_BASE_PATH, locale);
  const hrefFor = (slug: string) => `${directorioBase}/${slug}`;

  const collectionLd = directoryCollectionJsonLd({
    name: COPY.meta.title,
    description: COPY.meta.description,
    url: COPY.meta.canonical,
    events: DIRECTORY_EVENTS
  });
  const faqLd = faqJsonLd(COPY.faq.items);
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'LINKU Summit', url: SITE_URL },
    { name: 'Directorio', url: absoluteUrl(DIRECTORY_BASE_PATH) }
  ]);

  return (
    <>
      <JsonLd data={collectionLd} />
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />

      <DirectorioHero
        eyebrow={COPY.eyebrow}
        h1={COPY.h1}
        answerFirst={COPY.answer_first}
        updated={COPY.meta.updated}
      />

      <article className="mx-auto max-w-5xl px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="pt-10">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: localizePath('/', locale) },
              { label: 'Directorio' }
            ]}
          />
        </div>

        <div className="mt-10">
          <TldrBox>{COPY.tldr}</TldrBox>
        </div>

        <section aria-labelledby="porque-title" className="mt-14 sm:mt-20">
          <h2
            id="porque-title"
            className="font-bold tracking-tightish text-linku-text text-[clamp(1.6rem,3vw,2.25rem)] leading-tight"
          >
            {COPY.porque.title}
          </h2>
          <div className="mt-6 space-y-5 text-base text-linku-text-muted leading-relaxed sm:text-lg">
            {COPY.porque.body.map((p, i) => (
              <p key={i}>
                <RichText text={p} />
              </p>
            ))}
          </div>
        </section>

        <PerfilGuide title={COPY.perfil_guide.title} items={COPY.perfil_guide.items} />

        {groups.map((g) => (
          <CategorySection
            key={g.category}
            id={g.category}
            title={g.title}
            events={g.events}
            hrefFor={hrefFor}
          />
        ))}

        <section aria-labelledby="conexion-title" className="mt-16 sm:mt-20">
          <h2
            id="conexion-title"
            className="font-bold tracking-tightish text-linku-text text-[clamp(1.6rem,3vw,2.25rem)] leading-tight"
          >
            {COPY.conexion_linku.title}
          </h2>
          <p className="mt-5 max-w-3xl text-base text-linku-text-muted leading-relaxed sm:text-lg">
            <RichText text={COPY.conexion_linku.body} />
          </p>
        </section>

        <DirectoryFAQ title={COPY.faq.title} items={COPY.faq.items} />

        <DirectoryCTA
          eyebrow={COPY.cta.eyebrow}
          title={COPY.cta.title}
          body={COPY.cta.body}
          primaryLabel={COPY.cta.primaryLabel}
          primaryHref={`${localizePath('/', locale)}#tickets`}
          secondaryLabel={COPY.cta.secondaryLabel}
          secondaryHref={localizePath('/', locale)}
        />

        <p className="mt-12 text-xs text-linku-text-dim leading-relaxed">{COPY.footer}</p>
      </article>
    </>
  );
}
