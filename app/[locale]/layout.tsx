import { notFound } from 'next/navigation';
import { LOCALES, type Locale } from '@/lib/i18n/config';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  if (!(LOCALES as readonly string[]).includes(params.locale)) {
    notFound();
  }
  return <>{children}</>;
}
