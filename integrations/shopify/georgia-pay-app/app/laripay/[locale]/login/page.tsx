import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';
import { UserAuthPanel } from '@/components/auth/user-auth-panel';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const a = getDictionary(locale).pages.auth;
  return { title: `${a.tabLogin} — LariPay.ai`, description: a.description };
}

export default function LoginPage() {
  return <UserAuthPanel initialMode="login" />;
}
