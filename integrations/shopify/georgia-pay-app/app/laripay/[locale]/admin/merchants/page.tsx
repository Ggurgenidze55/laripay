import { Suspense } from 'react';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';
import { AdminMerchantsList } from '@/components/admin/admin-merchants-list';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const m = getDictionary(locale).admin.merchantsManage;
  return { title: m.metaTitle, description: m.metaDescription };
}

export default function AdminMerchantsPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const t = getDictionary(locale);

  return (
    <Suspense fallback={<p className="text-sm text-foreground-muted">{t.admin.loading}</p>}>
      <AdminMerchantsList />
    </Suspense>
  );
}
