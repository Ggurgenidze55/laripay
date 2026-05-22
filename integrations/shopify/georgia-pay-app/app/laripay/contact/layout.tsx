import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — LariPay.ai',
  description: 'Contact LariPay.ai for sales, support, and partnerships.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
