'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getSubscription, updateSubscriptionStatus } from '@/services/subscription';
import { Subscription } from '@/schemas/subscription';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * SubscriptionGuard - Protects routes based on subscription status
 * - Allows access during trial period
 * - Blocks access for expired/locked accounts
 * - Redirects to payment page for expired trials
 * - Shows pending payment message
 */
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Routes that are always accessible (even with expired subscription)
  const publicRoutes = [
    '/payment',
    '/schools/payment',
    '/settings',
    '/logout',
  ];

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

  useEffect(() => {
    async function checkSubscription() {
      if (authLoading) return;

      // Superadmin bypass - no subscription check
      if (currentUser?.role === 'superadmin') {
        setLoading(false);
        return;
      }

      // No school ID - probably teacher/student without school assignment
      if (!currentUser?.schoolId) {
        setLoading(false);
        return;
      }

      try {
        // Update subscription status first
        await updateSubscriptionStatus(currentUser.schoolId);
        
        // Get current subscription
        const sub = await getSubscription(currentUser.schoolId);
        setSubscription(sub);

        // If no subscription found, something is wrong
        if (!sub) {
          setError('No subscription found for your school. Please contact support.');
          setLoading(false);
          return;
        }

        // Check subscription status
        const { subscriptionStatus } = sub;

        // Locked accounts - redirect to payment page
        if (subscriptionStatus === 'locked' && !isPublicRoute) {
          router.push('/payment-required');
          return;
        }

        // Expired accounts - redirect to payment page
        if (subscriptionStatus === 'expired' && !isPublicRoute) {
          router.push('/payment-required');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Error checking subscription:', err);
        setError('Failed to verify subscription status');
        setLoading(false);
      }
    }

    checkSubscription();
  }, [currentUser, authLoading, pathname, router, isPublicRoute]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Verifying subscription...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Subscription Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Please contact support at support@campusconnect.com or try again later.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} className="flex-1">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => router.push('/logout')} className="flex-1">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Superadmin or no subscription check needed
  if (currentUser?.role === 'superadmin' || !currentUser?.schoolId) {
    return <>{children}</>;
  }

  // Subscription is valid or on public route
  if (!subscription || isPublicRoute) {
    return <>{children}</>;
  }

  // Account is locked
  if (subscription.subscriptionStatus === 'locked') {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" />
              Account Locked
            </CardTitle>
            <CardDescription>
              Your school account has been locked due to subscription expiry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {subscription.rejectionReason 
                  ? `Payment Rejected: ${subscription.rejectionReason}` 
                  : 'Your trial period has ended. Please make payment to continue using CampusConnect.'}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 text-sm">
              <p className="font-medium">To unlock your account:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Review subscription plans and pricing</li>
                <li>Submit payment proof</li>
                <li>Wait for superadmin approval</li>
              </ol>
            </div>

            <Button 
              onClick={() => router.push('/schools/payment')} 
              className="w-full"
            >
              Make Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Account is expired (but not locked yet)
  if (subscription.subscriptionStatus === 'expired') {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Subscription Expired
            </CardTitle>
            <CardDescription>
              Your subscription has expired. Renew now to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-500 bg-orange-50">
              <AlertDescription className="text-orange-800">
                Your account will be locked soon. Please renew your subscription to avoid service interruption.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => router.push('/schools/payment')} 
              className="w-full"
            >
              Renew Subscription
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending payment - show message but allow access
  if (subscription.subscriptionStatus === 'pending_payment') {
    return (
      <div className="space-y-4">
        <Alert className="border-blue-500 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>Payment Pending:</strong> Your payment is being reviewed by our team. 
            You can continue using the platform while we verify your payment.
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}
