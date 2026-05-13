import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://linkusummit.com'),
  title: 'LINKU SUMMIT 2026 — La cumbre de inversión multi-activo en Medellín',
  description:
    'Octubre 2026 · Medellín. 300+ inversionistas, 6 clases de activo, 2 días donde se mueve capital real en Latinoamérica.',
  keywords: [
    'LinkU Summit',
    'inversión',
    'Medellín',
    'venture capital',
    'real estate',
    'private equity',
    'family office',
    'Latinoamérica'
  ],
  authors: [{ name: 'LinkU Ventures' }],
  alternates: { canonical: 'https://linkusummit.com' },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://linkusummit.com',
    siteName: 'LINKU SUMMIT 2026',
    title: 'LINKU SUMMIT 2026 — Donde el capital real se encuentra',
    description:
      'Octubre 2026 · Medellín. 300+ inversionistas, 6 clases de activo, 2 días de alto impacto.',
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
    title: 'LINKU SUMMIT 2026',
    description:
      'Octubre 2026 · Medellín. La cumbre de inversión multi-activo de Latinoamérica.',
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

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CO" className={inter.variable}>
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
              {/* Convierte a escala de grises usando luminancia humana */}
              <feColorMatrix
                type="matrix"
                values="
                  0.299 0.587 0.114 0 0
                  0.299 0.587 0.114 0 0
                  0.299 0.587 0.114 0 0
                  0     0     0     1 0
                "
              />
              {/* Remapea negro→navy y blanco→coral */}
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
