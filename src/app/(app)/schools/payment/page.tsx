'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Check,
  CreditCard,
  DollarSign,
  Clock,
  Loader2,
  AlertTriangle,
  FileText,
  History,
  Smartphone,
  Building2,
  Wallet,
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  SUBSCRIPTION_PLANS,
  formatGHS,
  getDaysRemaining,
  SubscriptionPlanType,
  PaymentMethodType,
} from '@/schemas/subscription';
import {
  getSubscription,
  submitPayment,
  getSchoolPayments,
  updateSubscriptionStatus,
} from '@/services/subscription';
import type { Subscription, PaymentRecord } from '@/schemas/subscription';

const paymentSchema = z.object({
  planType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  paymentMethod: z.enum(['mobile_money', 'bank_transfer', 'cash', 'cheque', 'other']),
  paymentReference: z.string().min(5, 'Payment reference is required'),
  paymentProof: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function SchoolPaymentPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>('MONTHLY');

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      planType: 'MONTHLY',
      paymentMethod: 'mobile_money',
      paymentReference: '',
      paymentProof: '',
      notes: '',
    },
  });

  useEffect(() => {
    async function loadData() {
      if (!currentUser?.currentOrganizationId) {
        setLoading(false);
        return;
      }

      try {
        // Update subscription status first
        await updateSubscriptionStatus(currentUser.currentOrganizationId);

        // Load subscription
        const sub = await getSubscription(currentUser.currentOrganizationId);
        setSubscription(sub);

        // Load payment history
        const paymentHistory = await getSchoolPayments(currentUser.currentOrganizationId);
        setPayments(paymentHistory);
      } catch (error) {
        console.error('Error loading subscription data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subscription information',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser, toast]);

  async function onSubmit(values: PaymentFormValues) {
    if (!currentUser?.currentOrganizationId || !currentUser?.schoolName) {
      toast({
        title: 'Error',
        description: 'School information not found',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await submitPayment(
        currentUser.currentOrganizationId,
        currentUser.schoolName,
        values.planType,
        values.paymentMethod,
        values.paymentReference,
        values.paymentProof || undefined,
        values.notes || undefined
      );

      toast({
        title: 'Payment Submitted Successfully!',
        description:
          'Your payment is being reviewed. You will be notified once it is approved.',
      });

      // Refresh data
      const sub = await getSubscription(currentUser.currentOrganizationId);
      setSubscription(sub);

      const paymentHistory = await getSchoolPayments(currentUser.currentOrganizationId);
      setPayments(paymentHistory);

      // Reset form
      form.reset();
    } catch (error: any) {
      console.error('Error submitting payment:', error);
      toast({
        title: 'Payment Submission Failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const daysRemaining = subscription
    ? subscription.isTrialActive
      ? getDaysRemaining(new Date(subscription.trialEndDate))
      : subscription.subscriptionEndDate
      ? getDaysRemaining(new Date(subscription.subscriptionEndDate))
      : 0
    : 0;

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription & Billing</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and payment information
        </p>
      </div>

      {/* Current Status Card */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Status</CardTitle>
                <CardDescription className="mt-1">
                  {currentUser?.schoolName || 'Your School'}
                </CardDescription>
              </div>
              <Badge
                variant={
                  subscription.subscriptionStatus === 'active'
                    ? 'default'
                    : subscription.subscriptionStatus === 'trial'
                    ? 'secondary'
                    : subscription.subscriptionStatus === 'pending_payment'
                    ? 'outline'
                    : 'destructive'
                }
                className="text-sm"
              >
                {subscription.subscriptionStatus.toUpperCase().replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Plan Type</p>
                <p className="text-lg font-semibold">
                  {SUBSCRIPTION_PLANS[subscription.subscriptionType].name}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Days Remaining</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-lg font-semibold">{formatGHS(subscription.totalAmountPaid)}</p>
              </div>
            </div>

            {subscription.subscriptionStatus === 'pending_payment' && (
              <Alert className="border-blue-500 bg-blue-50">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Your payment of {formatGHS(subscription.currentPaymentAmount || 0)} is being
                  reviewed by our team.
                </AlertDescription>
              </Alert>
            )}

            {subscription.currentPaymentStatus === 'rejected' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Payment Rejected:</strong> {subscription.rejectionReason}
                </AlertDescription>
              </Alert>
            )}

            {subscription.isTrialActive && daysRemaining <= 3 && (
              <Alert className="border-orange-500 bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Trial Ending Soon!</strong> Your free trial expires in {daysRemaining}{' '}
                  days. Subscribe below to continue using CampusConnect.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="payment">Submit Payment</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map((planKey) => {
              const plan = SUBSCRIPTION_PLANS[planKey];
              const isPopular = planKey === 'QUARTERLY';

              return (
                <Card
                  key={planKey}
                  className={`relative ${
                    isPopular ? 'border-primary shadow-lg' : ''
                  } ${selectedPlan === planKey ? 'ring-2 ring-primary' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">
                        {formatGHS(plan.price)}
                      </span>
                      <span className="text-muted-foreground">
                        {' '}
                        / {plan.duration} days
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => {
                        setSelectedPlan(planKey);
                        form.setValue('planType', planKey);
                        // Scroll to payment tab
                        document.querySelector('[value="payment"]')?.scrollIntoView({
                          behavior: 'smooth',
                        });
                      }}
                      className="w-full"
                      variant={selectedPlan === planKey ? 'default' : 'outline'}
                    >
                      Select Plan
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-2">Bank Transfer Details:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li><strong>Bank:</strong> Ecobank Ghana</li>
                  <li><strong>Account Name:</strong> CampusConnect Ltd</li>
                  <li><strong>Account Number:</strong> 0123456789</li>
                  <li><strong>Branch:</strong> Accra Main</li>
                </ul>
              </div>

              <Separator />

              <div>
                <p className="font-semibold mb-2">Mobile Money:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li><strong>MTN:</strong> 024-123-4567</li>
                  <li><strong>Vodafone:</strong> 020-123-4567</li>
                  <li><strong>AirtelTigo:</strong> 027-123-4567</li>
                  <li><strong>Name:</strong> CampusConnect Ltd</li>
                </ul>
              </div>

              <Separator />

              <p className="text-muted-foreground">
                After making payment, please submit your payment details in the{' '}
                <strong>&quot;Submit Payment&quot;</strong> tab for verification.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Submission Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Submit Payment Proof</CardTitle>
              <CardDescription>
                Fill in your payment details for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="planType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selected Plan</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                          >
                            {(['MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map((planKey) => (
                              <div key={planKey}>
                                <RadioGroupItem
                                  value={planKey}
                                  id={planKey}
                                  className="peer sr-only"
                                />
                                <label
                                  htmlFor={planKey}
                                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                  <div className="text-center">
                                    <p className="font-semibold">
                                      {SUBSCRIPTION_PLANS[planKey].name}
                                    </p>
                                    <p className="text-2xl font-bold mt-2">
                                      {formatGHS(SUBSCRIPTION_PLANS[planKey].price)}
                                    </p>
                                  </div>
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 md:grid-cols-5 gap-3"
                          >
                            <div>
                              <RadioGroupItem
                                value="mobile_money"
                                id="mobile_money"
                                className="peer sr-only"
                              />
                              <label
                                htmlFor="mobile_money"
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <Smartphone className="h-6 w-6 mb-2" />
                                <span className="text-xs text-center">Mobile Money</span>
                              </label>
                            </div>
                            <div>
                              <RadioGroupItem
                                value="bank_transfer"
                                id="bank_transfer"
                                className="peer sr-only"
                              />
                              <label
                                htmlFor="bank_transfer"
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <Building2 className="h-6 w-6 mb-2" />
                                <span className="text-xs text-center">Bank Transfer</span>
                              </label>
                            </div>
                            <div>
                              <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                              <label
                                htmlFor="cash"
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <DollarSign className="h-6 w-6 mb-2" />
                                <span className="text-xs text-center">Cash</span>
                              </label>
                            </div>
                            <div>
                              <RadioGroupItem value="cheque" id="cheque" className="peer sr-only" />
                              <label
                                htmlFor="cheque"
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <Wallet className="h-6 w-6 mb-2" />
                                <span className="text-xs text-center">Cheque</span>
                              </label>
                            </div>
                            <div>
                              <RadioGroupItem value="other" id="other" className="peer sr-only" />
                              <label
                                htmlFor="other"
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <CreditCard className="h-6 w-6 mb-2" />
                                <span className="text-xs text-center">Other</span>
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Reference / Transaction ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. TXN123456789" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the transaction ID, reference number, or receipt number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentProof"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Proof (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/receipt.jpg"
                            {...field}
                            type="url"
                          />
                        </FormControl>
                        <FormDescription>
                          Upload your receipt to a file sharing service and paste the link here
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional information about your payment"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Payment for Verification
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>View all your payment submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payment history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-3">
                              <p className="font-semibold">{formatGHS(payment.amount)}</p>
                              <Badge
                                variant={
                                  payment.status === 'approved'
                                    ? 'default'
                                    : payment.status === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {payment.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {SUBSCRIPTION_PLANS[payment.subscriptionType].name} •{' '}
                              {payment.paymentMethod.replace('_', ' ')} • {payment.paymentReference}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Submitted: {new Date(payment.submittedAt).toLocaleDateString()}
                            </p>
                            {payment.reviewedAt && (
                              <p className="text-xs text-muted-foreground">
                                Reviewed: {new Date(payment.reviewedAt).toLocaleDateString()} by{' '}
                                {payment.reviewedByName}
                              </p>
                            )}
                            {payment.status === 'rejected' && payment.rejectionReason && (
                              <Alert variant="destructive" className="mt-2">
                                <AlertDescription className="text-sm">
                                  <strong>Rejection Reason:</strong> {payment.rejectionReason}
                                </AlertDescription>
                              </Alert>
                            )}
                            {payment.reviewNotes && payment.status === 'approved' && (
                              <Alert className="mt-2 border-green-500 bg-green-50">
                                <AlertDescription className="text-sm text-green-800">
                                  <strong>Note:</strong> {payment.reviewNotes}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
