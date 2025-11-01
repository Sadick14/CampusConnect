'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  CreditCard,
  Calendar,
  TrendingUp,
  Lock,
  Unlock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users,
  DollarSign,
} from 'lucide-react';
import { submitPayment, lockSchoolAccount, unlockSchoolAccount } from '@/services/subscription';
import { SUBSCRIPTION_PLANS, getPlanPricing, type SubscriptionPlanType, type Subscription } from '@/schemas/subscription';

interface SubscriptionManagerProps {
  schoolId: string;
  schoolName: string;
  subscription: Subscription;
  studentCount: number; // Current active student count
  onUpdate?: () => void;
}

export function SubscriptionManager({ schoolId, schoolName, subscription, studentCount, onUpdate }: SubscriptionManagerProps) {
  const { toast } = useToast();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Exclude<SubscriptionPlanType, 'TRIAL'>>('BASIC');
  const [paymentType, setPaymentType] = useState<'upfront' | 'monthly'>('upfront');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  // Calculate amount when plan or payment type changes
  useEffect(() => {
    const pricing = getPlanPricing(selectedPlan, studentCount);
    setCalculatedAmount(paymentType === 'upfront' ? pricing.upfrontFee : pricing.monthlyFee);
  }, [selectedPlan, paymentType, studentCount]);

  const handleUpgrade = async () => {
    if (!paymentReference) {
      toast({
        title: 'Missing information',
        description: 'Please provide payment reference',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await submitPayment(
        schoolId,
        schoolName,
        selectedPlan,
        paymentType,
        studentCount,
        paymentMethod,
        paymentReference,
        undefined,
        paymentNotes
      );

      toast({
        title: 'Payment Submitted',
        description: `${paymentType === 'upfront' ? 'Upfront fee' : 'Monthly'} payment of GHS ${calculatedAmount} is now pending approval`,
      });

      setUpgradeDialogOpen(false);
      setPaymentReference('');
      setPaymentNotes('');
      onUpdate?.();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit payment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLock = async () => {
    try {
      await lockSchoolAccount(schoolId);
      toast({
        title: 'Account Locked',
        description: `${schoolName} has been locked`,
      });
      onUpdate?.();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to lock account',
        variant: 'destructive',
      });
    }
  };

  const handleUnlock = async () => {
    try {
      await unlockSchoolAccount(schoolId);
      toast({
        title: 'Account Unlocked',
        description: `${schoolName} has been unlocked`,
      });
      onUpdate?.();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to unlock account',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'locked':
        return 'bg-red-100 text-red-800';
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isLocked = subscription.subscriptionStatus === 'locked';
  const currentPlan = SUBSCRIPTION_PLANS[subscription.subscriptionType as SubscriptionPlanType] || SUBSCRIPTION_PLANS.TRIAL;
  const currentPricing = getPlanPricing(subscription.subscriptionType, studentCount);

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Current Subscription
            </span>
            <Badge className={getStatusColor(subscription.subscriptionStatus)}>
              {subscription.subscriptionStatus}
            </Badge>
          </CardTitle>
          <CardDescription>
            Revenue Model: One-time activation fee + GHS 20 per student/month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Plan Type</p>
              <p className="font-semibold">{subscription.subscriptionType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Student Count</p>
              <p className="font-semibold flex items-center gap-1">
                <Users className="h-4 w-4" />
                {studentCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Monthly Fee</p>
              <p className="font-semibold">
                {subscription.isTrialActive ? 'FREE' : `GHS ${currentPricing.monthlyFee}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Per Student</p>
              <p className="font-semibold">
                {subscription.isTrialActive ? 'FREE' : `GHS ${currentPricing.perStudent}/mo`}
              </p>
            </div>
          </div>

          {/* Upfront Fee Status */}
          {!subscription.isTrialActive && (
            <div className={`p-3 rounded-lg border ${subscription.upfrontFeePaid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Activation Fee ({currentPlan.name})</p>
                  <p className="text-sm text-muted-foreground">One-time upfront payment</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">GHS {currentPricing.upfrontFee}</p>
                  {subscription.upfrontFeePaid ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Billing Breakdown */}
          {!subscription.isTrialActive && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monthly Billing Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Students:</span>
                  <span className="font-medium">{studentCount} students</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate per Student:</span>
                  <span className="font-medium">GHS 20/month</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Monthly Total:</span>
                  <span className="text-lg text-primary">GHS {currentPricing.monthlyFee}</span>
                </div>
                {subscription.nextBillingDate && (
                  <div className="flex justify-between text-muted-foreground mt-2">
                    <span>Next Billing Date:</span>
                    <span>{new Date(subscription.nextBillingDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Features */}
          <div>
            <h4 className="font-semibold mb-3">Included Features:</h4>
            <div className="grid grid-cols-2 gap-3">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status */}
          {subscription.currentPaymentStatus === 'pending' && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">Payment Pending Approval</p>
                <p className="text-sm text-yellow-700">
                  Waiting for admin to approve GHS {subscription.currentPaymentAmount} payment
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {!subscription.isTrialActive && subscription.subscriptionStatus === 'active' && (
              <Button onClick={() => setUpgradeDialogOpen(true)}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
            )}
            {subscription.isTrialActive && (
              <Button onClick={() => setUpgradeDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                <CreditCard className="mr-2 h-4 w-4" />
                Activate Subscription
              </Button>
            )}
            {isLocked ? (
              <Button onClick={handleUnlock} variant="default">
                <Unlock className="mr-2 h-4 w-4" />
                Unlock Account
              </Button>
            ) : (
              <Button onClick={handleLock} variant="destructive">
                <Lock className="mr-2 h-4 w-4" />
                Lock Account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade/Payment Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {subscription.isTrialActive ? 'Activate Subscription' : subscription.upfrontFeePaid ? 'Pay Monthly Fee' : 'Activate Plan'}
            </DialogTitle>
            <DialogDescription>
              Submit payment details for approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Plan Selection */}
            {(!subscription.upfrontFeePaid || subscription.isTrialActive) && (
              <div className="space-y-2">
                <Label>Select Plan</Label>
                <Select value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as Exclude<SubscriptionPlanType, 'TRIAL'>)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIC">
                      Basic - Up to 200 students
                    </SelectItem>
                    <SelectItem value="STANDARD">
                      Standard - Up to 500 students
                    </SelectItem>
                    <SelectItem value="PREMIUM">
                      Premium - Unlimited students
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Type */}
            {!subscription.upfrontFeePaid && !subscription.isTrialActive && (
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={paymentType} onValueChange={(value) => setPaymentType(value as 'upfront' | 'monthly')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upfront">Upfront Activation Fee</SelectItem>
                    <SelectItem value="monthly">Monthly Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selected Plan Pricing */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold mb-3">
                {SUBSCRIPTION_PLANS[selectedPlan].name}
              </h4>
              
              {paymentType === 'upfront' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">One-time Activation Fee:</span>
                    <span className="text-2xl font-bold text-primary">
                      GHS {SUBSCRIPTION_PLANS[selectedPlan].upfrontFee}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    After paying this fee, you'll pay GHS 20 per student per month
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Students:</span>
                    <span className="font-medium">{studentCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rate:</span>
                    <span className="font-medium">GHS 20/student/month</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold">Monthly Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      GHS {calculatedAmount}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium mb-1">Included:</p>
                <ul className="text-xs space-y-1">
                  {SUBSCRIPTION_PLANS[selectedPlan].features.slice(0, 3).map((feature, i) => (
                    <li key={i}>• {feature}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Reference */}
            <div className="space-y-2">
              <Label>Payment Reference *</Label>
              <Input
                placeholder="e.g., TXN123456789"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Additional payment details..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={submitting || !paymentReference}>
              {submitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Submit GHS {calculatedAmount}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
