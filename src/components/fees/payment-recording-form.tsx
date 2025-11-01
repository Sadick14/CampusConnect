'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { recordPayment, getStudentFeeRecords } from '@/services/fee';
import { StudentFeeRecord, PaymentRecordInput } from '@/schemas/fee';
import { formatCurrency } from '@/lib/currency';
import { Plus, CreditCard, Loader2 } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'momo', label: 'Mobile Money (MTN/Vodafone/AirtelTigo)' },
  { value: 'card', label: 'Card Payment' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  feeRecordId: z.string().min(1, 'Please select a fee record'),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'momo', 'card', 'cheque', 'other']),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentRecordingFormProps {
  onPaymentRecorded?: () => void;
}

export function PaymentRecordingForm({ onPaymentRecorded }: PaymentRecordingFormProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>([]);
  const [loadingFeeRecords, setLoadingFeeRecords] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentId: '',
      feeRecordId: '',
      amount: 0,
      paymentMethod: 'cash',
      transactionId: '',
      notes: '',
    },
  });

  // Load students when dialog opens
  useEffect(() => {
    if (open && currentUser?.schoolId) {
      loadStudents();
    }
  }, [open, currentUser?.schoolId]);

  // Load fee records when student is selected
  useEffect(() => {
    if (selectedStudent && currentUser?.schoolId) {
      loadStudentFeeRecords(selectedStudent);
    }
  }, [selectedStudent, currentUser?.schoolId]);

  const loadStudents = async () => {
    try {
      // TODO: Replace with actual student service
      // For now, we'll use a placeholder
      setStudents([
        { id: 'student1', name: 'John Doe', className: 'Grade 10A' },
        { id: 'student2', name: 'Jane Smith', className: 'Grade 9B' },
        { id: 'student3', name: 'Bob Johnson', className: 'Grade 11C' },
      ]);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadStudentFeeRecords = async (studentId: string) => {
    if (!currentUser?.schoolId) return;

    setLoadingFeeRecords(true);
    try {
      const records = await getStudentFeeRecords(currentUser.schoolId, studentId);
      // Filter to only show unpaid or partially paid fees
      const payableRecords = records.filter(record =>
        record.paymentStatus === 'pending' ||
        record.paymentStatus === 'partial' ||
        record.paymentStatus === 'overdue'
      );
      setFeeRecords(payableRecords);
    } catch (error) {
      console.error('Error loading fee records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fee records',
        variant: 'destructive',
      });
    } finally {
      setLoadingFeeRecords(false);
    }
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RCP-${timestamp}-${random}`;
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!currentUser?.schoolId || !currentUser?.id) return;

    setLoading(true);
    try {
      const selectedFeeRecord = feeRecords.find(record => record.id === data.feeRecordId);
      if (!selectedFeeRecord) {
        throw new Error('Selected fee record not found');
      }

      const selectedStudentData = students.find(student => student.id === data.studentId);
      if (!selectedStudentData) {
        throw new Error('Selected student not found');
      }

      const paymentData: PaymentRecordInput = {
        schoolId: currentUser.schoolId,
        studentId: data.studentId,
        studentName: selectedStudentData.name,
        feeRecordId: data.feeRecordId,
        paymentType: selectedFeeRecord.feeType,
        amount: data.amount,
        currency: 'GHS',
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId || undefined,
        receiptNumber: generateReceiptNumber(),
        recordedBy: currentUser.id,
        paymentDate: new Date(),
        status: 'pending', // Requires approval
        notes: data.notes,
      };

      await recordPayment(paymentData);

      toast({
        title: 'Payment Recorded',
        description: `Payment of ${formatCurrency(data.amount)} recorded successfully and pending approval.`,
      });

      form.reset();
      setSelectedStudent('');
      setFeeRecords([]);
      setOpen(false);
      onPaymentRecorded?.();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedFeeRecord = feeRecords.find(record => record.id === form.watch('feeRecordId'));
  const maxAmount = selectedFeeRecord ? selectedFeeRecord.pendingAmount : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Record New Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment received from a student. Payment will require approval before being applied to their account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Student Selection */}
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedStudent(value);
                      form.setValue('feeRecordId', ''); // Reset fee record selection
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} - {student.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fee Record Selection */}
            {selectedStudent && (
              <FormField
                control={form.control}
                name="feeRecordId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Type</FormLabel>
                    {loadingFeeRecords ? (
                      <div className="flex items-center gap-2 p-2 border rounded">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading fee records...
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fee type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {feeRecords.map((record) => (
                            <SelectItem key={record.id} value={record.id}>
                              {record.feeType.replace(/_/g, ' ').toUpperCase()} - Outstanding: {formatCurrency(record.pendingAmount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (GHS)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  {selectedFeeRecord && (
                    <p className="text-sm text-muted-foreground">
                      Maximum outstanding: {formatCurrency(maxAmount)}
                    </p>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transaction ID */}
            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction/Reference ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter transaction ID or reference number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this payment..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}