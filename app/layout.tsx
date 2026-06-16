import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter } from 'next/font/google';
import './globals.css';
import { DEFAULT_LOCALE, HTML_LANG, isLocale, type Locale } from '@/lib/i18n/config';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const SITE_URL = 'https://www.linkusummit.com';

const META: Record<Locale, { title: string; description: string; ogLocale: string }> = {
  es: {
    title: 'LINKU SUMMIT 2026 — La cumbre de inversión multi-activo en Medellín',
    description:
      'Octubre 2026 · Medellín. Dos días para entender cómo se mueve el capital en Latinoamérica. Seis clases de activo en una sola conversación.',
    ogLocale: 'es_CO'
  },
  en: {
    title: 'LINKU SUMMIT 2026 — The multi-asset investment summit in Medellín',
    description:
      'October 2026 · Medellín. Two days to understand how capital moves across Latin America. Six asset classes in one conversation.',
    ogLocale: 'en_US'
  }
};

async function readLocale(): Promise<Locale> {
  const raw = (await headers()).get('x-locale');
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocale();
  const m = META[locale];
  const url = locale === DEFAULT_LOCALE ? SITE_URL : `${SITE_URL}/${locale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: m.title,
    description: m.description,
    keywords: [
      'LinkU Summit',
      'inversión',
      'investment',
      'Medellín',
      'venture capital',
      'real estate',
      'private equity',
      'family office',
      'Latinoamérica'
    ],
    authors: [{ name: 'LinkU Ventures' }],
    alternates: {
      canonical: url,
      languages: {
        'es-CO': SITE_URL,
        en: `${SITE_URL}/en`,
        'x-default': SITE_URL
      }
    },
    openGraph: {
      type: 'website',
      locale: m.ogLocale,
      url,
      siteName: 'LINKU SUMMIT 2026',
      title: m.title,
      description: m.description,
      images: [
        {
          url: '/og/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'LinkU Summit 2026'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
      images: ['/og/og-image.jpg']
    },
    icons: {
      icon: '/brand/linku-icon.png',
      shortcut: '/brand/linku-icon.png',
      apple: '/brand/linku-icon.png'
    },
    appleWebApp: {
      title: 'LINKU SUMMIT 2026',
      statusBarStyle: 'black-translucent'
    }
  };
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = await readLocale();

  return (
    <html lang={HTML_LANG[locale]} className={inter.variable}>
      <body className="min-h-screen bg-linku-bg font-sans antialiased">
        {children}

        {/*
          Filtro SVG duotono LinkU — usado por las fotos de speakers.
          Mapea sombras → navy (#050814) y brillos → coral (#FF5A5F).
          Render invisible, solo expone el filtro para CSS.
        */}
        <svg
          aria-hidden
          focusable="false"
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}
        >
          <defs>
            <filter id="linku-duotone" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="
                  0.299 0.587 0.114 0 0
                  0.299 0.587 0.114 0 0
                  0.299 0.587 0.114 0 0
                  0     0     0     1 0
                "
              />
              <feComponentTransfer>
                <feFuncR tableValues="0.0196 1" />
                <feFuncG tableValues="0.0314 0.3529" />
                <feFuncB tableValues="0.0784 0.3725" />
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  );
}
