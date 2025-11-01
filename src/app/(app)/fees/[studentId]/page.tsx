'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getStudentFeeRecords, getStudentPayments } from '@/services/fee';
import { formatCurrency } from '@/lib/currency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import { StudentFeeRecord, PaymentRecord } from '@/schemas/fee';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  exempted: 'bg-purple-100 text-purple-800',
};

export default function StudentFeesSummaryPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const { school } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!school?.id || !studentId) return;

      setLoading(true);
      try {
        const [fees, paymentsData] = await Promise.all([
          getStudentFeeRecords(school.id, studentId),
          getStudentPayments(school.id, studentId),
        ]);

        setFeeRecords(fees);
        setPayments(paymentsData);
        if (fees.length > 0) {
          setStudentName(fees[0].studentName);
        }
      } catch (error) {
        console.error('Error loading student fees:', error);
        toast({
          title: 'Error',
          description: 'Failed to load student fees',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [school?.id, studentId, toast]);

  /**
   * Calculate total outstanding balance
   */
  const totalBalance = feeRecords.reduce((sum, fee) => sum + fee.pendingAmount, 0);
  const totalPaid = feeRecords.reduce((sum, fee) => sum + fee.paidAmount, 0);
  const totalExpected = feeRecords.reduce((sum, fee) => sum + fee.amount, 0);
  const collectionRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

  /**
   * Get next due fee
   */
  const nextDue = feeRecords
    .filter(f => f.paymentStatus !== 'paid' && f.paymentStatus !== 'exempted')
    .sort((a, b) => {
      const dateA = (a.dueDate as any).toDate?.() || new Date(a.dueDate);
      const dateB = (b.dueDate as any).toDate?.() || new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    })[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/fees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{studentName}</h1>
          <p className="text-muted-foreground">Financial Summary & Payment History</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Owing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Amount due</p>
          </CardContent>
        </Card>

        {/* Total Paid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Payments made</p>
          </CardContent>
        </Card>

        {/* Expected Total */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All fees combined</p>
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Paid out of total</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={collectionRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(totalPaid)} paid</span>
              <span>{formatCurrency(totalBalance)} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Due Alert */}
      {nextDue && (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <div className="font-semibold">Next Due: {nextDue.feeType.replace(/_/g, ' ')}</div>
            <div className="text-sm mt-1">
              Amount: {formatCurrency(nextDue.pendingAmount)} • Due: {' '}
              {new Date((nextDue.dueDate as any).toDate?.() || nextDue.dueDate).toLocaleDateString()}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Fee Records */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Breakdown</CardTitle>
          <CardDescription>All fees assigned to this student</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fee Type</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No fees assigned
                    </TableCell>
                  </TableRow>
                ) : (
                  feeRecords.map(record => {
                    const progress =
                      record.amount > 0 ? Math.round((record.paidAmount / record.amount) * 100) : 0;
                    return (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium capitalize">
                          {record.feeType.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(record.amount)}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(record.paidAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(record.pendingAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={(PAYMENT_STATUS_COLORS as any)[record.paymentStatus]}>
                            {record.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(
                            (record.dueDate as any).toDate?.() || record.dueDate
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Progress value={progress} className="h-1.5 w-12" />
                            <span className="text-xs font-medium">{progress}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All payments made towards fees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fee Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No payment history
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map(payment => (
                    <TableRow key={payment.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium capitalize">
                        {payment.paymentType.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="capitalize text-sm">
                        {payment.paymentMethod.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {payment.receiptNumber}
                      </TableCell>
                      <TableCell>
                        <Badge className={(PAYMENT_STATUS_COLORS as any)[payment.status]}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(
                          (payment.paymentDate as any).toDate?.() || payment.paymentDate
                        ).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link href={`/students/${studentId}`}>
          <Button variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Student Profile
          </Button>
        </Link>
        {totalBalance > 0 && (
          <Link href={`/fees/record-payment?studentId=${studentId}`}>
            <Button className="w-full sm:w-auto">
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </Link>
        )}
        <Button variant="outline" className="w-full sm:w-auto">
          <FileText className="h-4 w-4 mr-2" />
          Print Statement
        </Button>
      </div>
    </div>
  );
}
