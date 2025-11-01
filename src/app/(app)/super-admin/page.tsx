'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common/page-header';
import {
  Plus,
  MoreVertical,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Users,
  Loader2,
  Send,
  Ban,
  Unlock,
  TrendingUp,
} from 'lucide-react';
import { getSchools, type School } from '@/services/school';
import {
  createSchoolInvitation,
  getAllInvitations,
  resendInvitation,
  cancelInvitation,
  type SchoolInvitation,
} from '@/services/invitation';
import { getPendingPayments, approvePayment, rejectPayment, type PaymentRecord } from '@/services/subscription';

// Super Admin Components
import { StatsCards } from '@/components/super-admin/stats-cards';
import { RevenueCharts } from '@/components/super-admin/revenue-charts';
import { SchoolActivityTable } from '@/components/super-admin/school-activity-table';

// Super Admin Services
import {
  getSystemStats,
  getRevenueMetrics,
  getSchoolActivities,
  type SystemStats,
  type RevenueMetrics,
  type SchoolActivity,
} from '@/services/super-admin-stats';

export default function SuperAdminDashboard() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<School[]>([]);
  const [invitations, setInvitations] = useState<SchoolInvitation[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const redirected = useRef(false);

  // Super Admin Analytics State
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [schoolActivities, setSchoolActivities] = useState<SchoolActivity[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Form state for new invitation
  const [schoolName, setSchoolName] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Check super admin access - redirect non-super admins (only once)
  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin' && !redirected.current) {
      console.log('[SuperAdmin] Not a super admin, redirecting to /dashboard. Role:', currentUser.role);
      redirected.current = true;
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  // Show loading while redirecting non-super admins
  if (currentUser && currentUser.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!currentUser || currentUser.role !== 'superadmin') return;

      setLoading(true);
      setStatsLoading(true);
      try {
        // Load all data in parallel
        const [
          schoolsData, 
          invitesData, 
          paymentsData,
          statsData,
          revenueData,
          activitiesData,
        ] = await Promise.all([
          getSchools(),
          getAllInvitations(),
          getPendingPayments(),
          getSystemStats(),
          getRevenueMetrics(),
          getSchoolActivities(),
        ]);

        setSchools(schoolsData);
        setInvitations(invitesData);
        setPendingPayments(paymentsData);
        setSystemStats(statsData);
        setRevenueMetrics(revenueData);
        setSchoolActivities(activitiesData);
      } catch (error: any) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    }

    loadData();
  }, [currentUser, toast]);

  const handleCreateInvitation = async () => {
    if (!currentUser || !schoolName || !schoolEmail || !adminName || !adminEmail) {
      toast({
        title: 'Missing fields',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const invitation = await createSchoolInvitation(
        {
          schoolName,
          schoolEmail,
          adminEmail,
          adminName,
          status: 'pending',
          createdBy: currentUser.id,
        },
        currentUser.id
      );

      setInvitations([invitation, ...invitations]);
      toast({
        title: 'Success',
        description: `Invitation sent to ${adminEmail}`,
      });

      // Reset form
      setSchoolName('');
      setSchoolEmail('');
      setAdminName('');
      setAdminEmail('');
      setInviteDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invitation',
        variant: 'destructive',
      });
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await resendInvitation(invitationId);
      toast({
        title: 'Success',
        description: 'Invitation resent successfully',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation(invitationId);
      setInvitations(invitations.map(inv =>
        inv.id === invitationId ? { ...inv, status: 'expired' as const } : inv
      ));
      toast({
        title: 'Success',
        description: 'Invitation cancelled',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel invitation',
        variant: 'destructive',
      });
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    if (!currentUser) return;

    try {
      await approvePayment(paymentId, currentUser.id, currentUser.name);
      setPendingPayments(pendingPayments.filter(p => p.id !== paymentId));
      toast({
        title: 'Success',
        description: 'Payment approved successfully',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve payment',
        variant: 'destructive',
      });
    }
  };

  const handleRejectPayment = async () => {
    if (!currentUser || !selectedPayment || !rejectionReason) return;

    try {
      await rejectPayment(selectedPayment.id!, currentUser.id, currentUser.name, rejectionReason);
      setPendingPayments(pendingPayments.filter(p => p.id !== selectedPayment.id));
      toast({
        title: 'Success',
        description: 'Payment rejected',
      });
      setRejectDialogOpen(false);
      setSelectedPayment(null);
      setRejectionReason('');
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject payment',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      locked: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800',
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

  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Access denied. Super Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Super Admin Dashboard"
        description="Comprehensive platform management and analytics"
        actions={
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite New School
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Invite New School</DialogTitle>
                <DialogDescription>
                  Send an invitation to a school admin to set up their organization
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>School Name</Label>
                  <Input
                    placeholder="e.g., Springfield High School"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>School Email</Label>
                  <Input
                    type="email"
                    placeholder="info@school.com"
                    value={schoolEmail}
                    onChange={e => setSchoolEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Admin Name</Label>
                  <Input
                    placeholder="e.g., John Doe"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Admin Email</Label>
                  <Input
                    type="email"
                    placeholder="admin@school.com"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvitation}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Enhanced Statistics Cards */}
      <StatsCards data={systemStats} loading={statsLoading} />

      {/* Revenue Analytics */}
      <RevenueCharts data={revenueMetrics} loading={statsLoading} />

      {/* School Activity Table */}
      <SchoolActivityTable data={schoolActivities} loading={statsLoading} />

      {/* Tabs */}
      <Tabs defaultValue="schools" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="payments">Payment Approvals</TabsTrigger>
        </TabsList>

        {/* Schools Tab */}
        <TabsContent value="schools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Schools</CardTitle>
              <CardDescription>
                Manage school organizations and subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>School Name</TableHead>
                      <TableHead>Admin Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No schools registered yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      schools.map(school => (
                        <TableRow key={school.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{school.name}</TableCell>
                          <TableCell>{school.adminEmail}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(school.subscriptionStatus || 'trial')}>
                              {school.subscriptionStatus || 'trial'}
                            </Badge>
                          </TableCell>
                          <TableCell>{school.subscriptionType || 'TRIAL'}</TableCell>
                          <TableCell>
                            {new Date(school.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/super-admin/schools/${school.id}`)}>
                                  <Users className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/super-admin/schools/${school.id}#subscription`)}>
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Manage Subscription
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => router.push(`/super-admin/schools/${school.id}#lock`)}>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Lock School
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
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>School Invitations</CardTitle>
              <CardDescription>
                Track sent invitations and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>School Name</TableHead>
                      <TableHead>Admin Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No invitations sent yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      invitations.map(invite => (
                        <TableRow key={invite.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{invite.schoolName}</TableCell>
                          <TableCell>{invite.adminEmail}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(invite.status)}>
                              {invite.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invite.createdAt.toDate().toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {invite.expiresAt.toDate().toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {invite.status === 'pending' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleResendInvitation(invite.id)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Resend Invitation
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCancelInvitation(invite.id)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Invitation
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
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

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payment Approvals</CardTitle>
              <CardDescription>
                Review and approve school subscription payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>School Name</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No pending payments to review
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingPayments.map(payment => (
                        <TableRow key={payment.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{payment.schoolName}</TableCell>
                          <TableCell>
                            <Badge>{payment.subscriptionType}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">GHS {payment.amount}</TableCell>
                          <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {payment.paymentReference}
                          </TableCell>
                          <TableCell>
                            {new Date(payment.submittedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleApprovePayment(payment.id!)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setRejectDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
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
      </Tabs>

      {/* Reject Payment Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Reject Payment?</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide a reason for rejecting this payment from {selectedPayment?.schoolName}.
          </AlertDialogDescription>
          <div className="space-y-2">
            <Label>Rejection Reason</Label>
            <Input
              placeholder="e.g., Invalid payment proof"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectPayment}
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectionReason}
            >
              Reject Payment
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
