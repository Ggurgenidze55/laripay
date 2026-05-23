import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Noto_Sans_Georgian } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeScript } from '@/components/theme/ThemeScript';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const notoKa = Noto_Sans_Georgian({
  subsets: ['georgian', 'latin'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LariPay.ai — Payments Infrastructure for Georgia',
  description:
    'Developer-first payment platform. TBC Pay, BOG Pay, GEL. Modern APIs for commerce.',
  icons: {
    icon: [{ url: '/laripay-logo.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/laripay-logo.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ka"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable} ${notoKa.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
