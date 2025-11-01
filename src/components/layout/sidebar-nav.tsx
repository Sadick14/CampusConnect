
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  School as SchoolIcon, // Renamed to avoid conflict
  Users,
  GraduationCap,
  Briefcase,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Receipt,
  CalendarClock,
  Sparkles,
  Bell,
  Settings, // Added Settings icon
  Plus, // For Register School
  DollarSign, // For Payment Management
  BookOpen, // For Classes
  Shield, // For Super Admin
  TrendingUp, // For Analytics
  Building2, // For Schools Management
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  // SidebarMenuSub, // Example, can be added back
  // SidebarMenuSubItem, // Example, can be added back
  // SidebarMenuSubButton, // Example, can be added back
} from '@/components/ui/sidebar';
// import { cn } from '@/lib/utils'; // Not used currently
import { useAuth } from '@/contexts/auth-context'; // For role-based filtering

// Define navigation items with roles
const navItemsConfig = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'school_admin', 'organization_owner', 'teacher', 'student'] }, // All authenticated users
  
  // Super Admin Only
  { href: '/super-admin', label: 'Super Admin', icon: Shield, roles: ['superadmin'] },
  { href: '/super-admin/analytics', label: 'Analytics', icon: TrendingUp, roles: ['superadmin'] },
  { href: '/super-admin/school-payments', label: 'School Payments', icon: DollarSign, roles: ['superadmin'] },
  
  // School Management
  { href: '/users', label: 'Users', icon: Users, roles: ['school_admin', 'organization_owner'] },
  { href: '/classes', label: 'Classes', icon: BookOpen, roles: ['school_admin', 'organization_owner'] },
  { href: '/students', label: 'Students', icon: GraduationCap, roles: ['school_admin', 'organization_owner', 'teacher'] },
  { href: '/staff', label: 'Staff', icon: Briefcase, roles: ['school_admin', 'organization_owner'] },
  { href: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['school_admin', 'organization_owner', 'teacher'] },
  { href: '/grades', label: 'Grades & Assessments', icon: ClipboardList, roles: ['school_admin', 'organization_owner', 'teacher'] },
  { href: '/fees', label: 'Fees Management', icon: CreditCard, roles: ['school_admin', 'organization_owner'] },
  { href: '/expenditure', label: 'Expenditure', icon: Receipt, roles: ['school_admin', 'organization_owner'] },
  { href: '/timetables', label: 'Timetables', icon: CalendarClock, roles: ['school_admin', 'organization_owner', 'teacher', 'student'] },
  { href: '/reports', label: 'AI Reports', icon: Sparkles, roles: ['school_admin', 'organization_owner'] },
  
  // Settings
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['superadmin', 'school_admin', 'organization_owner', 'teacher', 'student'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const userRole = currentUser?.role;

  // Filter nav items based on user role
  const visibleNavItems = navItemsConfig.filter(item => {
    if (!userRole) return false; // Don't show anything if no role (or user not loaded)
    return item.roles.includes(userRole);
  });
  // TODO: Submenu filtering needs to be handled if submenus are re-enabled.

  return (
    <SidebarMenu>
      {visibleNavItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          {/* Submenu logic currently commented out, can be re-added if needed */}
          {/* {item.submenu ? ( ... ) : ( ... ) } */}
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              // Exact match for dashboard, startsWith for others
              isActive={item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)}
              aria-current={(item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)) ? "page" : undefined}
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
