'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  getSchoolFeeRecords,
  getSchoolPayments,
  calculateFeeSummary,
  updatePaymentStatus,
  deletePayment,
} from '@/services/fee';
import { formatCurrency } from '@/lib/currency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CreditCard,
  Download,
  Filter,
  MoreVertical,
  Plus,
  Loader2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
} from 'lucide-react';
import { StudentFeeRecord, PaymentRecord, FeeSummary } from '@/schemas/fee';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/common/page-header';
import { PaymentRecordingForm } from '@/components/fees/payment-recording-form';

const FEE_TYPES = [
  { value: 'school_fees', label: 'School Fees' },
  { value: 'feeding_fees', label: 'Feeding/Lunch Fees' },
  { value: 'books', label: 'Books & Materials' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'uniform', label: 'Uniform' },
  { value: 'activity', label: 'Activity Fees' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_STATUS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'partial', label: 'Partial', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
  { value: 'exempted', label: 'Exempted', color: 'bg-purple-100 text-purple-800' },
];

export default function FeesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFeeType, setFilterFeeType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [academicYear, setAcademicYear] = useState('2024/2025');

  useEffect(() => {
    async function loadData() {
      if (!currentUser?.schoolId) return;

      setLoading(true);
      try {
        // Load fee records and payments in parallel
        const [fees, paymentsData, summaryData] = await Promise.all([
          getSchoolFeeRecords(currentUser.schoolId, { academicYear }),
          getSchoolPayments(currentUser.schoolId),
          calculateFeeSummary(currentUser.schoolId, academicYear),
        ]);

        setFeeRecords(fees);
        setPayments(paymentsData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Error loading fees data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load fees data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser?.schoolId, academicYear, toast, refreshTrigger]);

  /**
   * Filter fee records based on search and filters
   */
  const filteredFeeRecords = feeRecords.filter(record => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFeeType = filterFeeType === 'all' || record.feeType === filterFeeType;
    const matchesStatus = filterStatus === 'all' || record.paymentStatus === filterStatus;
    return matchesSearch && matchesFeeType && matchesStatus;
  });

  /**
   * Filter payments
   */
  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod =
      filterPaymentMethod === 'all' || payment.paymentMethod === filterPaymentMethod;
    return matchesSearch && matchesMethod;
  });

  /**
   * Handle approve payment
   */
  const handleApprovePayment = async (paymentId: string) => {
    try {
      await updatePaymentStatus(paymentId, 'confirmed', currentUser?.id);
      setPayments(payments.map(p =>
        p.id === paymentId ? { ...p, status: 'confirmed' } : p
      ));
      toast({
        title: 'Success',
        description: 'Payment approved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve payment',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle reject payment
   */
  const handleRejectPayment = async (paymentId: string) => {
    try {
      await updatePaymentStatus(paymentId, 'rejected', currentUser?.id);
      setPayments(payments.map(p =>
        p.id === paymentId ? { ...p, status: 'rejected' } : p
      ));
      toast({
        title: 'Success',
        description: 'Payment rejected',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject payment',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle delete payment
   */
  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    try {
      await deletePayment(selectedPayment.id!);
      setPayments(payments.filter(p => p.id !== selectedPayment.id));
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
      toast({
        title: 'Success',
        description: 'Payment deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete payment',
        variant: 'destructive',
      });
    }
  };

  /**
   * Get status badge color
   */
  const handlePaymentRecorded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  /**
   * Get status badge color
   */
  const getStatusBadgeColor = (status: string) => {
    const statusConfig = PAYMENT_STATUS.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fees Collection & Management"
        description="Track all school fees, feeding fees, and other payment collections"
        actions={<PaymentRecordingForm onPaymentRecorded={handlePaymentRecorded} />}
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          {/* Total Expected */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalFeesExpected)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Academic Year {academicYear}
              </p>
            </CardContent>
          </Card>

          {/* Total Collected */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalFeesPaid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.collectionRate}% collected
              </p>
            </CardContent>
          </Card>

          {/* Outstanding */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.totalFeesExpected - summary.totalFeesPaid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {100 - summary.collectionRate}% pending
              </p>
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalFeesOverdue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Past due date
              </p>
            </CardContent>
          </Card>

          {/* Collection Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Collection Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.collectionRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                School efficiency
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for Fees vs Payments */}
      <div className="space-y-4">
        {/* Fees Ledger Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fee Records Ledger</CardTitle>
                <CardDescription>
                  All fees assigned to students for {academicYear}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Search by student or class..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={filterFeeType} onValueChange={setFilterFeeType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fee Types</SelectItem>
                  {FEE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {PAYMENT_STATUS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeeRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No fee records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFeeRecords.map(record => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{record.studentName}</TableCell>
                        <TableCell>{record.className}</TableCell>
                        <TableCell className="capitalize">
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
                          <Badge className={getStatusBadgeColor(record.paymentStatus)}>
                            {record.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(
                            (record.dueDate as any).toDate?.() || record.dueDate
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

        {/* Payments Processing Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment Records</CardTitle>
                <CardDescription>
                  All payment transactions for review and approval
                </CardDescription>
              </div>
              <Badge variant="outline">{filteredPayments.length} payments</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Search by student..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="momo">Mobile Money</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pending Approval Alert */}
            {payments.some(p => p.status === 'pending') && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  {payments.filter(p => p.status === 'pending').length} payments pending approval
                </AlertDescription>
              </Alert>
            )}

            {/* Payment Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Student</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No payment records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map(payment => (
                      <TableRow key={payment.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{payment.studentName}</TableCell>
                        <TableCell className="capitalize">
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
                          <Badge className={getStatusBadgeColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(
                            (payment.paymentDate as any).toDate?.() || payment.paymentDate
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a href={`#`} className="flex items-center">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </a>
                              </DropdownMenuItem>
                              {payment.status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprovePayment(payment.id!)}>
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRejectPayment(payment.id!)}>
                                    <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Payment Record?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the payment {selectedPayment?.receiptNumber}?
            This action cannot be undone, and the fee balance will be recalculated.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
