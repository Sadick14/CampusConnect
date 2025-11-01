'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  CreditCard, 
  Sparkles,
  School as SchoolIcon,
  ClipboardCheck,
  ClipboardList,
  Receipt,
  CalendarClock,
  Loader2,
  TrendingUp,
  BookOpen,
  AlertCircle,
  Activity,
  BarChart3,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  getDashboardStats, 
  getStudentStats, 
  getAttendanceStats, 
  getFeeStats,
  getGradeDistribution,
  getRecentActivities,
  type DashboardStats,
  type StudentStats,
  type RecentActivity,
} from "@/services/dashboard";
import { getOrganizationById } from "@/services/organization";
import { type Organization } from "@/schemas/organization";
import { getUserCurrentOrganization, setUserCurrentOrganization } from "@/services/user-organization";
import { formatCurrency } from "@/lib/currency";

const dashboardItems = [
  { title: "Schools", href: "/schools", icon: SchoolIcon, description: "Manage registered schools", roles: ['superadmin'] },
  { title: "Users", href: "/users", icon: Users, description: "Administer user accounts", roles: ['superadmin', 'school_admin', 'organization_owner'] },
  { title: "Students", href: "/students", icon: GraduationCap, description: "Student records and profiles", roles: ['school_admin', 'organization_owner', 'teacher'] },
  { title: "Staff", href: "/staff", icon: Briefcase, description: "Manage teaching and non-teaching staff", roles: ['school_admin', 'organization_owner'] },
  { title: "Attendance", href: "/attendance", icon: ClipboardCheck, description: "Track student attendance", roles: ['school_admin', 'organization_owner', 'teacher'] },
  { title: "Grades", href: "/grades", icon: ClipboardList, description: "Manage grades and assessments", roles: ['school_admin', 'organization_owner', 'teacher'] },
  { title: "Fees", href: "/fees", icon: CreditCard, description: "Oversee fee collection and status", roles: ['school_admin', 'organization_owner'] },
  { title: "Expenditure", href: "/expenditure", icon: Receipt, description: "Track school expenditures", roles: ['school_admin', 'organization_owner'] },
  { title: "Timetables", href: "/timetables", icon: CalendarClock, description: "Create and manage timetables", roles: ['school_admin', 'organization_owner', 'teacher', 'student'] },
  { title: "AI Reports", href: "/reports", icon: Sparkles, description: "Generate AI-powered reports", roles: ['school_admin', 'organization_owner'] },
];

