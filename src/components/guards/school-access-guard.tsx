'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { isSchoolAccessBlocked } from '@/services/school-status';
import { getSchoolFromMemory } from '@/lib/in-memory-db';
import { Loader2 } from 'lucide-react';

interface SchoolAccessGuardProps {
  children: React.ReactNode;
}

/**
 * Component to check if the current user's school access should be blocked
 * Redirects to payment page if school is locked or suspended
 */
export function SchoolAccessGuard({ children }: SchoolAccessGuardProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessAllowed, setAccessAllowed] = useState(false);

  useEffect(() => {
    const checkSchoolAccess = async () => {
      // Skip check for super admin
      if (currentUser?.role === 'superadmin') {
        setAccessAllowed(true);
        setLoading(false);
        return;
      }

      // Skip check if no user or no school
      if (!currentUser || !currentUser.currentOrganizationId) {
        setAccessAllowed(true);
        setLoading(false);
        return;
      }

      try {
        // Get school data from memory (since we're using in-memory storage)
        const school = getSchoolFromMemory(currentUser.currentOrganizationId);
        
        if (!school) {
          console.error('School not found for user:', currentUser.currentOrganizationId);
          setAccessAllowed(true);
          setLoading(false);
          return;
        }

        // Check if school access is blocked
        if (isSchoolAccessBlocked(school)) {
          console.log('School access blocked, redirecting to payment page');
          router.push('/payment-required');
          return;
        }

        // Check if trial has expired but not yet locked
        const trialEnd = new Date(school.trialEndDate);
        const now = new Date();
        
        if (now > trialEnd && school.subscriptionStatus === 'trial') {
          console.log('Trial expired, redirecting to payment page');
          router.push('/payment-required');
          return;
        }

        setAccessAllowed(true);
      } catch (error) {
        console.error('Error checking school access:', error);
        // Allow access if there's an error checking
        setAccessAllowed(true);
      } finally {
        setLoading(false);
      }
    };

    checkSchoolAccess();
  }, [currentUser, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!accessAllowed) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}