
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common/page-header';
import { OrganizationListSkeleton } from '@/components/common/page-skeletons';
import { Label } from '@/components/ui/label';
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
import { getAllOrganizations, deleteOrganization, updateOrganizationSubscription } from '@/services/organization';
import { initializeTrialSubscription, getSubscription } from '@/services/subscription';
import { Organization } from '@/schemas/organization';
import Link from 'next/link';

export default function SuperAdminOrganizationsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [newSubscriptionStatus, setNewSubscriptionStatus] = useState<string>('');

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

  const handleViewOrg = (org: Organization) => {
    setSelectedOrg(org);
    setViewDialogOpen(true);
  };

  const handleEditOrg = (org: Organization) => {
    setSelectedOrg(org);
    setNewSubscriptionStatus(org.subscriptionStatus || 'trial');
    setEditDialogOpen(true);
  };

  const handleUpdateSubscription = async () => {
    if (!selectedOrg || !currentUser) return;

    try {
      await updateOrganizationSubscription(
        selectedOrg.id,
        {
          subscriptionStatus: newSubscriptionStatus as any,
        }
      );

      setOrganizations(organizations.map(org =>
        org.id === selectedOrg.id
          ? { ...org, subscriptionStatus: newSubscriptionStatus as any }
          : org
      ));

      toast({
        title: 'Success',
        description: 'Organization subscription updated',
      });

      setEditDialogOpen(false);
      setSelectedOrg(null);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to update organization',
        variant: 'destructive',
      });
    }
  };

  const handleActivateTrial = async (org: Organization) => {
    try {
      // Check if subscription already exists
      const existingSub = await getSubscription(org.id);
      if (existingSub) {
        toast({
          title: 'Info',
          description: 'This organization already has a subscription',
          variant: 'default',
        });
        return;
      }

      // Initialize trial
      await initializeTrialSubscription(org.id, org.name);

      toast({
        title: 'Success',
        description: `30-day trial activated for ${org.name}`,
      });

      // Refresh organizations list
      const orgsData = await getAllOrganizations();
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Error activating trial:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate trial subscription',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOrg = (org: Organization) => {
    setSelectedOrg(org);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrg || !currentUser) return;

    try {
      await deleteOrganization(selectedOrg.id, currentUser.id);
      setOrganizations(organizations.filter(org => org.id !== selectedOrg.id));

      toast({
        title: 'Success',
        description: 'Organization deleted',
      });

      setDeleteDialogOpen(false);
      setSelectedOrg(null);
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete organization',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <OrganizationListSkeleton />;
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
                              <DropdownMenuItem onClick={() => handleViewOrg(org)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleActivateTrial(org)}>
                                <Unlock className="h-4 w-4 mr-2" />
                                Activate Trial
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditOrg(org)}>
                                <Send className="h-4 w-4 mr-2" />
                                Manage Subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteOrg(org)}>
                                <Ban className="h-4 w-4 mr-2" />
                                Delete Organization
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

      {/* View Organization Dialog */}
      {selectedOrg && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Organization Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedOrg.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Organization Name</Label>
                  <p className="text-lg text-gray-900 mt-1">{selectedOrg.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Owner Email</Label>
                  <p className="text-lg text-gray-900 mt-1">{selectedOrg.ownerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusBadge(selectedOrg.subscriptionStatus || 'trial')}>
                      {selectedOrg.subscriptionStatus || 'trial'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Subscription Type</Label>
                  <p className="text-lg text-gray-900 mt-1">{selectedOrg.subscriptionType || 'TRIAL'}</p>
                </div>
              </div>

              {/* Trial Information */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-gray-900">Trial Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Trial Active</Label>
                    <p className="text-lg text-gray-900 mt-1">
                      {selectedOrg.isTrialActive ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Days Remaining</Label>
                    <p className="text-lg text-gray-900 mt-1">
                      {selectedOrg.daysRemaining || 0} days
                    </p>
                  </div>
                  {selectedOrg.trialStartDate && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Trial Start</Label>
                      <p className="text-lg text-gray-900 mt-1">
                        {new Date((selectedOrg.trialStartDate as any).toDate?.() || selectedOrg.trialStartDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedOrg.trialEndDate && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Trial End</Label>
                      <p className="text-lg text-gray-900 mt-1">
                        {new Date((selectedOrg.trialEndDate as any).toDate?.() || selectedOrg.trialEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* License Information */}
              {selectedOrg.licenseKey && (
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900">License Information</h3>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">License Key</Label>
                    <p className="text-lg text-gray-900 mt-1 font-mono">{selectedOrg.licenseKey}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-gray-900">System Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Created At</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date((selectedOrg.createdAt as any).toDate?.() || selectedOrg.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Last Updated</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date((selectedOrg.updatedAt as any).toDate?.() || selectedOrg.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit/Manage Subscription Dialog */}
      {selectedOrg && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Organization Subscription</DialogTitle>
              <DialogDescription>
                Update subscription status for {selectedOrg.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subscriptionStatus">Subscription Status</Label>
                <select
                  id="subscriptionStatus"
                  value={newSubscriptionStatus}
                  onChange={(e) => setNewSubscriptionStatus(e.target.value)}
                  className="w-full mt-2 p-2 border rounded-md"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="locked">Locked</option>
                  <option value="expired">Expired</option>
                  <option value="pending_payment">Pending Payment</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Current Status:</strong> {selectedOrg.subscriptionStatus || 'trial'}</p>
                <p><strong>Current Type:</strong> {selectedOrg.subscriptionType || 'TRIAL'}</p>
                <p><strong>Days Remaining:</strong> {selectedOrg.daysRemaining || 0}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSubscription}>
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedOrg && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedOrg.name}</strong>?
              This action cannot be undone and will delete all associated data including
              students, staff, classes, and fee records.
            </AlertDialogDescription>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Organization
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
