import { LariPayShell } from '@/components/laripay/LariPayShell';

export default function LariPayLayout({ children }: { children: React.ReactNode }) {
  return <LariPayShell>{children}</LariPayShell>;
}
