
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/components/auth/auth-guard';
import { SubscriptionGuard } from '@/components/auth/subscription-guard';
import { TrialExpiryBanner } from '@/components/subscription/trial-expiry-banner';

export default function AppGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <AppShell>
          <TrialExpiryBanner />
          {children}
        </AppShell>
      </SubscriptionGuard>
    </AuthGuard>
  );
}
