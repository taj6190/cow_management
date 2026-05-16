import AuthProvider from '@/components/AuthProvider';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GoruFarm - Farm Management System',
  description: 'Complete cow farm management system for Bangladesh. Track cows, expenses, income, and generate reports.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="GoruFarm" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GoruFarm" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#15803d" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ServiceWorkerRegister />
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 min-w-0 lg:ml-0 mt-14 lg:mt-0">
                  <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    {children}
                  </div>
                </main>
              </div>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