export default function HomePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Organization state
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizationLoading, setOrganizationLoading] = useState(true);
  
  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [feeStats, setFeeStats] = useState<any>(null);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const redirected = useRef(false);

  // Get organization ID from URL params or user's current organization
  const orgIdFromUrl = searchParams.get('org');

  // Load current organization
  useEffect(() => {
    const loadOrganization = async () => {
      if (!currentUser || authLoading) return;

      // Skip organization loading for superadmins
      if (currentUser.role === 'superadmin') {
        setOrganizationLoading(false);
        return;
      }

      try {
        setOrganizationLoading(true);
        let orgId = orgIdFromUrl;

        // If no org in URL, get user's current organization
        if (!orgId) {
          orgId = await getUserCurrentOrganization(currentUser.id);
        }

        if (!orgId) {
          // No organization found, redirect to organizations page
          router.replace('/organizations');
          return;
        }

        // Update user's current organization if different from URL
        if (orgIdFromUrl && orgIdFromUrl !== await getUserCurrentOrganization(currentUser.id)) {
          await setUserCurrentOrganization(currentUser.id, orgIdFromUrl);
        }

        // Fetch organization details
        const organization = await getOrganizationById(orgId);
        if (!organization) {
          toast({
            title: 'Organization not found',
            description: 'The selected organization could not be found.',
            variant: 'destructive',
          });
          router.replace('/organizations');
          return;
        }

        setCurrentOrganization(organization);
      } catch (error) {
        console.error('Error loading organization:', error);
        toast({
          title: 'Error',
          description: 'Failed to load organization details.',
          variant: 'destructive',
        });
        router.replace('/organizations');
      } finally {
        setOrganizationLoading(false);
      }
    };

    loadOrganization();
  }, [currentUser, authLoading, orgIdFromUrl, router, toast]);

  // Redirect super admins to their own dashboard (only once)
  useEffect(() => {
    if (!authLoading && currentUser?.role === 'superadmin' && !redirected.current) {
      console.log('[Dashboard] Super admin detected, redirecting to /super-admin');
      redirected.current = true;
      router.replace('/super-admin');
    }
  }, [authLoading, currentUser, router]);

  // Show loading while redirecting
  if (!authLoading && currentUser?.role === 'superadmin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentOrganization?.id || organizationLoading) return;

      try {
        setStatsLoading(true);
        const organizationId = currentOrganization.id;
        
        const [stats, students, attendance, fees, grades, activities] = await Promise.all([
          getDashboardStats(organizationId),
          getStudentStats(organizationId),
          getAttendanceStats(organizationId),
          getFeeStats(organizationId),
          getGradeDistribution(organizationId),
          getRecentActivities(organizationId),
        ]);

        setDashboardStats(stats);
        setStudentStats(students);
        setAttendanceStats(attendance);
        setFeeStats(fees);
        setGradeDistribution(grades);
        setRecentActivities(activities);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard statistics',
          variant: 'destructive',
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [currentOrganization, organizationLoading, toast]);

  const welcomeMessage = () => {
    if (currentUser?.name) {
      let message = `Welcome back, ${currentUser.name}!`;
      if (currentUser.role) {
        message += ` (${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).replace('_', ' ')})`;
      }
      return message;
    }
    return "Welcome to CampusConnect Pro!";
  };  const filteredDashboardItems = dashboardItems.filter(item => {
    if (!currentUser || !item.roles) return true;
    if (!currentUser.role) return false;
    
    // Organization owners have full admin privileges
    if (currentUser.role === 'organization_owner') {
      return item.roles.includes('school_admin') || item.roles.includes('organization_owner');
    }
    
    return item.roles.includes(currentUser.role);
  });

  if (authLoading || organizationLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">
            {authLoading ? 'Loading user...' : 'Loading organization...'}
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need to be logged in to view the dashboard content.</p>
            <Link href="/login" passHref>
              <button className="mt-4 px-4 py-2 bg-primary text-white rounded">Go to Login</button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      {currentOrganization && (
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle className="text-xl text-blue-900">{currentOrganization.name}</CardTitle>
                  <CardDescription className="capitalize text-blue-700">
                    {currentOrganization.type} • {currentOrganization.memberCount} members
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={currentOrganization.subscriptionStatus === 'trial' ? 'secondary' : 
                               currentOrganization.subscriptionStatus === 'active' ? 'default' : 'destructive'}>
                  {currentOrganization.subscriptionStatus === 'trial' 
                    ? `Trial (${currentOrganization.daysRemaining} days left)`
                    : currentOrganization.subscriptionStatus === 'active'
                    ? 'Active Subscription'
                    : currentOrganization.subscriptionStatus === 'pending_payment'
                    ? 'Payment Required'
                    : currentOrganization.subscriptionStatus}
                </Badge>
                <Link href="/organizations">
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                    Switch Organization
                  </Badge>
                </Link>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}
      
      <PageHeader 
        title="Dashboard" 
        description={welcomeMessage()}
      />

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Students Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold">{dashboardStats?.totalStudents || 0}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {dashboardStats?.activeStudents || 0} active
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Staff Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold">{dashboardStats?.totalStaff || 0}</p>
                <p className="text-xs text-gray-600">Teaching & Non-teaching</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold">{dashboardStats?.totalClasses || 0}</p>
                <p className="text-xs text-gray-600">Active classes</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Attendance Rate Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold">{dashboardStats?.attendanceRate || 0}%</p>
                <p className="text-xs text-gray-600">Today's attendance</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Fee & Student Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Fee Collection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Collection Rate</span>
                    <span className="font-semibold">{feeStats?.collectionRate || 0}%</span>
                  </div>
                  <Progress value={feeStats?.collectionRate || 0} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Paid</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(feeStats?.paid || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Pending</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(feeStats?.pending || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(feeStats?.total || 0)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Student Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Student Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Active</span>
                  <span className="font-semibold text-green-600">{studentStats?.active || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Inactive</span>
                  <span className="font-semibold text-yellow-600">{studentStats?.inactive || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Graduated</span>
                  <span className="font-semibold text-blue-600">{studentStats?.graduated || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Transferred</span>
                  <span className="font-semibold text-gray-600">{studentStats?.transferred || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Suspended</span>
                  <span className="font-semibold text-red-600">{studentStats?.suspended || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Class Distribution & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Class Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : gradeDistribution.length > 0 ? (
              <div className="space-y-3">
                {gradeDistribution.map((item) => (
                  <div key={item.grade}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.grade}</span>
                      <span className="text-gray-600">{item.count} students</span>
                    </div>
                    <Progress value={(item.count / (dashboardStats?.totalStudents || 1)) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No class data available</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex gap-3 text-sm border-b pb-2 last:border-0">
                    <span className="text-lg">{activity.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No recent activities</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Navigate to key sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filteredDashboardItems.map((item) => (
              <Link href={item.href} key={item.title} passHref>
                <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <item.icon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
