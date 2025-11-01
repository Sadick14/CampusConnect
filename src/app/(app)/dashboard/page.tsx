'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  { title: "Organizations", href: "/organizations", icon: Building2, description: "Manage organizations", roles: ['superadmin'] },
  { title: "Users", href: "/users", icon: Users, description: "Administer user accounts", roles: ['superadmin', 'organization_owner'] },
  { title: "Students", href: "/students", icon: GraduationCap, description: "Student records and profiles", roles: ['organization_owner', 'teacher'] },
  { title: "Staff", href: "/staff", icon: Briefcase, description: "Manage teaching and non-teaching staff", roles: ['organization_owner'] },
  { title: "Attendance", href: "/attendance", icon: ClipboardCheck, description: "Track student attendance", roles: ['organization_owner', 'teacher'] },
  { title: "Grades", href: "/grades", icon: ClipboardList, description: "Manage grades and assessments", roles: ['organization_owner', 'teacher'] },
  { title: "Fees", href: "/fees", icon: CreditCard, description: "Oversee fee collection and status", roles: ['organization_owner'] },
  { title: "Expenditure", href: "/expenditure", icon: Receipt, description: "Track school expenditures", roles: ['organization_owner'] },
  { title: "Timetables", href: "/timetables", icon: CalendarClock, description: "Create and manage timetables", roles: ['organization_owner', 'teacher', 'student'] },
  { title: "AI Reports", href: "/reports", icon: Sparkles, description: "Generate AI-powered reports", roles: ['organization_owner'] },
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
    return "Welcome to Syntra!";
  };  const filteredDashboardItems = dashboardItems.filter(item => {
    if (!currentUser || !item.roles) return true;
    if (!currentUser.role) return false;
    
    // Organization owners have full admin privileges
    if (currentUser.role === 'organization_owner') {
      return item.roles.includes('organization_owner');
    }
    
    return item.roles.includes(currentUser.role);
  });

  if (authLoading || organizationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center animate-fade-in-up">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-xl"></div>
          </div>
          <p className="text-gray-600 font-medium">
            {authLoading ? 'Loading your profile...' : 'Loading organization...'}
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
    <div className="space-y-8 animate-fade-in-up">
      {/* Organization Header */}
      {currentOrganization && (
        <div className="card-modern rounded-3xl p-6 bg-gradient-to-r from-green-50/80 via-emerald-50/80 to-green-50/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {currentOrganization.name}
                </h1>
                <p className="text-gray-600 capitalize font-medium">
                  {currentOrganization.type} • {currentOrganization.memberCount} members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={currentOrganization.subscriptionStatus === 'trial' ? 'secondary' :
                             currentOrganization.subscriptionStatus === 'active' ? 'default' : 'destructive'}
                     className="px-4 py-2 text-sm font-semibold rounded-xl">
                {currentOrganization.subscriptionStatus === 'trial'
                  ? `Trial (${currentOrganization.daysRemaining} days left)`
                  : currentOrganization.subscriptionStatus === 'active'
                  ? 'Active Subscription'
                  : currentOrganization.subscriptionStatus === 'pending_payment'
                  ? 'Payment Required'
                  : currentOrganization.subscriptionStatus}
              </Badge>
              <Link href="/organizations">
                <Button variant="outline" className="rounded-xl border-2 hover:bg-gray-50 transition-colors font-semibold">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Switch Organization
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Dashboard"
        description={welcomeMessage()}
      />

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Students Card */}
        <Card className="card-modern rounded-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6">
            <CardTitle className="text-sm font-semibold text-gray-700">Total Students</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {statsLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-1">{dashboardStats?.totalStudents || 0}</p>
                <p className="text-sm text-green-600 flex items-center gap-1 font-medium">
                  <TrendingUp className="h-4 w-4" />
                  {dashboardStats?.activeStudents || 0} active
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Staff Card */}
        <Card className="card-modern rounded-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6">
            <CardTitle className="text-sm font-semibold text-gray-700">Total Staff</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {statsLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-1">{dashboardStats?.totalStaff || 0}</p>
                <p className="text-sm text-gray-600 font-medium">Teaching & Non-teaching</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card className="card-modern rounded-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6">
            <CardTitle className="text-sm font-semibold text-gray-700">Total Classes</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {statsLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-1">{dashboardStats?.totalClasses || 0}</p>
                <p className="text-sm text-gray-600 font-medium">Active classes</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Attendance Rate Card */}
        <Card className="card-modern rounded-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6">
            <CardTitle className="text-sm font-semibold text-gray-700">Attendance Rate</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {statsLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-1">{dashboardStats?.attendanceRate || 0}%</p>
                <p className="text-sm text-gray-600 font-medium">Today's attendance</p>
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
      <div className="card-modern rounded-3xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
          <p className="text-gray-600">Navigate to key sections of your organization</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filteredDashboardItems.map((item, index) => (
            <Link href={item.href} key={item.title} className="group">
              <div className="card-modern rounded-2xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 animate-fade-in-up"
                   style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
