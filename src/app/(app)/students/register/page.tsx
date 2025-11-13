'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { StudentRegistrationForm } from '@/components/students/student-registration-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getUserCurrentOrganization } from '@/services/user-organization';
import { FormSkeleton } from '@/components/common/page-skeletons';

export default function StudentRegistrationPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState<string>('');
  const [orgLoading, setOrgLoading] = useState(true);

  // Fetch current organization
  useEffect(() => {
    const fetchOrganization = async () => {
      // Wait for auth to finish loading
      if (loading) return;
      
      // If no user after loading, don't redirect (let auth guard handle it)
      if (!currentUser) {
        setOrgLoading(false);
        return;
      }
      
      try {
        setOrgLoading(true);
        const orgId = await getUserCurrentOrganization(currentUser.id);
        console.log('[StudentRegistrationPage] Fetched organizationId:', orgId);
        
        if (!orgId) {
          console.error('[StudentRegistrationPage] No organization found for user');
          router.push('/organizations');
          return;
        }
        
        setOrganizationId(orgId);
      } catch (error) {
        console.error('[StudentRegistrationPage] Error fetching organization:', error);
        router.push('/organizations');
      } finally {
        setOrgLoading(false);
      }
    };

    fetchOrganization();
  }, [currentUser, loading, router]);

  // Only school admins and organization owners can register students
  if (!loading && currentUser && !['school_admin', 'organization_owner'].includes(currentUser.role)) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only school administrators and organization owners can register new students.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || orgLoading) {
    return <FormSkeleton fields={10} />;
  }

  if (!organizationId) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Organization</AlertTitle>
          <AlertDescription>
            Please select an organization first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSuccess = (studentId: string) => {
    // Redirect to student profile after successful registration
    setTimeout(() => {
      router.push(`/students/${studentId}`);
    }, 1500);
  };

  console.log('[StudentRegistrationPage] Using organizationId:', organizationId);
  console.log('[StudentRegistrationPage] currentUser.id:', currentUser?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modern Header */}
      <div className="card-modern rounded-3xl p-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Register New Student</h1>
          <p className="text-gray-600 text-lg">Complete the multi-step form to register a new student</p>
        </div>
      </div>

      {/* Registration Form Card */}
      <div className="card-modern rounded-3xl p-8">
        <StudentRegistrationForm
          organizationId={organizationId}
          userId={currentUser?.id || ''}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
