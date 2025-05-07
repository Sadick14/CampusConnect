
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
  // Settings, // Example, can be added back
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
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'school_admin', 'teacher', 'student'] }, // All authenticated users
  { href: '/schools', label: 'Schools', icon: SchoolIcon, roles: ['superadmin'] },
  { href: '/users', label: 'Users', icon: Users, roles: ['superadmin', 'school_admin'] }, // Superadmin can see all, school_admin their school's
  { href: '/students', label: 'Students', icon: GraduationCap, roles: ['school_admin', 'teacher'] },
  { href: '/staff', label: 'Staff', icon: Briefcase, roles: ['school_admin'] },
  { href: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['school_admin', 'teacher'] },
  { href: '/grades', label: 'Grades & Assessments', icon: ClipboardList, roles: ['school_admin', 'teacher'] },
  { href: '/fees', label: 'Fees Management', icon: CreditCard, roles: ['school_admin'] },
  { href: '/expenditure', label: 'Expenditure', icon: Receipt, roles: ['school_admin'] },
  { href: '/timetables', label: 'Timetables', icon: CalendarClock, roles: ['school_admin', 'teacher', 'student'] },
  { href: '/reports', label: 'AI Reports', icon: Sparkles, roles: ['school_admin'] },
  { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['superadmin'] }, // Superadmin only
  // Example of a submenu
  // {
  //   label: 'Settings',
  //   icon: Settings,
  //   submenu: [
  //     { href: '/settings/general', label: 'General', roles: ['superadmin', 'school_admin'] },
  //     { href: '/settings/profile', label: 'Profile', roles: ['superadmin', 'school_admin', 'teacher', 'student'] },
  //   ],
  //   roles: ['superadmin', 'school_admin', 'teacher', 'student']
  // },
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
              isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
              aria-current={(pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) ? "page" : undefined}
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

