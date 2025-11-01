/**
 * School Activity Table for Super Admin Dashboard
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SchoolActivity } from '@/services/super-admin-stats';
import { formatCurrency } from '@/lib/currency';
import { 
  School, 
  Users, 
  GraduationCap, 
  UserCog, 
  Calendar,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';

interface SchoolActivityTableProps {
  data: SchoolActivity[];
  loading: boolean;
}

type SortField = 'name' | 'users' | 'students' | 'teachers' | 'revenue' | 'lastActivity';
type SortOrder = 'asc' | 'desc';

export function SchoolActivityTable({ data, loading }: SchoolActivityTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastActivity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedData = data
    .filter(school => 
      school.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'users':
          aValue = a.totalUsers;
          bValue = b.totalUsers;
          break;
        case 'students':
          aValue = a.studentCount;
          bValue = b.studentCount;
          break;
        case 'teachers':
          aValue = a.teacherCount;
          bValue = b.teacherCount;
          break;
        case 'revenue':
          aValue = a.revenue;
          bValue = b.revenue;
          break;
        case 'lastActivity':
          aValue = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          bValue = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500">Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500">Trial</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          School Activity
        </CardTitle>
        <CardDescription>Real-time activity across all schools</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('name')}
                      className="font-semibold hover:bg-transparent"
                    >
                      School <SortIcon field="name" />
                    </Button>
                  </th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-center p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('users')}
                      className="font-semibold hover:bg-transparent"
                    >
                      <Users className="h-4 w-4 mr-1" /> Total <SortIcon field="users" />
                    </Button>
                  </th>
                  <th className="text-center p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('students')}
                      className="font-semibold hover:bg-transparent"
                    >
                      <GraduationCap className="h-4 w-4 mr-1" /> Students <SortIcon field="students" />
                    </Button>
                  </th>
                  <th className="text-center p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('teachers')}
                      className="font-semibold hover:bg-transparent"
                    >
                      <UserCog className="h-4 w-4 mr-1" /> Teachers <SortIcon field="teachers" />
                    </Button>
                  </th>
                  <th className="text-right p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('revenue')}
                      className="font-semibold hover:bg-transparent"
                    >
                      Revenue <SortIcon field="revenue" />
                    </Button>
                  </th>
                  <th className="text-right p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('lastActivity')}
                      className="font-semibold hover:bg-transparent"
                    >
                      <Calendar className="h-4 w-4 mr-1" /> Last Active <SortIcon field="lastActivity" />
                    </Button>
                  </th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((school) => (
                  <tr key={school.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{school.name}</div>
                    </td>
                    <td className="p-3">
                      {getSubscriptionBadge(school.subscriptionStatus)}
                    </td>
                    <td className="text-center p-3">
                      <span className="font-medium">{school.totalUsers}</span>
                    </td>
                    <td className="text-center p-3">
                      <span className="text-blue-600 font-medium">{school.studentCount}</span>
                    </td>
                    <td className="text-center p-3">
                      <span className="text-purple-600 font-medium">{school.teacherCount}</span>
                    </td>
                    <td className="text-right p-3">
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(school.revenue)}
                      </span>
                    </td>
                    <td className="text-right p-3 text-muted-foreground">
                      {formatDate(school.lastActivity)}
                    </td>
                    <td className="text-center p-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                      >
                        <Link href={`/super-admin/schools/${school.id}`}>
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-muted-foreground">
                      {searchQuery ? 'No schools found matching your search' : 'No school activity data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredAndSortedData.length} of {data.length} schools
        </div>
      </CardContent>
    </Card>
  );
}
