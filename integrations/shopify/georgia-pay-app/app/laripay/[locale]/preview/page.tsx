import { redirect } from 'next/navigation';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';
import { localePath } from '@/lib/i18n/routing';

type Props = { params: { locale: string } };

export default function PreviewRedirectPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  redirect(localePath(locale));
}
