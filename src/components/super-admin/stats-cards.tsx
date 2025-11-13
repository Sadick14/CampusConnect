/**
 * Super Admin Dashboard Statistics Cards
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  GraduationCap, 
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban
} from 'lucide-react';
import type { SystemStats } from '@/services/super-admin-stats';
import { formatCurrency } from '@/lib/currency';

interface StatsCardsProps {
  data: SystemStats | null;
  loading: boolean;
}

export function StatsCards({ data, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-2" />
        <p>Failed to load statistics</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Organizations',
      value: data.totalSchools,
      icon: Building2,
      description: `${data.activeSchools} active, ${data.suspendedSchools} suspended`,
      color: 'text-blue-600',
    },
    {
      title: 'Total Users',
      value: data.totalUsers.toLocaleString(),
      icon: Users,
      description: 'All platform users',
      color: 'text-green-600',
    },
    {
      title: 'Students',
      value: data.totalStudents.toLocaleString(),
      icon: GraduationCap,
      description: 'Enrolled students',
      color: 'text-purple-600',
    },
    {
      title: 'Teachers',
      value: data.totalTeachers.toLocaleString(),
      icon: Briefcase,
      description: 'Active teachers',
      color: 'text-orange-600',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      icon: DollarSign,
      description: 'All-time earnings',
      color: 'text-emerald-600',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(data.monthlyRevenue),
      icon: TrendingUp,
      description: 'This month',
      color: 'text-cyan-600',
    },
    {
      title: 'Pending Payments',
      value: data.pendingPayments,
      icon: Clock,
      description: 'Awaiting approval',
      color: 'text-yellow-600',
    },
    {
      title: 'Active Sessions',
      value: data.activeAcademicSessions,
      icon: CheckCircle2,
      description: 'Academic terms',
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
