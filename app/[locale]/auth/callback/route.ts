import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isLocale, localizePath, DEFAULT_LOCALE } from '@/lib/i18n/config';

/**
 * Endpoint al que el email mágico de Supabase redirige.
 * Intercambia el `code` por una sesión y guarda las cookies.
 * Después manda al usuario al `next` (o a /me por defecto, respetando locale).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string } }
) {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? localizePath('/me', locale);
  const errorDescription = searchParams.get('error_description');

  const loginPath = localizePath('/login', locale);

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}${loginPath}?error=${encodeURIComponent(errorDescription)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}${loginPath}?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}${loginPath}?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
