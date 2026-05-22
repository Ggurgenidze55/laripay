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
  icons: { icon: '/laripay-logo.svg' },
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
        <meta name="shopify-api-key" content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || ''} />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" async />
      </head>
      <body className="font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
