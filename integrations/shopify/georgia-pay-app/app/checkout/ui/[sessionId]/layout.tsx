import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout — LariPay',
  robots: 'noindex',
};

export default function HostedCheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-canvas via-canvas to-canvas-elevated">
      {children}
    </div>
  );
}
