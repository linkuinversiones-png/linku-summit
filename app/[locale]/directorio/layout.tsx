import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_LOCALE, localizePath, type Locale } from '@/lib/i18n/config';
import { getContent } from '@/lib/i18n/content';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/navigation/Footer';

async function getCurrentUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export default async function DirectorioLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  // Por ahora el directorio existe solo en español. /en/directorio devuelve 404
  // hasta que se publiquen las traducciones.
  if (params.locale !== DEFAULT_LOCALE) {
    notFound();
  }

  const user = await getCurrentUser();
  const c = getContent(params.locale);
  const ui = c.ui;
  const directorioHref = localizePath('/directorio', params.locale);
  const directorioLabel =
    (ui.nav.links as { directorio?: string }).directorio ?? 'Directorio';

  return (
    <>
      <Navbar
        contacts={c.site.contacts}
        isLoggedIn={!!user}
        locale={params.locale}
        ui={ui.nav}
        anchorBase={localizePath('/', params.locale)}
      />
      <main className="bg-linku-bg">{children}</main>
      <Footer
        site={c.site}
        ui={ui.footer}
        directorioHref={directorioHref}
        directorioLabel={directorioLabel}
      />
    </>
  );
}
