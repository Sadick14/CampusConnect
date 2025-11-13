'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Smartphone,
  Building2,
  Wallet,
  CreditCard,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ListPageSkeleton } from '@/components/common/page-skeletons';
import { getOrganizationInvoices, submitInvoicePayment } from '@/services/invoice';
import { getPaymentSettings } from '@/services/payment-settings';
import type { Invoice } from '@/schemas/invoice';
import type { PaymentSettings } from '@/schemas/payment-settings';
import { invoicePaymentSchema, type InvoicePaymentFormValues } from '@/schemas/invoice';
import { formatGHS } from '@/schemas/subscription';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export default function InvoicesPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  const form = useForm<InvoicePaymentFormValues>({
    resolver: zodResolver(invoicePaymentSchema),
    defaultValues: {
      paymentMethod: 'mobile_money',
      paymentReference: '',
      paymentProof: '',
      notes: '',
    },
  });

  const watchedPaymentMethod = form.watch('paymentMethod');

  // Load invoices
  useEffect(() => {
    async function loadInvoices() {
      if (!currentUser?.currentOrganizationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [invoiceData, settings] = await Promise.all([
          getOrganizationInvoices(currentUser.currentOrganizationId),
          getPaymentSettings(),
        ]);
        
        setInvoices(invoiceData);
        setPaymentSettings(settings);
      } catch (error) {
        console.error('Error loading invoices:', error);
        toast({
          title: 'Error',
          description: 'Failed to load invoices',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, [currentUser, toast]);

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
    form.reset();
  };

  const onSubmitPayment = async (values: InvoicePaymentFormValues) => {
    if (!selectedInvoice) return;

    setSubmitting(true);
    try {
      await submitInvoicePayment(selectedInvoice.id, {
        invoiceId: selectedInvoice.id,
        ...values,
      });

      toast({
        title: 'Payment Submitted Successfully!',
        description: 'Your payment has been recorded. The invoice is now marked as paid.',
      });

      // Refresh invoices
      if (currentUser?.currentOrganizationId) {
        const updatedInvoices = await getOrganizationInvoices(currentUser.currentOrganizationId);
        setInvoices(updatedInvoices);
      }

      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
      form.reset();
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: 'Payment Submission Failed',
        description: 'Please try again or contact support',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <ListPageSkeleton title="Invoices" />;
  }

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Invoices"
        description="View and pay your subscription invoices"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{invoices.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">{formatGHS(totalPending)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingInvoices.length} invoice(s) pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-500">{formatGHS(totalPaid)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidInvoices.length} invoice(s) paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>View and manage your subscription invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No invoices found</p>
              <p className="text-sm text-muted-foreground">
                Invoices will appear here once generated
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.description}</p>
                        {invoice.billingPeriod && (
                          <p className="text-sm text-muted-foreground">
                            Period: {invoice.billingPeriod}
                          </p>
                        )}
                        {invoice.studentCount && (
                          <p className="text-xs text-muted-foreground">
                            {invoice.studentCount} students × {formatGHS(invoice.perStudentFee || 0)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(invoice.issueDate as Date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDate(invoice.dueDate as Date)}
                        {invoice.status === 'overdue' && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatGHS(invoice.amount)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                        <Button
                          size="sm"
                          onClick={() => handlePayInvoice(invoice)}
                        >
                          Pay Now
                        </Button>
                      )}
                      {invoice.status === 'paid' && invoice.paidDate && (
                        <p className="text-xs text-muted-foreground">
                          Paid: {formatDate(invoice.paidDate as Date)}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pay Invoice</DialogTitle>
            <DialogDescription>
              Submit payment for {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              {/* Invoice Details */}
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Invoice Number</p>
                      <p className="font-semibold">{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount Due</p>
                      <p className="font-bold text-lg text-primary">{formatGHS(selectedInvoice.amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p className="font-semibold">{formatDate(selectedInvoice.dueDate as Date)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Description</p>
                      <p className="font-semibold">{selectedInvoice.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPayment)} className="space-y-4">
                  {/* Payment Method */}
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
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

                  {/* Payment Account Details */}
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
                          Enter the transaction reference from your payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Proof */}
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
                          Upload your receipt to a cloud service and paste the URL here
                        </FormDescription>
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
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional information about the payment..." 
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
                      onClick={() => setPaymentDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Submit Payment
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
