import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { children: React.ReactNode; params: { locale: string } };

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.contact;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
