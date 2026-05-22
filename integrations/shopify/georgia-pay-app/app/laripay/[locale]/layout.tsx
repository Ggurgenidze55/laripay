import { notFound } from 'next/navigation';
import { LariPayShell } from '@/components/laripay/LariPayShell';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { isLocale, LOCALES } from '@/lib/i18n/config';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default function LaripayLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();

  return (
    <LocaleProvider locale={params.locale}>
      <LariPayShell>{children}</LariPayShell>
    </LocaleProvider>
  );
}
