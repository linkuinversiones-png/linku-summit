import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.linkusummit.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
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
}
