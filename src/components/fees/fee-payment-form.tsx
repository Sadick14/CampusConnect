'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { recordPayment, getFeeRecord, getStudentFeeRecords } from '@/services/fee';
import { formatCurrency } from '@/lib/currency';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { StudentFeeRecord, PaymentRecord } from '@/schemas/fee';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Validation schema for fee payment form
 */
const PaymentFormSchema = z.object({
  feeRecordId: z.string().min(1, 'Please select a fee to pay'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'momo', 'card', 'cheque', 'other'], {
    errorMap: () => ({ message: 'Please select a payment method' }),
  }),
  amount: z.number().positive('Amount must be greater than 0'),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof PaymentFormSchema>;

interface FeePaymentFormProps {
  organizationId: string;
  studentId: string;
  studentName: string;
  onSuccess?: (payment: PaymentRecord) => void;
  onCancel?: () => void;
}

export function FeePaymentForm({
  organizationId,
  studentId,
  studentName,
  onSuccess,
  onCancel,
}: FeePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [outstandingFees, setOutstandingFees] = useState<StudentFeeRecord[]>([]);
  const [selectedFee, setSelectedFee] = useState<StudentFeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load outstanding fees on mount
  React.useEffect(() => {
    const loadFees = async () => {
      try {
        const fees = await getStudentFeeRecords(organizationId, studentId);
        const outstanding = fees.filter(
          f => f.paymentStatus !== 'paid' && f.paymentStatus !== 'exempted'
        );
        setOutstandingFees(outstanding);
        if (outstanding.length > 0) {
          setSelectedFee(outstanding[0]);
          form.setValue('feeRecordId', outstanding[0].id!);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load fees',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadFees();
  }, [organizationId, studentId, toast]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(PaymentFormSchema),
    defaultValues: {
      feeRecordId: '',
      paymentMethod: 'cash',
      amount: 0,
      transactionId: '',
      notes: '',
    },
  });

  /**
   * Handle fee selection change
   */
  const handleFeeChange = (feeId: string) => {
    const fee = outstandingFees.find(f => f.id === feeId);
    if (fee) {
      setSelectedFee(fee);
      form.setValue('feeRecordId', feeId);
      // Suggest paying the full outstanding amount
      form.setValue('amount', fee.pendingAmount);
    }
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (data: PaymentFormValues) => {
    if (!selectedFee) {
      toast({
        title: 'Error',
        description: 'Please select a fee',
        variant: 'destructive',
      });
      return;
    }

    // Validate amount doesn't exceed outstanding
    if (data.amount > selectedFee.pendingAmount) {
      toast({
        title: 'Error',
        description: `Amount cannot exceed outstanding balance of ${formatCurrency(selectedFee.pendingAmount)}`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate receipt number
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const paymentData = {
        feeRecordId: data.feeRecordId,
        organizationId,
        studentId,
        studentName,
        paymentType: selectedFee.feeType,
        amount: data.amount,
        currency: 'GHS',
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId || undefined,
        receiptNumber,
        recordedBy: 'current-user-id', // Should be from auth context
        paymentDate: new Date(),
        status: 'pending' as const,
        notes: data.notes,
      };

      const payment = await recordPayment(paymentData);

      toast({
        title: 'Success',
        description: `Payment of ${formatCurrency(data.amount)} recorded. Receipt: ${receiptNumber}`,
      });

      // Reset form
      form.reset();
      setSelectedFee(null);

      if (onSuccess) {
        onSuccess(payment);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Record Fee Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (outstandingFees.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Record Fee Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription>
              All fees for {studentName} are paid up to date. No outstanding fees.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Record Fee Payment</CardTitle>
        <CardDescription>
          Record a payment for {studentName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Selected Fee Summary */}
            {selectedFee && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <div className="font-semibold">{selectedFee.feeType.replace(/_/g, ' ').toUpperCase()}</div>
                  <div className="text-sm mt-1">
                    Total Amount: {formatCurrency(selectedFee.amount)} | 
                    Outstanding: {formatCurrency(selectedFee.pendingAmount)}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Fee Selection */}
            <FormField
              control={form.control}
              name="feeRecordId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Fee to Pay</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={handleFeeChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a fee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {outstandingFees.map(fee => (
                        <SelectItem key={fee.id} value={fee.id!}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">
                              {fee.feeType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({formatCurrency(fee.pendingAmount)} outstanding)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose which fee to record payment for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount to Pay */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (GHS)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">GHS</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  {selectedFee && (
                    <FormDescription>
                      Outstanding balance: {formatCurrency(selectedFee.pendingAmount)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0"
                        onClick={() => form.setValue('amount', selectedFee.pendingAmount)}
                      >
                        Pay full amount
                      </Button>
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="momo">Mobile Money</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transaction ID (for non-cash methods) */}
            {form.watch('paymentMethod') !== 'cash' && (
              <FormField
                control={form.control}
                name="transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID / Reference</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., TXN123456 or Cheque #"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Reference number for bank transfer, mobile money, or cheque
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this payment..."
                      {...field}
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>

        {/* Quick Tips */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold text-sm mb-2">📝 Quick Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• You can record partial payments</li>
            <li>• Each payment generates a receipt number automatically</li>
            <li>• Payments start in "Pending" status and require approval</li>
            <li>• Keep transaction IDs for record-keeping</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
