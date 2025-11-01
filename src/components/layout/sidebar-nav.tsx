'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Receipt,
  CalendarClock,
  Sparkles,
  Settings,
  DollarSign,
  BookOpen,
  Shield,
  TrendingUp,
  Building2,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';

const navItemsConfig = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'organization_owner', 'teacher', 'student'] },
  
  // Super Admin Only
  { href: '/super-admin', label: 'Super Admin', icon: Shield, roles: ['superadmin'] },
  { href: '/super-admin/analytics', label: 'Analytics', icon: TrendingUp, roles: ['superadmin'] },
  
  // Organization/School Management
  { href: '/organizations', label: 'Organizations', icon: Building2, roles: ['superadmin'] },
  { href: '/users', label: 'Users', icon: Users, roles: ['organization_owner'] },
  { href: '/classes', label: 'Classes', icon: BookOpen, roles: ['organization_owner'] },
  { href: '/students', label: 'Students', icon: GraduationCap, roles: ['organization_owner', 'teacher'] },
  { href: '/staff', label: 'Staff', icon: Briefcase, roles: ['organization_owner'] },
  { href: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['organization_owner', 'teacher'] },
  { href: '/grades', label: 'Grades & Assessments', icon: ClipboardList, roles: ['organization_owner', 'teacher'] },
  { href: '/fees', label: 'Fees Management', icon: CreditCard, roles: ['organization_owner'] },
  { href: '/expenditure', label: 'Expenditure', icon: Receipt, roles: ['organization_owner'] },
  { href: '/timetables', label: 'Timetables', icon: CalendarClock, roles: ['organization_owner', 'teacher', 'student'] },
  { href: '/reports', label: 'AI Reports', icon: Sparkles, roles: ['organization_owner'] },
  
  // Settings
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['superadmin', 'organization_owner', 'teacher', 'student'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const userRole = currentUser?.role;

  // Filter nav items based on user role
  const visibleNavItems = navItemsConfig.filter(item => {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  return (
    <SidebarMenu>
      {visibleNavItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              tooltip={{ children: item.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
            >
              <a>
                <item.icon />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
