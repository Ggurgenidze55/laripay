import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { MarketingPage } from '@/components/laripay/MarketingPage';

export const metadata: Metadata = {
  title: 'Status — LariPay.ai',
  description: 'LariPay.ai platform and API operational status.',
};

const SERVICES = [
  { name: 'API & Checkout', status: 'operational' as const },
  { name: 'Merchant Console', status: 'operational' as const },
  { name: 'Webhooks delivery', status: 'operational' as const },
  { name: 'TBC Pay (sandbox)', status: 'operational' as const },
  { name: 'BOG Pay (sandbox)', status: 'operational' as const },
];

function StatusDot({ status }: { status: 'operational' | 'degraded' | 'outage' }) {
  const colors = {
    operational: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    degraded: 'bg-amber-400',
    outage: 'bg-red-400',
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />;
}

export default function StatusPage() {
  return (
    <MarketingPage
      eyebrow="Reliability"
      title="System status"
      description="Current health of LariPay.ai core services. Subscribe to updates via support for incident notifications."
    >
      <Card className="divide-y divide-white/[0.06] p-0">
        {SERVICES.map((svc) => (
          <div key={svc.name} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-white/80">{svc.name}</span>
            <span className="flex items-center gap-2 text-xs capitalize text-emerald-400/90">
              <StatusDot status={svc.status} />
              {svc.status}
            </span>
          </div>
        ))}
      </Card>
      <p className="text-sm text-white/40">
        Live probe:{' '}
        <Link href="/api/health" className="text-accent-cyan hover:underline">
          GET /api/health
        </Link>
      </p>
    </MarketingPage>
  );
}
