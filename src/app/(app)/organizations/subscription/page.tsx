
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  CheckCircle,
  XCircle,
  Upload,
  Info,
  ArrowRight,
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
import type { PaymentSettings } from '@/schemas/payment-settings';
import { PageHeader } from '@/components/common/page-header';
import { SubscriptionPageSkeleton } from '@/components/common/page-skeletons';
import { getPaymentSettings } from '@/services/payment-settings';

const paymentSchema = z.object({
  planType: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  paymentMethod: z.enum(['mobile_money', 'bank_transfer', 'cash', 'cheque', 'other']),
  paymentReference: z.string().min(5, 'Payment reference must be at least 5 characters'),
  paymentProof: z.string().url('Must be a valid URL (e.g., image uploaded to cloud)').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function SubscriptionPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Exclude<SubscriptionPlanType, 'TRIAL'>>('BASIC');
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      planType: 'BASIC',
      paymentMethod: 'mobile_money',
      paymentReference: '',
      paymentProof: '',
      notes: '',
    },
  });

  // Watch form values for amount calculation
  const watchedPlan = form.watch('planType');
  const watchedPaymentMethod = form.watch('paymentMethod');

  // Calculate amount whenever plan changes
  useEffect(() => {
    const plan = SUBSCRIPTION_PLANS[watchedPlan];
    setCalculatedAmount(plan.upfrontFee);
  }, [watchedPlan]);

  useEffect(() => {
    async function loadData() {
      // If no user or organization, don't load
      if (!currentUser?.currentOrganizationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await updateSubscriptionStatus(currentUser.currentOrganizationId);
        const sub = await getSubscription(currentUser.currentOrganizationId);
        setSubscription(sub);
        if (sub) {
          const paymentHistory = await getSchoolPayments(currentUser.currentOrganizationId);
          setPayments(paymentHistory);
        }
        // Fetch payment settings
        const settings = await getPaymentSettings();
        setPaymentSettings(settings);
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

    if (currentUser) {
      loadData();
    }
  }, [currentUser, toast]);

  async function onSubmit(values: PaymentFormValues) {
    if (!currentUser?.currentOrganizationId || !currentUser?.name) {
      toast({
        title: 'Error',
        description: 'Organization information not found',
        variant: 'destructive',
      });
      return;
    }

    if (!subscription) {
      toast({
        title: 'Error',
        description: 'Subscription information not found',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const paymentId = await submitPayment(
        currentUser.currentOrganizationId,
        subscription.schoolName,
        values.planType,
        'upfront', // Always upfront for subscription activation
        1, // Student count not needed for upfront fees
        values.paymentMethod,
        values.paymentReference,
        values.paymentProof || undefined,
        values.notes || undefined
      );

      toast({
        title: 'Payment Submitted Successfully! ✓',
        description: 'Your payment is being reviewed by our admin team. You will be notified once approved.',
      });

      // Refresh data
      const sub = await getSubscription(currentUser.currentOrganizationId);
      setSubscription(sub);
      
      const paymentHistory = await getSchoolPayments(currentUser.currentOrganizationId);
      setPayments(paymentHistory);
      
      form.reset();

    } catch (error: any) {
      console.error('Error submitting payment:', error);
      toast({
        title: 'Payment Submission Failed',
        description: error.message || 'Please try again or contact support',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trial': return 'secondary';
      case 'pending_payment': return 'outline';
      case 'expired': return 'destructive';
      case 'locked': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <SubscriptionPageSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription & Billing"
        description="Manage your organization's subscription plan and submit payments for admin approval."
      />

      {subscription ? (
        <>
          {/* Current Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Subscription Status</CardTitle>
                  <CardDescription>Your active plan and billing information</CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(subscription.subscriptionStatus)} className="text-sm">
                  {subscription.subscriptionStatus.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-2xl font-bold">{subscription.subscriptionType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student Count</p>
                  <p className="text-2xl font-bold">{subscription.currentStudentCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Fee</p>
                  <p className="text-2xl font-bold">{formatGHS(subscription.monthlyFeeAmount)}</p>
                </div>
              </div>
              
              {subscription.subscriptionStatus === 'trial' && subscription.trialDaysRemaining !== undefined && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Trial Period Active</AlertTitle>
                  <AlertDescription>
                    You have {subscription.trialDaysRemaining} days remaining in your free trial.
                    {subscription.trialEndDate && ` Trial ends on ${new Date(subscription.trialEndDate).toLocaleDateString()}.`}
                  </AlertDescription>
                </Alert>
              )}

              {subscription.subscriptionStatus === 'pending_payment' && (
                <Alert className="mt-4">
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Payment Under Review</AlertTitle>
                  <AlertDescription>
                    Your payment of {formatGHS(subscription.currentPaymentAmount || 0)} is being reviewed by our admin team.
                    Reference: {subscription.currentPaymentReference}
                  </AlertDescription>
                </Alert>
              )}

              {subscription.subscriptionEndDate && subscription.subscriptionStatus === 'active' && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    Next billing date: <span className="font-semibold">{new Date(subscription.subscriptionEndDate).toLocaleDateString()}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="plans" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="plans">Available Plans</TabsTrigger>
              <TabsTrigger value="payment">Submit Payment</TabsTrigger>
              <TabsTrigger value="history">Payment History</TabsTrigger>
            </TabsList>

            {/* Available Plans Tab */}
            <TabsContent value="plans" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>How Billing Works:</strong> Pay the one-time upfront fee to activate your plan. 
                  Monthly student fees (based on your active student count) will be sent as invoices each month.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(SUBSCRIPTION_PLANS)
                  .filter(([key]) => key !== 'TRIAL')
                  .map(([key, plan]) => (
                    <Card 
                      key={key} 
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedPlan === key ? 'ring-2 ring-primary shadow-md' : ''
                      }`}
                      onClick={() => setSelectedPlan(key as Exclude<SubscriptionPlanType, 'TRIAL'>)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {plan.name}
                          {subscription.subscriptionType === key && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-foreground">
                              {formatGHS(plan.upfrontFee)} <span className="text-sm font-normal">one-time</span>
                            </div>
                            <div className="text-sm">
                              + {formatGHS(plan.perStudentFee)}/student/month
                            </div>
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant={selectedPlan === key ? 'default' : 'outline'}
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlan(key as Exclude<SubscriptionPlanType, 'TRIAL'>);
                          }}
                        >
                          {subscription.subscriptionType === key ? 'Current Plan' : 'Select Plan'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            {/* Submit Payment Tab */}
            <TabsContent value="payment" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Subscription Activation Payment</AlertTitle>
                <AlertDescription>
                  Submit your upfront activation fee below. This is a one-time payment to activate your subscription plan.
                  Monthly student fees will be billed separately through invoices based on your active student count.
                  Your payment will be reviewed and approved within 24-48 hours.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Submit Activation Payment</CardTitle>
                  <CardDescription>
                    Pay the upfront activation fee for your chosen subscription plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Plan Selection */}
                      <FormField
                        control={form.control}
                        name="planType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subscription Plan *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="BASIC">
                                  <div className="flex items-center justify-between w-full">
                                    <span>Basic - {formatGHS(SUBSCRIPTION_PLANS.BASIC.upfrontFee)}</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="STANDARD">
                                  <div className="flex items-center justify-between w-full">
                                    <span>Standard - {formatGHS(SUBSCRIPTION_PLANS.STANDARD.upfrontFee)}</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="PREMIUM">
                                  <div className="flex items-center justify-between w-full">
                                    <span>Premium - {formatGHS(SUBSCRIPTION_PLANS.PREMIUM.upfrontFee)}</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose the subscription plan that fits your school size
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Amount Summary */}
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Upfront Activation Fee:</span>
                          <span className="text-2xl font-bold text-primary">{formatGHS(calculatedAmount)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          This is a one-time fee to activate your subscription. Monthly student fees will be billed separately through invoices.
                        </p>
                      </div>

                      <Separator />

                      {/* Payment Method */}
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Payment Method *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4">
                                  <FormControl>
                                    <RadioGroupItem value="mobile_money" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                                    <Smartphone className="h-4 w-4" />
                                    Mobile Money
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4">
                                  <FormControl>
                                    <RadioGroupItem value="bank_transfer" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Bank Transfer
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4">
                                  <FormControl>
                                    <RadioGroupItem value="cash" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    Cash
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4">
                                  <FormControl>
                                    <RadioGroupItem value="cheque" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Cheque
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Payment Account Details Display */}
                      {paymentSettings && paymentSettings.enabled && watchedPaymentMethod && (
                        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Info className="h-5 w-5 text-blue-600" />
                              Payment Account Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {watchedPaymentMethod === 'mobile_money' && paymentSettings.mobileMoneyAccounts.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-semibold">Mobile Money Accounts:</h4>
                                {paymentSettings.mobileMoneyAccounts.map((account, index) => (
                                  <div key={index} className="bg-white dark:bg-gray-900 p-4 rounded-lg border space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Smartphone className="h-4 w-4 text-primary" />
                                      <span className="font-semibold">{account.provider}</span>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                      <p><strong>Account Name:</strong> {account.accountName}</p>
                                      <p><strong>Phone Number:</strong> {account.phoneNumber}</p>
                                      {account.instructions && (
                                        <p className="text-muted-foreground italic">{account.instructions}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {watchedPaymentMethod === 'bank_transfer' && paymentSettings.bankAccounts.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-semibold">Bank Transfer Accounts:</h4>
                                {paymentSettings.bankAccounts.map((account, index) => (
                                  <div key={index} className="bg-white dark:bg-gray-900 p-4 rounded-lg border space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-primary" />
                                      <span className="font-semibold">{account.bankName}</span>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                      <p><strong>Account Name:</strong> {account.accountName}</p>
                                      <p><strong>Account Number:</strong> {account.accountNumber}</p>
                                      {account.branchName && <p><strong>Branch:</strong> {account.branchName}</p>}
                                      {account.swiftCode && <p><strong>SWIFT Code:</strong> {account.swiftCode}</p>}
                                      {account.instructions && (
                                        <p className="text-muted-foreground italic mt-2">{account.instructions}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {watchedPaymentMethod === 'cash' && paymentSettings.cashPayment && (
                              <div className="space-y-3">
                                <h4 className="font-semibold">Cash Payment Details:</h4>
                                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-primary" />
                                    <span className="font-semibold">Office Location</span>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Address:</strong> {paymentSettings.cashPayment.officeAddress}</p>
                                    <p><strong>Contact Person:</strong> {paymentSettings.cashPayment.contactPerson}</p>
                                    <p><strong>Phone:</strong> {paymentSettings.cashPayment.contactPhone}</p>
                                    <p><strong>Opening Hours:</strong> {paymentSettings.cashPayment.openingHours}</p>
                                    {paymentSettings.cashPayment.instructions && (
                                      <p className="text-muted-foreground italic mt-2">{paymentSettings.cashPayment.instructions}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {watchedPaymentMethod === 'cheque' && paymentSettings.chequePayment && (
                              <div className="space-y-3">
                                <h4 className="font-semibold">Cheque Payment Details:</h4>
                                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span className="font-semibold">Cheque Information</span>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Payable To:</strong> {paymentSettings.chequePayment.payableTo}</p>
                                    <p><strong>Mailing Address:</strong> {paymentSettings.chequePayment.mailingAddress}</p>
                                    <p><strong>Contact Person:</strong> {paymentSettings.chequePayment.contactPerson}</p>
                                    <p><strong>Phone:</strong> {paymentSettings.chequePayment.contactPhone}</p>
                                    {paymentSettings.chequePayment.instructions && (
                                      <p className="text-muted-foreground italic mt-2">{paymentSettings.chequePayment.instructions}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {watchedPaymentMethod === 'other' && paymentSettings.otherPayment && (
                              <div className="space-y-3">
                                <h4 className="font-semibold">{paymentSettings.otherPayment.method}:</h4>
                                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border space-y-2">
                                  <div className="space-y-1 text-sm">
                                    <p>{paymentSettings.otherPayment.details}</p>
                                    {paymentSettings.otherPayment.instructions && (
                                      <p className="text-muted-foreground italic mt-2">{paymentSettings.otherPayment.instructions}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <AlertDescription className="text-sm">
                                Please make the payment to the account details shown above, then enter the transaction reference below.
                              </AlertDescription>
                            </Alert>
                          </CardContent>
                        </Card>
                      )}

                      {/* Payment Reference */}
                      <FormField
                        control={form.control}
                        name="paymentReference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Reference/Transaction ID *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., MTN-123456789 or Bank Ref: TXN7890" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Enter the transaction reference number from your payment
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Payment Proof URL */}
                      <FormField
                        control={form.control}
                        name="paymentProof"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Proof URL (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/receipt.jpg" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Upload your receipt to a cloud service (Google Drive, Dropbox, etc.) and paste the public link here
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Additional Notes */}
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any additional information about your payment..."
                                className="resize-none"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-4">
                        <Button type="submit" disabled={submitting} className="flex-1">
                          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Submit Payment for Approval
                          {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => form.reset()}
                          disabled={submitting}
                        >
                          Reset
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    View all your submitted payments and their approval status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No payments submitted yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Your payment history will appear here once you submit a payment
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableCaption>A list of all your payment submissions</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {new Date(payment.submittedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </TableCell>
                            <TableCell className="font-medium">{payment.subscriptionType}</TableCell>
                            <TableCell className="capitalize">{payment.paymentType}</TableCell>
                            <TableCell className="font-semibold">{formatGHS(payment.amount)}</TableCell>
                            <TableCell className="capitalize">
                              {payment.paymentMethod.replace('_', ' ')}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {payment.paymentReference}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getPaymentStatusIcon(payment.status)}
                                <Badge variant={
                                  payment.status === 'approved' ? 'default' :
                                  payment.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                }>
                                  {payment.status}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">No Subscription Found</h3>
              <p className="text-muted-foreground">
                No subscription details found for this organization.
                <br />
                Please contact support for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

