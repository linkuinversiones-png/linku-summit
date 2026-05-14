import { notFound } from 'next/navigation';
import { LOCALES, type Locale } from '@/lib/i18n/config';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!(LOCALES as readonly string[]).includes(params.locale)) {
    notFound();
  }
  return <>{children}</>;
}
