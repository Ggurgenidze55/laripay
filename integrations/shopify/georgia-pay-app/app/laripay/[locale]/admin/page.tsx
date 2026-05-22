import { Suspense } from 'react';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';
import { AdminDashboardContent } from '@/components/admin/admin-dashboard-content';

type Props = { params: { locale: string } };

export function generateMetadata({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const a = getDictionary(locale).admin;
  return { title: a.metaTitle, description: a.metaDescription };
}

export default function AdminPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const t = getDictionary(locale);

  return (
    <Suspense fallback={<p className="text-sm text-foreground-muted">{t.admin.loading}</p>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
