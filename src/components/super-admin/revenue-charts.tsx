/**
 * Revenue Analytics Charts for Super Admin Dashboard
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RevenueMetrics } from '@/services/super-admin-stats';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp, DollarSign } from 'lucide-react';

interface RevenueChartsProps {
  data: RevenueMetrics | null;
  loading: boolean;
}

export function RevenueCharts({ data, loading }: RevenueChartsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Revenue Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Summary
          </CardTitle>
          <CardDescription>Platform-wide revenue metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Today</span>
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(data.daily)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">This Week</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(data.weekly)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">This Month</span>
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(data.monthly)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">This Quarter</span>
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(data.quarterly)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">This Year</span>
              <span className="text-lg font-bold text-indigo-600">
                {formatCurrency(data.yearly)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Revenue Schools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Top Revenue Schools
          </CardTitle>
          <CardDescription>Highest earning schools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.bySchool.slice(0, 10).map((school, index) => (
              <div 
                key={school.schoolId} 
                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {school.schoolName}
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {formatCurrency(school.amount)}
                </span>
              </div>
            ))}
            {data.bySchool.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No revenue data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
