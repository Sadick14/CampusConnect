
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
// AppShell is removed from here, will be in (app)/layout.tsx
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { initializeSuperAdmin } from '@/services/user'; // Import initializeSuperAdmin

export const metadata: Metadata = {
  title: 'CampusConnect Pro',
  description: 'Comprehensive School Management System',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1A237E',
};

async function initializeApp() {
  // Call initializeSuperAdmin here
  await initializeSuperAdmin();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await initializeApp(); // Call the initialization function

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
