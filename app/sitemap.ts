import type { MetadataRoute } from 'next';
import { DIRECTORY_EVENTS } from '@/lib/directorio/events';

const SITE_URL = 'https://linkusummit.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const homes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          'es-CO': SITE_URL,
          en: `${SITE_URL}/en`,
          'x-default': SITE_URL
        }
      }
    },
    {
      url: `${SITE_URL}/en`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          'es-CO': SITE_URL,
          en: `${SITE_URL}/en`,
          'x-default': SITE_URL
        }
      }
    }
  ];

  const directorioIndex: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/directorio`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8
    }
  ];

  // Solo indexamos las fichas publicadas. Las pendientes salen del sitemap
  // y declaran robots noindex en su metadata hasta que se publique el artículo.
  const directorioEventos: MetadataRoute.Sitemap = DIRECTORY_EVENTS.filter(
    (e) => e.published
  ).map((e) => ({
    url: `${SITE_URL}/directorio/${e.slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7
  }));

  return [...homes, ...directorioIndex, ...directorioEventos];
}
