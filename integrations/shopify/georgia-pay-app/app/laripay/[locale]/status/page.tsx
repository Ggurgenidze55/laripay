import type { Metadata } from 'next';
import { StatusPageClient } from '@/components/status/status-page-client';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.status;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function StatusPage() {
  return <StatusPageClient />;
}
