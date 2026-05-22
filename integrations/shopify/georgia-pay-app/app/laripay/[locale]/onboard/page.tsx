import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';
import { UserAuthPanel } from '@/components/auth/user-auth-panel';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.auth;
  return { title: p.metaTitle, description: p.description };
}

export default function LariPayOnboardPage() {
  return <UserAuthPanel initialMode="register" />;
}
