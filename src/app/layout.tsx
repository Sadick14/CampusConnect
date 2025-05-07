
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
// AppShell is removed from here, will be in (app)/layout.tsx
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
// import { initializeSuperAdmin } from '@/services/user'; // Keep commented out - superadmin Auth user creation is manual.

export const metadata: Metadata = {
  title: 'CampusConnect Pro',
  description: 'Comprehensive School Management System',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1A237E',
};

// The initializeSuperAdmin function from user.ts primarily sets up the Firestore document.
// The Firebase Auth user for superadmin@example.com (password: password)
// MUST be created manually in the Firebase Console > Authentication section.
// async function initializeApp() {
//   // await initializeSuperAdmin(); // This only creates Firestore profile, not Auth user.
// }

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // await initializeApp(); // Call to initializeSuperAdmin (if any) is kept commented

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

