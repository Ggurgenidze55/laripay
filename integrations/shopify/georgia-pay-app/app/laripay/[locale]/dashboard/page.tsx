import { Suspense } from 'react';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';
import DashboardContent from './DashboardContent';

type Props = { params: { locale: string } };

export default function LariPayDashboardPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const t = getDictionary(locale);

  return (
    <Suspense fallback={<p className="text-sm text-foreground-muted">{t.dashboard.loading}</p>}>
      <DashboardContent />
    </Suspense>
  );
}
