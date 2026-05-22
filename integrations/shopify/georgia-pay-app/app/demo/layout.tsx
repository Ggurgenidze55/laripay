import { LariPayShell } from '@/components/laripay/LariPayShell';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <LariPayShell>{children}</LariPayShell>;
}
