import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import '@/index.css';
import { Providers } from './providers';

export const metadata = {
  icons: {
    icon: '/placeholder.svg',
    shortcut: '/placeholder.svg',
    apple: '/placeholder.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/placeholder.svg" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
