'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Building,
  CreditCard,
  Calendar,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getPendingPayments, approvePayment, rejectPayment } from '@/services/subscription';
import type { PaymentRecord } from '@/schemas/subscription';
import { formatGHS, SUBSCRIPTION_PLANS } from '@/schemas/subscription';
import { Separator } from '@/components/ui/separator';

const approvalSchema = z.object({
  notes: z.string().optional(),
});

const rejectionSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason for rejection'),
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;
type RejectionFormValues = z.infer<typeof rejectionSchema>;

export default function PaymentManagementPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const approvalForm = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      notes: '',
    },
  });

  const rejectionForm = useForm<RejectionFormValues>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      reason: '',
    },
  });

  useEffect(() => {
    // Check if user is superadmin
    if (currentUser && currentUser.role !== 'superadmin') {
      router.push('/dashboard');
      return;
    }

    loadPayments();
  }, [currentUser, router]);

  async function loadPayments() {
    try {
      const pendingPayments = await getPendingPayments();
      setPayments(pendingPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(values: ApprovalFormValues) {
    if (!selectedPayment || !currentUser) return;

    setProcessing(true);
    try {
      await approvePayment(
        selectedPayment.id!,
        currentUser.id,
        currentUser.name,
        values.notes
      );

      toast({
        title: 'Payment Approved',
        description: `Payment for ${selectedPayment.schoolName} has been approved.`,
      });

      setApproveDialogOpen(false);
      setSelectedPayment(null);
      approvalForm.reset();
      await loadPayments();
    } catch (error: any) {
      console.error('Error approving payment:', error);
      toast({
        title: 'Approval Failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject(values: RejectionFormValues) {
    if (!selectedPayment || !currentUser) return;

    setProcessing(true);
    try {
      await rejectPayment(
        selectedPayment.id!,
        currentUser.id,
        currentUser.name,
        values.reason
      );

      toast({
        title: 'Payment Rejected',
        description: `Payment for ${selectedPayment.schoolName} has been rejected.`,
      });

      setRejectDialogOpen(false);
      setSelectedPayment(null);
      rejectionForm.reset();
      await loadPayments();
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      toast({
        title: 'Rejection Failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve school subscription payments
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {payments.length} Pending
        </Badge>
      </div>

      {/* Pending Payments List */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground text-center">
              There are no pending payments to review at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{payment.schoolName}</CardTitle>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Review
                      </Badge>
                    </div>
                    <CardDescription>
                      Submitted on {new Date(payment.submittedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{formatGHS(payment.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {SUBSCRIPTION_PLANS[payment.subscriptionType].name}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Payment Method</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {payment.paymentMethod.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Reference Number</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {payment.paymentReference}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Billing Period</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.billingStartDate).toLocaleDateString()} -{' '}
                          {new Date(payment.billingEndDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">School ID</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {payment.schoolId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Proof */}
                {payment.paymentProof && (
                  <div>
                    <p className="text-sm font-medium mb-2">Payment Proof</p>
                    <a
                      href={payment.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Receipt / Proof
                    </a>
                  </div>
                )}

                {/* Notes */}
                {payment.notes && (
                  <div>
                    <p className="text-sm font-medium mb-2">Additional Notes</p>
                    <Alert>
                      <AlertDescription className="text-sm">{payment.notes}</AlertDescription>
                    </Alert>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setApproveDialogOpen(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Payment
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setRejectDialogOpen(true);
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              You are about to approve the payment for{' '}
              <strong>{selectedPayment?.schoolName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>This action will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Activate the school&apos;s {selectedPayment && SUBSCRIPTION_PLANS[selectedPayment.subscriptionType].name}</li>
                <li>Unlock their account immediately</li>
                <li>Grant access based on their billing period</li>
                <li>Send confirmation notification to the school</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Form {...approvalForm}>
            <form onSubmit={approvalForm.handleSubmit(handleApprove)} className="space-y-4">
              <FormField
                control={approvalForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approval Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes or comments about this approval..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApproveDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700">
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Approval
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              You are about to reject the payment for{' '}
              <strong>{selectedPayment?.schoolName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>This action will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Lock the school&apos;s account</li>
                <li>Mark the payment as rejected</li>
                <li>Notify the school with your rejection reason</li>
                <li>Require them to resubmit payment</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Form {...rejectionForm}>
            <form onSubmit={rejectionForm.handleSubmit(handleReject)} className="space-y-4">
              <FormField
                control={rejectionForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection Reason *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed reason for rejection (e.g., Invalid receipt, Amount mismatch, Unclear payment proof, etc.)"
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={processing}>
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Rejection
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
