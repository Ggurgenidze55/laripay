import { HostedCheckoutPage } from '@/components/checkout/hosted-checkout-page';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE_NAME } from '@/lib/i18n/locale-preference';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';

export default function CheckoutUiPage({
  params,
  searchParams,
}: {
  params: { sessionId: string };
  searchParams: { lang?: string };
}) {
  const cookieLocale = cookies().get(LOCALE_COOKIE_NAME)?.value;
  const fromQuery = searchParams.lang;
  const locale =
    (fromQuery && isLocale(fromQuery) ? fromQuery : null) ||
    (cookieLocale && isLocale(cookieLocale) ? cookieLocale : null) ||
    DEFAULT_LOCALE;

  return <HostedCheckoutPage sessionId={params.sessionId} locale={locale} />;
}
