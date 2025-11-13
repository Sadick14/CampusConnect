'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DollarSign,
  Calendar,
  UtensilsCrossed,
  BookOpen,
  Bus,
  Shirt,
  Trophy,
  MoreHorizontal,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { getStudentsByClass } from '@/services/student';
import { getSchoolClasses } from '@/services/class';
import { 
  recordBulkFeedingFees, 
  recordInstallmentPayment,
  getStudentFeeBalance,
  createInstallmentPlan,
} from '@/services/fee';
import { SchoolClass } from '@/schemas/class';
import { format } from 'date-fns';

interface StudentPayment {
  studentId: string;
  studentName: string;
  amount: number;
  isPaid: boolean;
  balance?: number;
  installmentPlan?: InstallmentPlan;
}

interface InstallmentPlan {
  totalAmount: number;
  amountPaid: number;
  installments: Installment[];
}

interface Installment {
  number: number;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
  paidAmount?: number;
}

export default function RecordPaymentPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('school-fees');
  
  // Feeding fees state
  const [feedingDate, setFeedingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [feedingType, setFeedingType] = useState<'daily' | 'weekly'>('daily');
  const [feedingAmount, setFeedingAmount] = useState('3.00');
  const [feedingPayments, setFeedingPayments] = useState<StudentPayment[]>([]);
  
  // School fees state
  const [schoolFeePayments, setSchoolFeePayments] = useState<StudentPayment[]>([]);
  const [installmentDialog, setInstallmentDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [installmentAmount, setInstallmentAmount] = useState('');
  
  // Other fees state
  const [otherFeeType, setOtherFeeType] = useState('books');
  const [otherFeeAmount, setOtherFeeAmount] = useState('');
  const [otherFeePayments, setOtherFeePayments] = useState<StudentPayment[]>([]);

  useEffect(() => {
    if (currentUser?.currentOrganizationId) {
      loadClasses();
    }
  }, [currentUser?.currentOrganizationId]);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    if (!currentUser?.currentOrganizationId) return;
    
    setLoading(true);
    try {
      const classesData = await getSchoolClasses(currentUser.currentOrganizationId);
      setClasses(classesData.filter(c => c.isActive));
    } catch (error) {
      console.error('Error loading classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load classes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!currentUser?.currentOrganizationId || !selectedClass) return;
    
    setLoading(true);
    try {
      const studentsData = await getStudentsByClass(
        currentUser.currentOrganizationId,
        selectedClass
      );
      
      setStudents(studentsData.filter((s: any) => s.status === 'active'));
      
      // Initialize feeding payments
      setFeedingPayments(
        studentsData.filter((s: any) => s.status === 'active').map((s: any) => ({
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          amount: parseFloat(feedingAmount),
          isPaid: false,
        }))
      );
      
      // Initialize school fee payments with balances
      const schoolFeeData = await Promise.all(
        studentsData.filter((s: any) => s.status === 'active').map(async (s: any) => {
          const balance = await getStudentFeeBalance(
            currentUser.currentOrganizationId!,
            s.id,
            'school_fees'
          );
          return {
            studentId: s.id,
            studentName: `${s.firstName} ${s.lastName}`,
            amount: 0,
            isPaid: false,
            balance: balance || 0,
          };
        })
      );
      setSchoolFeePayments(schoolFeeData);
      
      // Initialize other fee payments
      setOtherFeePayments(
        studentsData.filter((s: any) => s.status === 'active').map((s: any) => ({
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          amount: 0,
          isPaid: false,
        }))
      );
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedingPaymentToggle = (studentId: string) => {
    setFeedingPayments(prev =>
      prev.map(p =>
        p.studentId === studentId ? { ...p, isPaid: !p.isPaid } : p
      )
    );
  };

  const handleSelectAllFeeding = (checked: boolean) => {
    setFeedingPayments(prev => prev.map(p => ({ ...p, isPaid: checked })));
  };

  const handleSaveFeedingFees = async () => {
    if (!currentUser?.currentOrganizationId) return;
    
    const paidStudents = feedingPayments.filter(p => p.isPaid);
    if (paidStudents.length === 0) {
      toast({
        title: 'No Payments',
        description: 'Please select at least one student',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    try {
      await recordBulkFeedingFees({
        organizationId: currentUser.currentOrganizationId,
        classId: selectedClass,
        date: feedingDate,
        type: feedingType,
        amount: parseFloat(feedingAmount),
        students: paidStudents.map(p => ({
          studentId: p.studentId,
          studentName: p.studentName,
        })),
      });
      
      toast({
        title: 'Success',
        description: `Recorded feeding fees for ${paidStudents.length} student(s)`,
      });
      
      // Reset
      setFeedingPayments(prev => prev.map(p => ({ ...p, isPaid: false })));
    } catch (error) {
      console.error('Error saving feeding fees:', error);
      toast({
        title: 'Error',
        description: 'Failed to record feeding fees',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenInstallmentDialog = (student: any) => {
    setSelectedStudent(student);
    setInstallmentAmount('');
    setInstallmentDialog(true);
  };

  const handleRecordInstallment = async () => {
    if (!currentUser?.currentOrganizationId || !selectedStudent) return;
    
    const amount = parseFloat(installmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    try {
      await recordInstallmentPayment({
        organizationId: currentUser.currentOrganizationId,
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.studentName,
        feeType: 'school_fees',
        amount,
        paymentDate: new Date().toISOString(),
      });
      
      toast({
        title: 'Success',
        description: `Recorded installment payment of GH₵${amount.toFixed(2)}`,
      });
      
      setInstallmentDialog(false);
      loadStudents(); // Reload to update balances
    } catch (error) {
      console.error('Error recording installment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record installment payment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOtherFeeAmountChange = (studentId: string, amount: string) => {
    setOtherFeePayments(prev =>
      prev.map(p =>
        p.studentId === studentId 
          ? { ...p, amount: parseFloat(amount) || 0, isPaid: parseFloat(amount) > 0 } 
          : p
      )
    );
  };

  const handleSaveOtherFees = async () => {
    if (!currentUser?.currentOrganizationId) return;
    
    const paidStudents = otherFeePayments.filter(p => p.isPaid && p.amount > 0);
    if (paidStudents.length === 0) {
      toast({
        title: 'No Payments',
        description: 'Please enter amounts for at least one student',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    try {
      // Record each payment
      await Promise.all(
        paidStudents.map(p =>
          recordInstallmentPayment({
            organizationId: currentUser.currentOrganizationId!,
            studentId: p.studentId,
            studentName: p.studentName,
            feeType: otherFeeType as any,
            amount: p.amount,
            paymentDate: new Date().toISOString(),
          })
        )
      );
      
      toast({
        title: 'Success',
        description: `Recorded ${otherFeeType} fees for ${paidStudents.length} student(s)`,
      });
      
      // Reset
      setOtherFeePayments(prev => prev.map(p => ({ ...p, amount: 0, isPaid: false })));
    } catch (error) {
      console.error('Error saving fees:', error);
      toast({
        title: 'Error',
        description: 'Failed to record fees',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getFeeTypeIcon = (type: string) => {
    switch (type) {
      case 'school-fees':
        return <DollarSign className="h-4 w-4" />;
      case 'feeding':
        return <UtensilsCrossed className="h-4 w-4" />;
      case 'books':
        return <BookOpen className="h-4 w-4" />;
      case 'transportation':
        return <Bus className="h-4 w-4" />;
      case 'uniform':
        return <Shirt className="h-4 w-4" />;
      case 'activity':
        return <Trophy className="h-4 w-4" />;
      default:
        return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Payments"
        description="Record fee payments for students by fee type"
      />

      {/* Class Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class</CardTitle>
          <CardDescription>Choose a class to record payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.className}>
                  {cls.className} - {cls.currentEnrollment} students
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClass && students.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="school-fees" className="flex items-center gap-2">
              {getFeeTypeIcon('school-fees')}
              <span className="hidden sm:inline">School Fees</span>
            </TabsTrigger>
            <TabsTrigger value="feeding" className="flex items-center gap-2">
              {getFeeTypeIcon('feeding')}
              <span className="hidden sm:inline">Feeding</span>
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-2">
              {getFeeTypeIcon('books')}
              <span className="hidden sm:inline">Books</span>
            </TabsTrigger>
            <TabsTrigger value="transportation" className="flex items-center gap-2">
              {getFeeTypeIcon('transportation')}
              <span className="hidden sm:inline">Transport</span>
            </TabsTrigger>
            <TabsTrigger value="uniform" className="flex items-center gap-2">
              {getFeeTypeIcon('uniform')}
              <span className="hidden sm:inline">Uniform</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              {getFeeTypeIcon('activity')}
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="other" className="flex items-center gap-2">
              {getFeeTypeIcon('other')}
              <span className="hidden sm:inline">Other</span>
            </TabsTrigger>
          </TabsList>

          {/* School Fees Tab - Installment Payments */}
          <TabsContent value="school-fees">
            <Card>
              <CardHeader>
                <CardTitle>School Fees - Installment Payments</CardTitle>
                <CardDescription>
                  Record installment payments for school fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Balance Due</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schoolFeePayments.map((payment) => (
                      <TableRow key={payment.studentId}>
                        <TableCell className="font-medium">
                          {payment.studentName}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.balance! > 0 ? 'destructive' : 'secondary'}>
                            GH₵{payment.balance?.toFixed(2) || '0.00'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleOpenInstallmentDialog(payment)}
                            disabled={saving}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Pay Installment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feeding Fees Tab - Daily/Weekly Collection */}
          <TabsContent value="feeding">
            <Card>
              <CardHeader>
                <CardTitle>Feeding Fees - Daily/Weekly Collection</CardTitle>
                <CardDescription>
                  Record feeding fee payments for students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={feedingDate}
                      onChange={(e) => setFeedingDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Collection Type</Label>
                    <Select value={feedingType} onValueChange={(v: any) => setFeedingType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount (GH₵)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={feedingAmount}
                      onChange={(e) => setFeedingAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => handleSelectAllFeeding(true)}
                      variant="outline"
                      className="w-full"
                    >
                      Select All
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={feedingPayments.every(p => p.isPaid)}
                          onCheckedChange={handleSelectAllFeeding}
                        />
                      </TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedingPayments.map((payment) => (
                      <TableRow key={payment.studentId}>
                        <TableCell>
                          <Checkbox
                            checked={payment.isPaid}
                            onCheckedChange={() => handleFeedingPaymentToggle(payment.studentId)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.studentName}
                        </TableCell>
                        <TableCell>GH₵{payment.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {payment.isPaid ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Unpaid
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {feedingPayments.filter(p => p.isPaid).length} of {feedingPayments.length} students selected
                    </p>
                    <p className="font-semibold">
                      Total: GH₵{(feedingPayments.filter(p => p.isPaid).length * parseFloat(feedingAmount)).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveFeedingFees}
                    disabled={saving || feedingPayments.filter(p => p.isPaid).length === 0}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Payments
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Fee Types Tabs */}
          {['books', 'transportation', 'uniform', 'activity', 'other'].map((feeType) => (
            <TabsContent key={feeType} value={feeType}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{feeType.replace('-', ' ')} Fees</CardTitle>
                  <CardDescription>
                    Record {feeType} fee payments for students
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Amount (GH₵)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherFeePayments.map((payment) => (
                        <TableRow key={payment.studentId}>
                          <TableCell className="font-medium">
                            {payment.studentName}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={payment.amount || ''}
                              onChange={(e) =>
                                handleOtherFeeAmountChange(payment.studentId, e.target.value)
                              }
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            {payment.isPaid ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {otherFeePayments.filter(p => p.isPaid).length} of {otherFeePayments.length} students
                      </p>
                      <p className="font-semibold">
                        Total: GH₵
                        {otherFeePayments
                          .filter(p => p.isPaid)
                          .reduce((sum, p) => sum + p.amount, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setOtherFeeType(feeType);
                        handleSaveOtherFees();
                      }}
                      disabled={saving || otherFeePayments.filter(p => p.isPaid).length === 0}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Payments
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {selectedClass && students.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No active students found in this class
          </CardContent>
        </Card>
      )}

      {/* Installment Payment Dialog */}
      <Dialog open={installmentDialog} onOpenChange={setInstallmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Installment Payment</DialogTitle>
            <DialogDescription>
              Record a partial payment for {selectedStudent?.studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedStudent && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">
                  GH₵{selectedStudent.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
            )}
            <div>
              <Label>Payment Amount (GH₵)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter amount"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInstallmentDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordInstallment} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
