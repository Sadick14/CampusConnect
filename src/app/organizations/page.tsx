'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Users, Calendar, Settings, Lock, CheckCircle, Loader2 } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="text-center animate-fade-in-up">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 blur-xl"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-green-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-green-100/20 to-emerald-100/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12 text-center animate-fade-in-up">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-2xl mb-6">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 blur-xl"></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Your Organizations
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Manage and access all your educational institutions from one beautiful dashboard
          </p>
        </div>

        {/* Create Organization Button */}
        <div className="mb-12 flex justify-center animate-slide-in-right">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="btn-modern h-14 px-8 text-lg font-semibold rounded-2xl group">
                <Plus className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                Create New Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-3xl card-modern p-0 overflow-hidden">
              <div className="p-8">
                <DialogHeader className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-xl mb-4">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <DialogTitle className="text-2xl font-bold">Create New Organization</DialogTitle>
                  <DialogDescription className="text-base">
                    {organizations.length === 0
                      ? "Set up your first educational institution with a 14-day free trial."
                      : "Create additional organization (payment required to activate)."
                    }
                  </DialogDescription>
                </DialogHeader>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="org-name" className="text-sm font-semibold text-gray-700 mb-2 block">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={newOrgForm.name}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Springfield High School"
                    className="input-modern h-12 text-base rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="org-type" className="text-sm font-semibold text-gray-700 mb-2 block">Organization Type</Label>
                  <Select
                    value={newOrgForm.type}
                    onValueChange={(value: any) => setNewOrgForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="input-modern h-12 text-base rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="school" className="rounded-lg">School</SelectItem>
                      <SelectItem value="university" className="rounded-lg">University</SelectItem>
                      <SelectItem value="college" className="rounded-lg">College</SelectItem>
                      <SelectItem value="academy" className="rounded-lg">Academy</SelectItem>
                      <SelectItem value="institute" className="rounded-lg">Institute</SelectItem>
                      <SelectItem value="other" className="rounded-lg">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="org-description" className="text-sm font-semibold text-gray-700 mb-2 block">Description (Optional)</Label>
                  <Textarea
                    id="org-description"
                    value={newOrgForm.description || ''}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your organization..."
                    className="input-modern text-base rounded-xl min-h-[100px] resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-4 pt-6">
                  <Button
                    onClick={handleCreateOrganization}
                    disabled={creatingOrg || !newOrgForm.name.trim()}
                    className="btn-modern flex-1 h-12 text-base font-semibold rounded-xl"
                  >
                    {creatingOrg ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Create Organization
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={creatingOrg}
                    className="h-12 px-6 text-base font-semibold rounded-xl border-2 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations Grid */}
        {organizations.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-2xl">
                <Building2 className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-gray-400/20 to-gray-500/20 blur-xl"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Organizations Yet</h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
              Create your first organization to get started with Syntra and enjoy a 14-day free trial.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {organizations.map((org, index) => (
              <Card
                key={org.id}
                className="card-modern cursor-pointer border-0 rounded-3xl overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleOrganizationClick(org)}
              >
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {org.name}
                        </CardTitle>
                        <Badge variant="outline" className="mt-1 capitalize text-xs font-medium rounded-lg px-2 py-1">
                          {org.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(org)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(org)}
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {org.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                      {org.description}
                    </p>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{org.memberCount} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {org.subscriptionStatus === 'trial' && org.daysRemaining <= 7 && (
                      <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-xl text-sm text-yellow-800 font-medium">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Trial expires in {org.daysRemaining} day{org.daysRemaining !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                    {org.subscriptionStatus === 'pending_payment' && (
                      <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-xl text-sm text-red-800 font-medium">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                          Payment required to activate
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}