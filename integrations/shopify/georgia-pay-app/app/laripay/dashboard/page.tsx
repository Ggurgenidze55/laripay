import { Suspense } from 'react';
import DashboardContent from './DashboardContent';

export default function LariPayDashboardPage() {
  return (
    <Suspense fallback={<p className="laripay-meta">იტვირთება…</p>}>
      <DashboardContent />
    </Suspense>
  );
}
