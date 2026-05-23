import { Suspense } from 'react';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';
import { AdminMerchantDetail } from '@/components/admin/admin-merchant-detail';

type Props = { params: { locale: string; id: string } };

export function generateMetadata({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const m = getDictionary(locale).admin.merchantsManage;
  return { title: m.detailMetaTitle, description: m.metaDescription };
}

export default function AdminMerchantDetailPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const t = getDictionary(locale);

  return (
    <Suspense fallback={<p className="text-sm text-foreground-muted">{t.admin.loading}</p>}>
      <AdminMerchantDetail merchantId={params.id} />
    </Suspense>
  );
}
