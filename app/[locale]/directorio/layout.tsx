import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_LOCALE,
  isLocale,
  localizePath,
  type Locale
} from '@/lib/i18n/config';
import { getContent } from '@/lib/i18n/content';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/navigation/Footer';

async function getCurrentUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export default async function DirectorioLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await props.params;
  // Por ahora el directorio existe solo en español. /en/directorio devuelve 404
  // hasta que se publiquen las traducciones.
  if (!isLocale(rawLocale) || rawLocale !== DEFAULT_LOCALE) {
    notFound();
  }
  const locale: Locale = rawLocale;

  const user = await getCurrentUser();
  const c = getContent(locale);
  const ui = c.ui;
  const directorioHref = localizePath('/directorio', locale);
  const directorioLabel =
    (ui.nav.links as { directorio?: string }).directorio ?? 'Directorio';

  return (
    <>
      <Navbar
        contacts={c.site.contacts}
        isLoggedIn={!!user}
        locale={locale}
        ui={ui.nav}
        anchorBase={localizePath('/', locale)}
      />
      <main className="bg-linku-bg">{props.children}</main>
      <Footer
        site={c.site}
        ui={ui.footer}
        directorioHref={directorioHref}
        directorioLabel={directorioLabel}
      />
    </>
  );
}
