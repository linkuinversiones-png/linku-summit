'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, DEFAULT_LOCALE, LOCALE_LABEL, isLocale, type Locale } from '@/lib/i18n/config';

/**
 * Construye la URL equivalente en otro idioma manteniendo la ruta actual.
 * - `/`            (es) → `/en`
 * - `/agenda`      (es) → `/en/agenda`
 * - `/en/login`    (en) → `/login`
 */
function buildHref(pathname: string, target: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const rest = isLocale(first) ? segments.slice(1) : segments;
  const restPath = rest.length ? '/' + rest.join('/') : '';

  if (target === DEFAULT_LOCALE) return restPath || '/';
  return `/${target}${restPath}`;
}

export default function LocaleSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname() || '/';

  return (
    <div
      role="group"
      aria-label="Idioma"
      className="inline-flex items-center gap-1 rounded-full border border-linku-border bg-linku-bg-3/60 p-0.5"
    >
      {LOCALES.map((loc) => {
        const active = loc === currentLocale;
        const href = buildHref(pathname, loc);
        return (
          <Link
            key={loc}
            href={href}
            hrefLang={loc}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] transition ${
              active
                ? 'bg-linku-coral text-white shadow-coral-glow'
                : 'text-linku-text-muted hover:text-linku-text'
            }`}
          >
            {LOCALE_LABEL[loc]}
          </Link>
        );
      })}
    </div>
  );
}
