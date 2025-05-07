'use client';

import type { ReactNode} from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, type User as AppUser } from '@/services/user';
import { useRouter, usePathname } from 'next/navigation';
import { FirestoreError } from 'firebase/firestore';

interface AuthContextType {
  currentUser: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      let profile: AppUser | null = null;
      if (user) {
        try {
          profile = await getUserProfile(user.uid);
          setCurrentUser(profile);
        } catch (error) {
          console.error("Error fetching user profile on auth state change:", error);
           if (error instanceof FirestoreError && error.message.includes("offline")) {
              console.warn("AuthProvider: Could not fetch profile while offline. User is authenticated but profile data may be stale.");
              // Decide if you want to set currentUser to null or keep potentially stale data
              // Setting to null might trigger redirects if AuthGuard strictly checks currentUser
              // Keeping stale data might show outdated info.
              // For now, let's keep the last known state if available, otherwise null.
              // setCurrentUser(currentUser); // Keep existing state if any
              // Or set null to force re-fetch when online:
               setCurrentUser(null); // Set to null when offline fetch fails
           } else {
              // Handle other errors fetching profile (e.g., permissions)
               setCurrentUser(null); // Treat other errors as profile not available
           }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Removed currentUser from dependency array to avoid re-running unnecessarily

  useEffect(() => {
    // This effect handles redirection and is now mostly handled by AuthGuard
    // Keeping it simple here, AuthGuard has the primary responsibility.
    if (!loading && !firebaseUser && pathname !== '/login' && !pathname.startsWith('/_next/')) {
       console.log("AuthContext: No Firebase user detected, redirecting might be needed.");
       // AuthGuard will handle the actual push to /login
    }
     if (!loading && firebaseUser && !currentUser && pathname !== '/login' && !pathname.startsWith('/_next/')) {
        // This state can happen if auth is OK but profile fetch failed (e.g., offline, permissions)
        console.warn("AuthContext: Firebase user exists, but AppUser profile is null. Waiting for profile or potential issue.");
        // Don't redirect here, let AuthGuard handle it, but log the state.
        // If profile fetch consistently fails, it might indicate a Firestore issue or rules problem.
     }

  }, [firebaseUser, currentUser, loading, router, pathname]);


  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle error (e.g., show toast)
    } finally {
      // Ensure loading is set to false even on error, though redirect might happen first
      setLoading(false); 
    }
  };

  const value = {
    currentUser,
    firebaseUser,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}