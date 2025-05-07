
'use client';

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  UserCircle
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

const dashboardItems = [
  { title: "Schools", href: "/schools", icon: SchoolIcon, description: "Manage registered schools", roles: ['superadmin'] },
  { title: "Users", href: "/users", icon: Users, description: "Administer user accounts", roles: ['superadmin', 'school_admin'] },
  { title: "Students", href: "/students", icon: GraduationCap, description: "Student records and profiles", roles: ['school_admin', 'teacher'] },
  { title: "Staff", href: "/staff", icon: Briefcase, description: "Manage teaching and non-teaching staff", roles: ['school_admin'] },
  { title: "Attendance", href: "/attendance", icon: ClipboardCheck, description: "Track student attendance", roles: ['school_admin', 'teacher'] },
  { title: "Grades", href: "/grades", icon: ClipboardList, description: "Manage grades and assessments", roles: ['school_admin', 'teacher'] },
  { title: "Fees", href: "/fees", icon: CreditCard, description: "Oversee fee collection and status", roles: ['school_admin'] },
  { title: "Expenditure", href: "/expenditure", icon: Receipt, description: "Track school expenditures", roles: ['school_admin'] },
  { title: "Timetables", href: "/timetables", icon: CalendarClock, description: "Create and manage timetables", roles: ['school_admin', 'teacher'] },
  { title: "AI Reports", href: "/reports", icon: Sparkles, description: "Generate AI-powered reports", roles: ['school_admin'] },
];

export default function HomePage() {
  const { currentUser, loading } = useAuth();

  const welcomeMessage = () => {
    if (loading) {
      return <Skeleton className="h-6 w-3/4" />;
    }
    if (currentUser) {
      let message = `Welcome, ${currentUser.name}!`;
      if (currentUser.role) {
        message += ` (${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)})`;
      }
      if (currentUser.schoolName) {
        message += ` - ${currentUser.schoolName}`;
      }
      return message;
    }
    return "Welcome to CampusConnect Pro!";
  };

  const filteredDashboardItems = dashboardItems.filter(item => 
    !currentUser || !item.roles || item.roles.includes(currentUser.role)
  );


  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Dashboard" 
        description={welcomeMessage()}
      />
      {loading && (
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!loading && currentUser && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDashboardItems.map((item) => (
            <Link href={item.href} key={item.title} passHref>
              <Card className="cursor-pointer shadow-md transition-all hover:shadow-xl hover:border-primary/50 transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold text-primary">
                    {item.title}
                  </CardTitle>
                  <item.icon className="h-6 w-6 text-accent" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
       {!loading && !currentUser && (
         <Card>
           <CardHeader><CardTitle>Please Log In</CardTitle></CardHeader>
           <CardContent><p>You need to be logged in to view the dashboard content.</p></CardContent>
         </Card>
       )}
    </div>
  );
}
