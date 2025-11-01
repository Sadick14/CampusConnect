
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { PageHeader } from '@/components/common/page-header';

const paymentSchema = z.object({
  planType: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  paymentMethod: z.enum(['mobile_money', 'bank_transfer', 'cash', 'cheque', 'other']),
  paymentReference: z.string().min(5, 'Payment reference is required'),
  paymentProof: z.string().url('Must be a valid URL').optional().or(z.literal('')),
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

  useEffect(() => {
    async function loadData() {
      if (!currentUser?.currentOrganizationId) {
        if (!loading) router.push('/organizations');
        return;
      }

      try {
        await updateSubscriptionStatus(currentUser.currentOrganizationId);
        const sub = await getSubscription(currentUser.currentOrganizationId);
        setSubscription(sub);
        if (sub) {
          const paymentHistory = await getSchoolPayments(currentUser.currentOrganizationId);
          setPayments(paymentHistory);
        }
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
  }, [currentUser, router, toast, loading]);

  async function onSubmit(values: PaymentFormValues) {
    if (!currentUser?.currentOrganizationId || !currentUser?.name) {
      toast({
        title: 'Error',
        description: 'Organization information not found',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await submitPayment(
        currentUser.currentOrganizationId,
        currentUser.name, // Assuming user name is sufficient
        values.planType,
        'upfront', // Or determine based on logic
        0, // student count
        values.paymentMethod,
        values.paymentReference,
        values.paymentProof || undefined,
        values.notes || undefined
      );

      toast({
        title: 'Payment Submitted Successfully!',
        description: 'Your payment is being reviewed.',
      });

      // Refresh data
      const sub = await getSubscription(currentUser.currentOrganizationId);
      setSubscription(sub);
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
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscription & Billing"
        description="Manage your organization's subscription plan and view payment history."
      />

      {subscription ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
              <CardDescription>
                Your current subscription details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant={subscription.subscriptionStatus === 'active' ? 'default' : 'destructive'}>
                {subscription.subscriptionStatus.toUpperCase()}
              </Badge>
              <p>Plan: {subscription.subscriptionType}</p>
              <p>Ends on: {subscription.subscriptionEndDate ? new Date(subscription.subscriptionEndDate).toLocaleDateString() : 'N/A'}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="plans" className="w-full">
            <TabsList>
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="payment">Submit Payment</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="plans">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {Object.entries(SUBSCRIPTION_PLANS).filter(([key]) => key !== 'TRIAL').map(([key, plan]) => (
                     <Card key={key} className={selectedPlan === key ? 'ring-2 ring-primary' : ''} onClick={() => setSelectedPlan(key as Exclude<SubscriptionPlanType, 'TRIAL'>)}>
                          <CardHeader>
                              <CardTitle>{plan.name}</CardTitle>
                              <CardDescription>{formatGHS(plan.upfrontFee)} upfront + {formatGHS(plan.perStudentFee)}/student/month</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul>
                              {plan.features.map((feature, i) => <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{feature}</li>)}
                            </ul>
                          </CardContent>
                     </Card>
                  ))}
                </div>
            </TabsContent>
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Submit a Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                       <FormField
                        control={form.control}
                        name="planType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plan</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="BASIC">Basic</SelectItem>
                                <SelectItem value="STANDARD">Standard</SelectItem>
                                <SelectItem value="PREMIUM">Premium</SelectItem>
                              </SelectContent>
                            </Select>
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
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                              <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="mobile_money" /></FormControl>
                                <FormLabel className="font-normal">Mobile Money</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="bank_transfer" /></FormControl>
                                <FormLabel className="font-normal">Bank Transfer</FormLabel>
                              </FormItem>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="paymentReference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reference</FormLabel>
                            <FormControl><Input placeholder="Transaction ID" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
                <CardContent>
                  {payments.length === 0 ? <p>No payments made.</p> :
                  <ul>
                    {payments.map(p => <li key={p.id}>{new Date(p.submittedAt).toLocaleDateString()}: {formatGHS(p.amount)} ({p.status})</li>)}
                  </ul>
                  }
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <p>No subscription details found for this organization.</p>
      )}
    </div>
  );
}

