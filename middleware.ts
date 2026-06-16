import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { LOCALES, DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';

/**
 * Estrategia i18n:
 *   - `/`            → rewrite a `/es` (default sin prefijo en la URL pública)
 *   - `/en`, `/en/…` → ruta válida tal cual
 *   - `/es`, `/es/…` → redirect 308 a la versión sin prefijo (canonical SEO)
 *
 * Excepciones (no se aplica i18n):
 *   - `/admin/...`   → panel interno, solo español, ruta directa
 *   - `/api/...`     → handlers de API
 *
 * Adicionalmente refresca la sesión de Supabase en cada request.
 */

const I18N_EXEMPT_PREFIXES = ['admin', 'api'];

/** Dominio canónico (con www). El apex redirige aquí. */
const CANONICAL_HOST = 'www.linkusummit.com';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Canonical host: apex (linkusummit.com) → www.linkusummit.com (301).
  // Solo en producción; deja en paz localhost y la URL *.workers.dev.
  const host = request.headers.get('host') ?? '';
  if (host === 'linkusummit.com') {
    const url = new URL(request.url);
    url.host = CANONICAL_HOST;
    url.protocol = 'https:';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // Rutas exentas de i18n: solo refrescar sesión y pasar.
  if (first && I18N_EXEMPT_PREFIXES.includes(first)) {
    return await updateSession(request);
  }

  // Canonical: si entran a /es o /es/… los mandamos a la versión sin prefijo.
  if (first === DEFAULT_LOCALE) {
    const stripped = '/' + segments.slice(1).join('/');
    const cleanPath = stripped === '/' ? '/' : stripped;
    return NextResponse.redirect(new URL(cleanPath + search, request.url), 308);
  }

  let locale: (typeof LOCALES)[number] = DEFAULT_LOCALE;
  let rewriteTarget: string | null = null;

  if (isLocale(first)) {
    locale = first;
  } else {
    rewriteTarget = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  requestHeaders.set('x-pathname', pathname);

  let response: NextResponse;
  if (rewriteTarget) {
    response = NextResponse.rewrite(new URL(rewriteTarget + search, request.url), {
      request: { headers: requestHeaders }
    });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  const supabaseResponse = await updateSession(request);
  supabaseResponse.cookies.getAll().forEach((c) => {
    response.cookies.set(c.name, c.value, c);
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|brand|partners|speakers|sponsors|og|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
  ]
};
