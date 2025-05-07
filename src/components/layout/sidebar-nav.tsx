'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  School,
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
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/schools', label: 'Schools', icon: School },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/students', label: 'Students', icon: GraduationCap },
  { href: '/staff', label: 'Staff', icon: Briefcase },
  { href: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { href: '/grades', label: 'Grades & Assessments', icon: ClipboardList },
  { href: '/fees', label: 'Fees Management', icon: CreditCard },
  { href: '/expenditure', label: 'Expenditure', icon: Receipt },
  { href: '/timetables', label: 'Timetables', icon: CalendarClock },
  { href: '/reports', label: 'AI Reports', icon: Sparkles },
  // Example of a submenu
  // {
  //   label: 'Settings',
  //   icon: Settings,
  //   submenu: [
  //     { href: '/settings/general', label: 'General' },
  //     { href: '/settings/profile', label: 'Profile' },
  //   ],
  // },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          {item.submenu ? (
            <>
              <SidebarMenuButton
                className="justify-between"
                // onClick={() => { /* Handle submenu toggle if needed, Sidebar component might handle this */ }}
                // data-state={pathname.startsWith(item.href) ? 'open' : 'closed'} // Example state for accordion-like behavior
                tooltip={{ children: item.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              >
                <div className="flex items-center gap-2">
                  <item.icon />
                  <span>{item.label}</span>
                </div>
                {/* <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" /> */}
              </SidebarMenuButton>
              <SidebarMenuSub>
                {item.submenu.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.label}>
                    <Link href={subItem.href} passHref legacyBehavior>
                      <SidebarMenuSubButton
                        isActive={pathname === subItem.href}
                        aria-current={pathname === subItem.href ? "page" : undefined}
                      >
                        {subItem.label}
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </>
          ) : (
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                tooltip={{ children: item.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              >
                <a>
                  <item.icon />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
