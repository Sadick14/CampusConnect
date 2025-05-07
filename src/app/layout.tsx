import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
// AppShell is removed from here, will be in (app)/layout.tsx
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';

export const metadata: Metadata = {
  title: 'CampusConnect Pro',
  description: 'Comprehensive School Management System',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1A237E',
};

// The Firebase Auth user for superadmin@example.com (password: password)
// MUST be created manually in the Firebase Console > Authentication section
// with the UID 'superadmin'.
// The user profile in Firestore is created/updated upon first login by the createUserProfile function.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
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