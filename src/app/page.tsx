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
  CalendarClock
} from "lucide-react";
import Link from "next/link";

const dashboardItems = [
  { title: "Schools", href: "/schools", icon: SchoolIcon, description: "Manage registered schools" },
  { title: "Users", href: "/users", icon: Users, description: "Administer user accounts" },
  { title: "Students", href: "/students", icon: GraduationCap, description: "Student records and profiles" },
  { title: "Staff", href: "/staff", icon: Briefcase, description: "Manage teaching and non-teaching staff" },
  { title: "Attendance", href: "/attendance", icon: ClipboardCheck, description: "Track student attendance" },
  { title: "Grades", href: "/grades", icon: ClipboardList, description: "Manage grades and assessments" },
  { title: "Fees", href: "/fees", icon: CreditCard, description: "Oversee fee collection and status" },
  { title: "Expenditure", href: "/expenditure", icon: Receipt, description: "Track school expenditures" },
  { title: "Timetables", href: "/timetables", icon: CalendarClock, description: "Create and manage timetables" },
  { title: "AI Reports", href: "/reports", icon: Sparkles, description: "Generate AI-powered reports" },
];

export default function HomePage() {
  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Dashboard" 
        description="Welcome to CampusConnect Pro! Here's an overview of your school management system."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dashboardItems.map((item) => (
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
    </div>
  );
}
