'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { initializeTrialSubscription, getSubscription } from '@/services/subscription';
import { getOrganizationById } from '@/services/organization';

export default function InitSubscriptionPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

  const handleCheckSubscription = async () => {
    if (!currentUser?.currentOrganizationId) {
      setError('No organization ID found. Please log in again.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const sub = await getSubscription(currentUser.currentOrganizationId);
      if (sub) {
        setSubscriptionInfo(sub);
      } else {
        setError('No subscription found');
      }
    } catch (err: any) {
      console.error('Error checking subscription:', err);
      setError(err.message || 'Failed to check subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeSubscription = async () => {
    console.log('[Init Subscription] Starting initialization...');
    console.log('[Init Subscription] Current user:', currentUser);
    console.log('[Init Subscription] Organization ID:', currentUser?.currentOrganizationId);
    
    if (!currentUser?.currentOrganizationId) {
      const errorMsg = 'No organization ID found. Please log in again.';
      console.error('[Init Subscription]', errorMsg);
      setError(errorMsg);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      console.log('[Init Subscription] Fetching organization...');
      // Get organization details
      const org = await getOrganizationById(currentUser.currentOrganizationId);
      console.log('[Init Subscription] Organization:', org);
      
      if (!org) {
        setError('Organization not found');
        return;
      }

      console.log('[Init Subscription] Initializing subscription for:', org.id, org.name);
      
      // Initialize trial subscription
      await initializeTrialSubscription(org.id, org.name);
      
      console.log('[Init Subscription] Subscription initialized successfully!');
      setSuccess(true);
      
      // Check the created subscription
      const sub = await getSubscription(org.id);
      console.log('[Init Subscription] Created subscription:', sub);
      setSubscriptionInfo(sub);
      
    } catch (err: any) {
      console.error('[Init Subscription] Error:', err);
      setError(err.message || 'Failed to initialize subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Initialize Trial Subscription</CardTitle>
          <CardDescription>
            If you're seeing subscription errors, use this page to initialize your 30-day trial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser && (
            <Alert>
              <AlertDescription>
                <strong>Current User:</strong> {currentUser.email}<br />
                <strong>Role:</strong> {currentUser.role}<br />
                <strong>Organization ID:</strong> {currentUser.currentOrganizationId || 'Not set'}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Trial subscription initialized successfully! You now have a 30-day trial.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {subscriptionInfo && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Subscription Details:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Status:</strong> {subscriptionInfo.subscriptionStatus}</p>
                <p><strong>Type:</strong> {subscriptionInfo.subscriptionType}</p>
                <p><strong>Trial Active:</strong> {subscriptionInfo.isTrialActive ? 'Yes' : 'No'}</p>
                <p><strong>Trial Days Remaining:</strong> {subscriptionInfo.trialDaysRemaining}</p>
                <p><strong>Trial End Date:</strong> {subscriptionInfo.trialEndDate ? new Date(subscriptionInfo.trialEndDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleCheckSubscription}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Subscription'
              )}
            </Button>

            <Button
              onClick={handleInitializeSubscription}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                'Initialize Trial'
              )}
            </Button>
          </div>

          <Alert className="border-blue-500 bg-blue-50">
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click "Check Subscription" to see if you already have one</li>
                <li>If no subscription exists, click "Initialize Trial"</li>
                <li>After initialization, refresh the page and try accessing the app</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
