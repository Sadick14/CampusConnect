
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common/page-header';
import {
  MoreVertical,
  Building2,
  Users,
  Loader2,
  Send,
  Ban,
  Unlock,
  Eye,
  Search,
} from 'lucide-react';
import { getAllOrganizations, type Organization } from '@/services/organization';
import Link from 'next/link';

export default function SuperAdminOrganizationsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Authorization check
  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  useEffect(() => {
    async function loadData() {
      if (!currentUser || currentUser.role !== 'superadmin') return;      
      setLoading(true);
      try {
        const orgsData = await getAllOrganizations();
        setOrganizations(orgsData);
      } catch (error: any) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to load organizations data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser, toast]);
  
  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      locked: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      pending_payment: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };
  
  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Organizations"
        description="View and manage all organizations on the platform."
      />

       <Card>
          <CardHeader>
            <CardTitle>All Organizations ({filteredOrganizations.length})</CardTitle>
             <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or owner email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Organization Name</TableHead>
                    <TableHead>Owner Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No organizations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrganizations.map(org => (
                      <TableRow key={org.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>{org.ownerEmail}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(org.subscriptionStatus || 'trial')}>
                            {org.subscriptionStatus || 'trial'}
                          </Badge>
                        </TableCell>
                        <TableCell>{org.subscriptionType || 'TRIAL'}</TableCell>
                        <TableCell>
                          {new Date(org.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/super-admin/organizations/${org.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/super-admin/organizations/${org.id}`)}>
                                <Unlock className="h-4 w-4 mr-2" />
                                Manage Subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => router.push(`/super-admin/organizations/${org.id}`)}>
                                <Ban className="h-4 w-4 mr-2" />
                                Lock Organization
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
