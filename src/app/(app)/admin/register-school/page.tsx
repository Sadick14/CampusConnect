'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminRegistrationForm } from '@/components/admin/admin-registration-form';
import { PageHeader } from '@/components/common/page-header';

export default function AdminRegistrationPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!currentUser || currentUser.role !== 'superadmin')) {
      router.push('/');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'superadmin') {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <PageHeader
        title="Register New School"
        description="Create a new school and assign a school administrator"
      />
      <div className="mt-8">
        <AdminRegistrationForm />
      </div>
    </div>
  );
}
