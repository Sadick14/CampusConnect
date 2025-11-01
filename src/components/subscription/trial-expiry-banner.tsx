'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getSubscription } from '@/services/subscription';
import { Subscription, getDaysRemaining, formatGHS, SUBSCRIPTION_PLANS } from '@/schemas/subscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, CreditCard, Check } from 'lucide-react';

export function TrialExpiryBanner() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      // Only check for school admins with schoolId
      if (!currentUser?.schoolId || currentUser.role === 'superadmin') {
        setLoading(false);
        return;
      }

      try {
        const sub = await getSubscription(currentUser.schoolId);
        setSubscription(sub);

        if (sub) {
          // Calculate days remaining
          if (sub.isTrialActive) {
            const days = getDaysRemaining(new Date(sub.trialEndDate));
            setDaysLeft(days);
          } else if (sub.subscriptionEndDate) {
            const days = getDaysRemaining(new Date(sub.subscriptionEndDate));
            setDaysLeft(days);
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [currentUser]);

  // Don't show anything while loading or for superadmin
  if (loading || !subscription || currentUser?.role === 'superadmin') {
    return null;
  }

  // Trial expiring soon (< 3 days)
  if (subscription.isTrialActive && daysLeft <= 3 && daysLeft > 0) {
    return (
      <Alert className="border-orange-500 bg-orange-50 mb-4">
        <Clock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-orange-800">
            <strong>Trial Expiring Soon!</strong> Your {SUBSCRIPTION_PLANS.TRIAL.duration}-day free trial ends in{' '}
            <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>. 
            Subscribe now to avoid service interruption.
          </span>
          <Button 
            onClick={() => router.push('/schools/payment')}
            size="sm"
            className="ml-4 bg-orange-600 hover:bg-orange-700"
          >
            View Plans
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial expired
  if (subscription.isTrialActive && daysLeft <= 0) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            <strong>Trial Expired!</strong> Your free trial has ended. 
            Please subscribe to continue using Syntra.
          </span>
          <Button 
            onClick={() => router.push('/schools/payment')}
            size="sm"
            variant="secondary"
            className="ml-4"
          >
            Subscribe Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Paid subscription expiring soon (< 7 days)
  if (subscription.subscriptionStatus === 'active' && daysLeft <= 7 && daysLeft > 0) {
    return (
      <Alert className="border-yellow-500 bg-yellow-50 mb-4">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-yellow-800">
            <strong>Subscription Expiring:</strong> Your subscription ends in{' '}
            <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.
            Renew now to avoid service interruption.
          </span>
          <Button 
            onClick={() => router.push('/schools/payment')}
            size="sm"
            className="ml-4 bg-yellow-600 hover:bg-yellow-700"
          >
            Renew Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Payment pending
  if (subscription.subscriptionStatus === 'pending_payment') {
    return (
      <Alert className="border-blue-500 bg-blue-50 mb-4">
        <CreditCard className="h-4 w-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-blue-800">
            <strong>Payment Pending:</strong> Your payment of {formatGHS(subscription.currentPaymentAmount || 0)} 
            is being verified. You can continue using the platform.
          </span>
          <Button 
            onClick={() => router.push('/schools/payment')}
            size="sm"
            variant="outline"
            className="ml-4 border-blue-600 text-blue-600 hover:bg-blue-100"
          >
            View Status
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Payment rejected
  if (subscription.currentPaymentStatus === 'rejected') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            <strong>Payment Rejected:</strong> {subscription.rejectionReason || 'Please submit a valid payment proof.'}
          </span>
          <Button 
            onClick={() => router.push('/schools/payment')}
            size="sm"
            variant="secondary"
            className="ml-4"
          >
            Resubmit Payment
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Active subscription - show success message for first few days
  if (subscription.subscriptionStatus === 'active' && daysLeft > 7 && subscription.lastPaymentDate) {
    const daysSincePayment = Math.floor(
      (new Date().getTime() - new Date(subscription.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only show for first 3 days after payment approval
    if (daysSincePayment <= 3) {
      return (
        <Alert className="border-green-500 bg-green-50 mb-4">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Subscription Active!</strong> Your payment has been approved. 
            Thank you for using Syntra.
          </AlertDescription>
        </Alert>
      );
    }
  }

  // Don't show banner for active subscriptions with plenty of time left
  return null;
}
