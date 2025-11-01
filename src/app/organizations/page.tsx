'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Users, Calendar, Settings, Lock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Organization } from '@/schemas/organization';
import { getUserOrganizations, createOrganization } from '@/services/organization';
import { addUserOrganization, setUserCurrentOrganization } from '@/services/user-organization';
import { promoteToOrganizationOwner } from '@/services/user';
import { NewOrganizationSchema, NewOrganizationData } from '@/schemas/organization';

export default function OrganizationDashboard() {
  const { user, loading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  
  // Form state for new organization
  const [newOrgForm, setNewOrgForm] = useState<NewOrganizationData>({
    name: '',
    type: 'school',
    description: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadOrganizations();
    }
  }, [user, loading, router]);

  const loadOrganizations = async () => {
    if (!user) return;

    try {
      setLoadingOrgs(true);
      const userOrgs = await getUserOrganizations(user.id);
      setOrganizations(userOrgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organizations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!user) return;

    try {
      // Validate form data
      const validatedData = NewOrganizationSchema.parse(newOrgForm);
      
      setCreatingOrg(true);

      // Check if this is the user's first organization
      const isFirstOrg = organizations.length === 0;

      // Create the organization
      const newOrg = await createOrganization(
        validatedData,
        user.id,
        user.email || ''
      );

      // Add organization to user's list
      await addUserOrganization(user.id, newOrg.id);

      // Set as current organization
      await setUserCurrentOrganization(user.id, newOrg.id);

      // If this is their first organization, promote them to organization_owner
      if (isFirstOrg) {
        await promoteToOrganizationOwner(user.id);
        console.log('User promoted to organization_owner');
        
        // Refresh the user profile to update the role in the context
        await refreshUserProfile();
      }

      // Update local state
      setOrganizations(prev => [newOrg, ...prev]);

      // Reset form and close modal
      setNewOrgForm({
        name: '',
        type: 'school',
        description: '',
      });
      setIsCreateModalOpen(false);

      // Show appropriate success message
      toast({
        title: 'Success!',
        description: isFirstOrg 
          ? `${newOrg.name} has been created successfully. Your 14-day trial has started!`
          : `${newOrg.name} has been created successfully. Payment is required to activate this organization.`,
      });

    } catch (error: any) {
      console.error('Error creating organization:', error);
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        const firstError = error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create organization. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleOrganizationClick = async (org: Organization) => {
    if (!user) return;

    try {
      // Set as current organization
      await setUserCurrentOrganization(user.id, org.id);
      
      // Redirect to organization dashboard
      router.push(`/dashboard?org=${org.id}`);
    } catch (error) {
      console.error('Error setting current organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to access organization. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (org: Organization) => {
    switch (org.subscriptionStatus) {
      case 'trial':
        return <Badge variant="secondary">Trial ({org.daysRemaining} days left)</Badge>;
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'locked':
        return <Badge variant="destructive">Locked</Badge>;
      case 'pending_payment':
        return <Badge variant="outline">Payment Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (org: Organization) => {
    switch (org.subscriptionStatus) {
      case 'trial':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
      case 'locked':
      case 'suspended':
        return <Lock className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading || loadingOrgs) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Organizations</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage all your educational institutions in one place. Your first organization gets a 14-day free trial, additional organizations require payment to activate.
          </p>
        </div>

        {/* Create Organization Button */}
        <div className="mb-8 flex justify-center">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-5 w-5 mr-2" />
                Create New Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>
                  {organizations.length === 0 
                    ? "Set up your first educational institution with a 14-day free trial."
                    : "Create additional organization (payment required to activate)."
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={newOrgForm.name}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Springfield High School"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="org-type">Organization Type</Label>
                  <Select 
                    value={newOrgForm.type} 
                    onValueChange={(value: any) => setNewOrgForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                      <SelectItem value="college">College</SelectItem>
                      <SelectItem value="academy">Academy</SelectItem>
                      <SelectItem value="institute">Institute</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="org-description">Description (Optional)</Label>
                  <Textarea
                    id="org-description"
                    value={newOrgForm.description || ''}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your organization..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleCreateOrganization} 
                    disabled={creatingOrg || !newOrgForm.name.trim()}
                    className="flex-1"
                  >
                    {creatingOrg ? 'Creating...' : 'Create Organization'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={creatingOrg}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations Grid */}
        {organizations.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organizations Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first organization to get started with CampusConnect.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Card 
                key={org.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500"
                onClick={() => handleOrganizationClick(org)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                    </div>
                    {getStatusIcon(org)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(org)}
                    <Badge variant="outline" className="capitalize">
                      {org.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {org.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {org.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{org.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {org.subscriptionStatus === 'trial' && org.daysRemaining <= 7 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      ⚠️ Trial expires in {org.daysRemaining} day{org.daysRemaining !== 1 ? 's' : ''}
                    </div>
                  )}
                  {org.subscriptionStatus === 'pending_payment' && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                      💳 Payment required to activate this organization
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}