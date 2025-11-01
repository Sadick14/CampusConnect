'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common/page-header';
import {
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { getSchools } from '@/services/school';
import { getAllInvitations } from '@/services/invitation';
import { getPendingPayments } from '@/services/subscription';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Authorization check
  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  useEffect(() => {
    async function loadData() {
      if (!currentUser || currentUser.role !== 'superadmin') return;      setLoading(true);
      try {
        const [schoolsData, invitesData, paymentsData] = await Promise.all([
          getSchools(),
          getAllInvitations(),
          getPendingPayments(),
        ]);

        setSchools(schoolsData);
        setInvitations(invitesData);
        setPayments(paymentsData);
      } catch (error: any) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to load analytics data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate metrics
  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => ['active', 'trial'].includes(s.subscriptionStatus || '')).length;
  const lockedSchools = schools.filter(s => s.subscriptionStatus === 'locked').length;
  const trialSchools = schools.filter(s => s.subscriptionStatus === 'trial').length;

  const totalRevenue = schools.reduce((sum, s) => sum + (s.totalAmountPaid || 0), 0);
  const monthlyRevenue = payments.filter(p => {
    const paymentDate = new Date(p.submittedAt);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + p.amount, 0);

  // Subscription distribution
  const subscriptionData = [
    { name: 'Trial', value: trialSchools, color: COLORS[1] },
    { name: 'Basic', value: schools.filter(s => s.subscriptionType === 'BASIC').length, color: COLORS[0] },
    { name: 'Standard', value: schools.filter(s => s.subscriptionType === 'STANDARD').length, color: COLORS[2] },
    { name: 'Premium', value: schools.filter(s => s.subscriptionType === 'PREMIUM').length, color: COLORS[4] },
    { name: 'Locked', value: lockedSchools, color: COLORS[3] },
  ].filter(item => item.value > 0);

  // Growth over last 6 months
  const now = new Date();
  const growthData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthName = month.toLocaleString('default', { month: 'short' });
    const schoolsInMonth = schools.filter(s => {
      const createdDate = new Date(s.createdAt);
      return createdDate.getMonth() === month.getMonth() && createdDate.getFullYear() === month.getFullYear();
    }).length;
    return { month: monthName, schools: schoolsInMonth };
  });

  // Revenue by plan
  const revenueByPlan = [
    { plan: 'Basic', revenue: schools.filter(s => s.subscriptionType === 'BASIC').reduce((sum, s) => sum + (s.totalAmountPaid || 0), 0) },
    { plan: 'Standard', revenue: schools.filter(s => s.subscriptionType === 'STANDARD').reduce((sum, s) => sum + (s.totalAmountPaid || 0), 0) },
    { plan: 'Premium', revenue: schools.filter(s => s.subscriptionType === 'PREMIUM').reduce((sum, s) => sum + (s.totalAmountPaid || 0), 0) },
  ].filter(item => item.revenue > 0);

  // Status distribution
  const statusData = [
    { status: 'Active', count: schools.filter(s => s.subscriptionStatus === 'active').length },
    { status: 'Trial', count: trialSchools },
    { status: 'Locked', count: lockedSchools },
    { status: 'Pending', count: schools.filter(s => s.subscriptionStatus === 'pending_payment').length },
  ].filter(item => item.count > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics Dashboard"
        description="Overview of all schools, subscriptions, and revenue"
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSchools}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <span className="text-green-600">{activeSchools} active</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">GHS {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">GHS {monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalSchools > 0 ? Math.round(((totalSchools - trialSchools) / totalSchools) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Trial to paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* School Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>School Growth (Last 6 Months)</CardTitle>
            <CardDescription>New schools registered per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="schools" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <CardDescription>Breakdown by plan type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
            <CardDescription>Total revenue generated per subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByPlan}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>School Status</CardTitle>
            <CardDescription>Current status of all schools</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Schools by Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Schools by Revenue</CardTitle>
          <CardDescription>Highest paying schools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schools
              .sort((a, b) => (b.totalAmountPaid || 0) - (a.totalAmountPaid || 0))
              .slice(0, 10)
              .map((school, index) => (
                <div key={school.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{school.name}</p>
                      <p className="text-xs text-muted-foreground">{school.subscriptionType || 'TRIAL'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">GHS {(school.totalAmountPaid || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {school.subscriptionStatus === 'active' ? 'Active' : school.subscriptionStatus}
                    </p>
                  </div>
                </div>
              ))}
            {schools.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No schools registered yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
