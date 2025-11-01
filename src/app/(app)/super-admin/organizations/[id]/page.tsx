
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common/page-header';
import {
  ArrowLeft,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Lock,
  Unlock,
  TrendingUp,
  Calendar,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Ban,
  Mail,
  Phone,
  Globe,
} from 'lucide-react';
import { getOrganizationById, type Organization } from '@/services/organization';
import { getStudentsByOrganization } from '@/services/student';
import { getSchoolStaff } from '@/services/staff';
import { getSchoolClasses } from '@/services/class';
import { getSchoolPayments, lockSchoolAccount, unlockSchoolAccount, getSubscription } from '@/services/subscription';
import type { Student } from '@/schemas/student';
import type { StaffMember } from '@/schemas/staff';
import type { Class } from '@/schemas/class';
import type { PaymentRecord, Subscription } from '@/schemas/subscription';

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const organizationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');

  // Authorization check
  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  useEffect(() => {
    async function loadData() {
      if (!currentUser || currentUser.role !== 'superadmin') return;      
      setLoading(true);
      try {
        const [
          orgData,
          subscriptionData,
          studentsData,
          staffData,
          classesData,
          paymentsData,
        ] = await Promise.all([
          getOrganizationById(organizationId),
          getSubscription(organizationId),
          getStudentsByOrganization(organizationId),
          getSchoolStaff(organizationId),
          getSchoolClasses(organizationId),
          getSchoolPayments(organizationId),
        ]);

        setOrganization(orgData);
        setSubscription(subscriptionData);
        setStudents(studentsData);
        setStaff(staffData);
        setClasses(classesData);
        setPayments(paymentsData);
      } catch (error: any) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to load organization details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [organizationId, currentUser, toast]);

  const handleLockAccount = async () => {
    try {
      await lockSchoolAccount(organizationId);
      toast({
        title: 'Account Locked',
        description: `${organization?.name} has been locked`,
      });
      setLockDialogOpen(false);
      setActionReason('');
      
      // Refresh data
      const updatedOrg = await getOrganizationById(organizationId);
      const updatedSubscription = await getSubscription(organizationId);
      setOrganization(updatedOrg);
      setSubscription(updatedSubscription);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to lock account',
        variant: 'destructive',
      });
    }
  };

  const handleUnlockAccount = async () => {
    try {
      await unlockSchoolAccount(organizationId);
      toast({
        title: 'Account Unlocked',
        description: `${organization?.name} has been unlocked`,
      });
      setUnlockDialogOpen(false);
      setActionReason('');
      
      // Refresh data
      const updatedOrg = await getOrganizationById(organizationId);
      const updatedSubscription = await getSubscription(organizationId);
      setOrganization(updatedOrg);
      setSubscription(updatedSubscription);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to unlock account',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      locked: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      pending_payment: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Organization not found</p>
        <Button className="mt-4" onClick={() => router.push('/super-admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isLocked = organization.subscriptionStatus === 'locked';
  const activeStudents = students.filter(s => s.status === 'active').length;
  const activeStaff = staff.filter(s => s.isActive).length;
  const totalRevenue = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={organization.name}
        description={`Organization ID: ${organization.id}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/super-admin')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {isLocked ? (
              <Button onClick={() => setUnlockDialogOpen(true)} variant="default">
                <Unlock className="mr-2 h-4 w-4" />
                Unlock Account
              </Button>
            ) : (
              <Button onClick={() => setLockDialogOpen(true)} variant="destructive">
                <Lock className="mr-2 h-4 w-4" />
                Lock Account
              </Button>
            )}
          </div>
        }
      />

      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Owner Email</p>
              <p className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {organization.ownerEmail}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge className={getStatusBadge(organization.subscriptionStatus || 'trial')}>
                {organization.subscriptionStatus || 'trial'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Subscription Type</p>
              <Badge variant="outline">{organization.subscriptionType || 'TRIAL'}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Created</p>
              <p className="font-medium">{new Date(organization.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Details */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Subscription Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {subscription.isTrialActive ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Trial Period</p>
                    <p className="font-medium">
                      {new Date(subscription.trialStartDate).toLocaleDateString()} -{' '}
                      {new Date(subscription.trialEndDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Days Remaining</p>
                    <p className="font-medium text-blue-600">{subscription.trialDaysRemaining} days</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Subscription Period</p>
                    <p className="font-medium">
                      {subscription.subscriptionStartDate && new Date(subscription.subscriptionStartDate).toLocaleDateString()} -{' '}
                      {subscription.subscriptionEndDate && new Date(subscription.subscriptionEndDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Next Billing</p>
                    <p className="font-medium">
                      {subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                <p className="font-semibold text-green-600">GHS {subscription.totalAmountPaid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Payment</p>
                <p className="font-medium">
                  {subscription.lastPaymentDate ? new Date(subscription.lastPaymentDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudents}</div>
            <p className="text-xs text-muted-foreground">out of {students.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Staff Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStaff}</div>
            <p className="text-xs text-muted-foreground">out of {staff.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">configured classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">GHS {totalRevenue}</div>
            <p className="text-xs text-muted-foreground">from {payments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
          <TabsTrigger value="staff">Staff ({staff.length})</TabsTrigger>
          <TabsTrigger value="classes">Classes ({classes.length})</TabsTrigger>
          <TabsTrigger value="payments">Payment History ({payments.length})</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>All registered students in this organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No students registered
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.slice(0, 50).map(student => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-sm">{student.studentIdNumber}</TableCell>
                          <TableCell className="font-medium">
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>{student.currentClass || 'Not Assigned'}</TableCell>
                          <TableCell>
                            <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(student.enrollmentDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {students.length > 50 && (
                  <div className="p-4 text-center text-sm text-muted-foreground border-t">
                    Showing first 50 students. Total: {students.length}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>Teachers and administrative staff</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No staff members registered
                        </TableCell>
                      </TableRow>
                    ) : (
                      staff.map(member => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell className="capitalize">{member.role}</TableCell>
                          <TableCell>{member.department || 'N/A'}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            <Badge variant={member.isActive ? 'default' : 'secondary'}>
                              {member.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
              <CardDescription>All classes in this organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Class Name</TableHead>
                      <TableHead>Grade Level</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No classes configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      classes.map(cls => (
                        <TableRow key={cls.id}>
                          <TableCell className="font-medium">{cls.className}</TableCell>
                          <TableCell>{cls.gradeLevel}</TableCell>
                          <TableCell>{cls.section}</TableCell>
                          <TableCell>{cls.capacity}</TableCell>
                          <TableCell>{cls.classTeacherName || 'Not Assigned'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All subscription payments for this organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reviewed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No payment history
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.submittedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.subscriptionType}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">GHS {payment.amount}</TableCell>
                          <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                          <TableCell className="font-mono text-sm">{payment.paymentReference}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.status === 'approved'
                                  ? 'default'
                                  : payment.status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.reviewedByName || 'Pending'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lock Account Dialog */}
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Lock className="h-5 w-5" />
              Lock Organization Account
            </DialogTitle>
            <DialogDescription>
              This will prevent all users from this organization from accessing the system. Are you sure you want to
              lock <strong>{organization.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Reason (Optional)</Label>
            <Textarea
              placeholder="Enter reason for locking this account..."
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLockDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLockAccount}>
              <Ban className="mr-2 h-4 w-4" />
              Lock Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock Account Dialog */}
      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Unlock className="h-5 w-5" />
              Unlock Organization Account
            </DialogTitle>
            <DialogDescription>
              This will restore access for all users from <strong>{organization.name}</strong>. Continue?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Enter any notes about unlocking this account..."
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnlockAccount}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Unlock Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
