import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { MarketingPage } from '@/components/laripay/MarketingPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resolveLocaleParam } from '@/lib/i18n/resolve-locale';

type Props = { params: { locale: string } };

function StatusDot({ status }: { status: 'operational' | 'degraded' | 'outage' }) {
  const colors = {
    operational: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    degraded: 'bg-amber-400',
    outage: 'bg-red-400',
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />;
}

export function generateMetadata({ params }: Props): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.status;
  return { title: p.metaTitle, description: p.metaDescription };
}

export default function StatusPage({ params }: Props) {
  const locale = resolveLocaleParam(params.locale);
  const p = getDictionary(locale).pages.status;

  return (
    <MarketingPage eyebrow={p.eyebrow} title={p.title} description={p.description}>
      <Card className="divide-y divide-border p-0">
        {p.services.map((name) => (
          <div key={name} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-foreground/80">{name}</span>
            <span className="flex items-center gap-2 text-xs capitalize text-emerald-400/90">
              <StatusDot status="operational" />
              {p.operational}
            </span>
          </div>
        ))}
      </Card>
      <p className="text-sm text-foreground-muted">
        {p.liveProbe}{' '}
        <Link href="/api/health" className="text-accent-cyan hover:underline">
          GET /api/health
        </Link>
      </p>
    </MarketingPage>
  );
}
