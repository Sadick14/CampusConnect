
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  Archive,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  BarChart3,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/auth-context';

export function SidebarNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const userRole = currentUser?.role;

  // State for collapsible groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    administration: true,
    academic: true,
    financial: true,
    settings: true,
    superAdmin: true,
  });

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: string[];
  };

  type NavCategory = {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: string[];
    items: NavItem[];
  };

  // Navigation items grouped by category
  const navigationCategories: NavCategory[] = [
    // Super Admin Section
    {
      key: 'superAdmin',
      label: 'Super Admin',
      icon: Shield,
      roles: ['superadmin'],
      items: [
        { href: '/super-admin', label: 'Super Dashboard', icon: Shield },
        { href: '/users', label: 'Users', icon: Users },
        { href: '/super-admin/organizations', label: 'Organizations', icon: Building2 },
        { href: '/super-admin/school-payments', label: 'School Payments', icon: CreditCard },
        { href: '/super-admin/payment-settings', label: 'Payment Settings', icon: Settings },
        { href: '/super-admin/analytics', label: 'Analytics', icon: TrendingUp },
      ],
    },
    
    // Overview Section
    {
      key: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      roles: ['school_admin', 'organization_owner', 'teacher', 'student'],
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/organizations', label: 'My Organizations', icon: Building2 },
      ],
    },
    
    // Administration Section
    {
      key: 'administration',
      label: 'Administration',
      icon: Users,
      roles: ['school_admin', 'organization_owner'],
      items: [
        { href: '/classes', label: 'Classes', icon: BookOpen },
        { href: '/subjects', label: 'Subjects', icon: GraduationCap },
        { href: '/students', label: 'Students', icon: GraduationCap },
        { href: '/staff', label: 'Staff', icon: Briefcase },
      ],
    },
    
    // Academic Section
    {
      key: 'academic',
      label: 'Academic',
      icon: BookOpen,
      roles: ['school_admin', 'organization_owner', 'teacher'],
      items: [
        { href: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['school_admin', 'organization_owner', 'teacher'] },
        { href: '/grades', label: 'Grades & Assessments', icon: ClipboardList, roles: ['school_admin', 'organization_owner', 'teacher'] },
        { href: '/report-cards', label: 'Report Cards', icon: FileText, roles: ['school_admin', 'organization_owner', 'teacher'] },
        { href: '/timetables', label: 'Timetables', icon: CalendarClock, roles: ['school_admin', 'organization_owner', 'teacher', 'student'] },
        { href: '/timetable-wizard', label: 'Timetable Wizard', icon: Sparkles, roles: ['school_admin', 'organization_owner'] },
        { href: '/settings/academic-year', label: 'Academic Year', icon: Calendar, roles: ['school_admin', 'organization_owner'] },
        { href: '/settings/archives', label: 'Archives', icon: Archive, roles: ['school_admin', 'organization_owner'] },
      ],
    },
    
    // Financial Section
    {
      key: 'financial',
      label: 'Financial',
      icon: DollarSign,
      roles: ['school_admin', 'organization_owner'],
      items: [
        { href: '/fees', label: 'Fees Management', icon: CreditCard },
        { href: '/payments/record', label: 'Record Payments', icon: Receipt },
        { href: '/invoices', label: 'Invoices', icon: FileText },
        { href: '/expenditure', label: 'Expenditure', icon: Receipt },
        { href: '/organizations/subscription', label: 'Subscription', icon: DollarSign },
      ],
    },
    
    // Settings & Reports Section
    {
      key: 'settings',
      label: 'Settings & Reports',
      icon: Settings,
      roles: ['school_admin', 'organization_owner', 'teacher', 'student'],
      items: [
        { href: '/settings/school-type', label: 'School Type Setup', icon: Building2, roles: ['school_admin', 'organization_owner'] },
        { href: '/reports-new', label: 'Reports & Analytics', icon: BarChart3, roles: ['school_admin', 'organization_owner'] },
        { href: '/reports', label: 'AI Reports', icon: Sparkles, roles: ['school_admin', 'organization_owner'] },
        { href: '/settings', label: 'Settings', icon: Settings, roles: ['superadmin', 'school_admin', 'organization_owner', 'teacher', 'student'] },
      ],
    },
  ];

  // Filter categories and items based on user role
  const visibleCategories = navigationCategories
    .map(category => {
      // Check if category is visible for this role
      if (!userRole || !category.roles.includes(userRole)) {
        return null;
      }

      // Filter items within the category
      const visibleItems = category.items.filter(item => {
        if (!item.roles) return true; // If no roles specified, show to all in this category
        return item.roles.includes(userRole);
      });

      if (visibleItems.length === 0) return null;

      return { ...category, items: visibleItems };
    })
    .filter(Boolean) as NavCategory[];

  return (
    <SidebarMenu>
      {visibleCategories.map((category) => {
        if (!category) return null;
        
        const CategoryIcon = category.icon;
        const isOpen = openGroups[category.key];
        
        return (
          <Collapsible
            key={category.key}
            open={isOpen}
            onOpenChange={() => toggleGroup(category.key)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={{ children: category.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                    className="w-full"
                  >
                    <CategoryIcon className="h-4 w-4" />
                    <span>{category.label}</span>
                    {isOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </SidebarMenuItem>
              
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    {category.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
                      
                      return (
                        <SidebarMenuSubItem key={item.href}>
                          <Link href={item.href} passHref legacyBehavior>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive}
                              aria-current={isActive ? "page" : undefined}
                            >
                              <a>
                                <ItemIcon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        );
      })}
    </SidebarMenu>
  );
}
