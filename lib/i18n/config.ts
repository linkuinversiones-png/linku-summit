export const LOCALES = ['es', 'en'] as const;
export const DEFAULT_LOCALE = 'es' as const;

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function localizePath(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return `/${locale}${clean === '/' ? '' : clean}`;
}

export function stripLocale(pathname: string): {
  locale: Locale;
  path: string;
} {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    return { locale: first, path: '/' + segments.slice(1).join('/') };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

export const HTML_LANG: Record<Locale, string> = {
  es: 'es-CO',
  en: 'en'
};

export const LOCALE_LABEL: Record<Locale, string> = {
  es: 'ES',
  en: 'EN'
};
