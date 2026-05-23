'use client';

import Link from 'next/link';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { localePath } from '@/lib/i18n/routing';
import { AdminLoginPanel } from './admin-login-panel';
import { useAdminSession } from './use-admin-session';

export function AdminShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const { locale, t } = useLocale();
  const a = t.admin;
  const m = a.merchantsManage;
  const { loggedIn, loading, error, refresh, logout } = useAdminSession();

  if (loading && !loggedIn) {
    return <p className="py-20 text-center text-sm text-foreground-muted">{a.loading}</p>;
  }

  if (!loggedIn) {
    return <AdminLoginPanel onLoggedIn={refresh} />;
  }

  return (
    <div className="pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="live" pulse className="mb-3">
            {a.controlCenter}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">{title ?? a.title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={localePath(locale, 'admin')}>
            <Button variant="ghost" size="sm">
              {m.navOverview}
            </Button>
          </Link>
          <Link href={localePath(locale, 'admin/merchants')}>
            <Button variant="ghost" size="sm">
              {m.navMerchants}
            </Button>
          </Link>
          <Link href={localePath(locale, 'dashboard')}>
            <Button variant="ghost" size="sm">
              {a.merchantConsole}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            {a.signOut}
          </Button>
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-amber-400">{error}</p> : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}
