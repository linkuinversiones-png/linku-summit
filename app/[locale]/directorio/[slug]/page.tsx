import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { localizePath, type Locale } from '@/lib/i18n/config';
import JsonLd from '@/components/seo/JsonLd';
import {
  DIRECTORY_BASE_PATH,
  DIRECTORY_CATEGORIES,
  getEventBySlug
} from '@/lib/directorio/events';
import {
  SITE_URL,
  absoluteUrl,
  breadcrumbJsonLd,
  directorySlugs,
  eventArticleJsonLd,
  eventUrl,
  faqJsonLd
} from '@/lib/directorio/seo';
import { DIRECTORY_INDEX_COPY } from '@/lib/directorio/content';
import { loadEvento } from '@/lib/directorio/loadEvento';
import Breadcrumbs from '@/components/directorio/Breadcrumbs';
import DirectoryCTA from '@/components/directorio/DirectoryCTA';
import Pill from '@/components/ui/Pill';
import Markdown from '@/components/directorio/Markdown';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return directorySlugs().map((slug) => ({ slug }));
}

export function generateMetadata({
  params
}: {
  params: { locale: Locale; slug: string };
}): Metadata {
  const evt = getEventBySlug(params.slug);
  if (!evt) {
    return { title: 'Evento no encontrado | LINKU Summit' };
  }

  const doc = evt.published ? loadEvento(evt.slug) : null;

  const title =
    doc?.frontmatter.title ?? `${evt.nombre} — Ficha y guía | Directorio LINKU Summit`;
  const description =
    doc?.frontmatter.description ?? truncate(`${evt.hook} ${evt.donde} · ${evt.cuando}.`, 155);
  const keywordsStr = doc?.frontmatter.keywords ?? evt.posiciona_por.join(', ');
  const keywords = keywordsStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords,
    authors: [{ name: 'LINKU Ventures' }],
    alternates: { canonical: eventUrl(evt.slug) },
    openGraph: {
      type: 'article',
      locale: 'es_CO',
      url: eventUrl(evt.slug),
      siteName: 'LINKU Summit',
      title,
      description,
      images: [{ url: '/og/og-image.jpg', width: 1200, height: 630, alt: evt.nombre }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og/og-image.jpg']
    },
    robots: evt.published ? undefined : { index: false, follow: true }
  };
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…';
}

export default function DirectorioEventoPage({
  params
}: {
  params: { locale: Locale; slug: string };
}) {
  const evt = getEventBySlug(params.slug);
  if (!evt) notFound();

  const directorioBase = localizePath(DIRECTORY_BASE_PATH, params.locale);
  const categoria = DIRECTORY_CATEGORIES[evt.category];
  const doc = evt.published ? loadEvento(evt.slug) : null;

  const headline = doc?.h1 || `${evt.nombre} — Guía 2026`;
  const description = doc?.frontmatter.description || evt.hook;
  const updated = doc?.frontmatter.updated || DIRECTORY_INDEX_COPY.meta.updated;

  const articleLd = eventArticleJsonLd({
    event: evt,
    headline,
    description,
    updated
  });
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'LINKU Summit', url: SITE_URL },
    { name: 'Directorio', url: absoluteUrl(DIRECTORY_BASE_PATH) },
    { name: evt.nombre, url: eventUrl(evt.slug) }
  ]);
  const faqLd = doc && doc.faqs.length > 0 ? faqJsonLd(doc.faqs) : null;

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      {faqLd && <JsonLd data={faqLd} />}

      <section className="relative overflow-hidden border-b border-linku-border bg-linku-bg pt-32 sm:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[440px] bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,107,71,0.14),transparent_70%)]"
        />
        <div className="mx-auto max-w-4xl px-5 pb-14 sm:px-8 sm:pb-20">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: localizePath('/', params.locale) },
              { label: 'Directorio', href: directorioBase },
              { label: evt.nombre }
            ]}
          />
          <div className="mt-6">
            <Pill pulse={false}>{categoria}</Pill>
          </div>
          <h1 className="mt-5 font-bold tracking-tightish text-linku-text text-[clamp(2rem,4vw,3.2rem)] leading-[1.05]">
            {headline}
          </h1>
          <dl className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-4 max-w-2xl">
            <div className="flex items-start gap-2 text-sm text-linku-text">
              <MapPin size={16} className="mt-[3px] shrink-0 text-linku-coral" aria-hidden />
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-linku-text-dim">
                  Sede
                </dt>
                <dd className="mt-1 text-linku-text-muted">{evt.donde}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm text-linku-text">
              <Calendar size={16} className="mt-[3px] shrink-0 text-linku-coral" aria-hidden />
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-linku-text-dim">
                  Fechas
                </dt>
                <dd className="mt-1 text-linku-text-muted">{evt.cuando}</dd>
              </div>
            </div>
          </dl>
          <ul
            className="mt-6 flex flex-wrap gap-1.5"
            aria-label="Clases de activo del evento"
          >
            {evt.asset_classes.map((c) => (
              <li
                key={c}
                className="rounded-full border border-linku-border-2 bg-linku-bg/40 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-linku-text-muted"
              >
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-linku-text-dim">
            Actualizado: {formatDate(updated)} · Por LINKU Ventures
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-5 pb-24 sm:px-8 sm:pb-32">
        {doc ? (
          <div className="pt-12">
            <Markdown source={doc.body} />
          </div>
        ) : (
          <section
            aria-labelledby="proximamente-title"
            className="mt-12 rounded-2xl border border-linku-coral/30 bg-linku-coral/[0.04] p-6 sm:p-8"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-linku-coral">
              Próximamente
            </div>
            <h2
              id="proximamente-title"
              className="mt-3 text-xl font-bold tracking-tightish text-linku-text sm:text-2xl"
            >
              Artículo en preparación
            </h2>
            <p className="mt-4 text-base text-linku-text-muted leading-relaxed">
              Estamos publicando los artículos en profundidad de cada evento del directorio. La
              guía completa de <strong className="text-linku-text">{evt.nombre}</strong> se
              publica en las próximas semanas.
            </p>
            <div className="mt-6">
              <Link
                href={directorioBase}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-linku-coral transition hover:text-linku-coral-soft"
              >
                ← Volver al directorio
              </Link>
            </div>
          </section>
        )}

        <section aria-labelledby="posicionamiento-title" className="mt-14">
          <h2
            id="posicionamiento-title"
            className="text-lg font-bold tracking-tightish text-linku-text sm:text-xl"
          >
            Cómo se busca este evento
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {evt.posiciona_por.map((k) => (
              <li
                key={k}
                className="rounded-full border border-linku-border-2 bg-linku-bg/40 px-3 py-1 text-xs text-linku-text-muted"
              >
                {k}
              </li>
            ))}
          </ul>
        </section>

        <DirectoryCTA
          eyebrow={DIRECTORY_INDEX_COPY.cta.eyebrow}
          title={DIRECTORY_INDEX_COPY.cta.title}
          body={DIRECTORY_INDEX_COPY.cta.body}
          primaryLabel={DIRECTORY_INDEX_COPY.cta.primaryLabel}
          primaryHref={`${localizePath('/', params.locale)}#tickets`}
          secondaryLabel="Volver al directorio"
          secondaryHref={directorioBase}
        />
      </article>
    </>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
}
