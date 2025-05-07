
'use client';

import type { ReactNode} from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, syncUserProfileOnLogin, type User as AppUser } from '@/services/user'; // Import syncUserProfileOnLogin
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
      setLoading(true); // Start loading when auth state changes
      setFirebaseUser(user);
      let profile: AppUser | null = null;

      if (user) {
        try {
          // First, try to get the existing profile
          const existingProfile = await getUserProfile(user.uid);
          // Then, call syncUserProfileOnLogin which handles creation/update/role assignment
          profile = await syncUserProfileOnLogin(user, existingProfile);
          setCurrentUser(profile);
        } catch (error) {
          console.error("Error syncing/fetching user profile on auth state change:", error);
           if (error instanceof FirestoreError && (error.message.includes("offline") || error.code === 'unavailable')) {
              console.warn("AuthProvider: Could not sync/fetch profile while offline. User is authenticated but profile data may be stale or incomplete.");
              // Attempt to use potentially stale data if available, otherwise null
              setCurrentUser(currentUser); // Keep existing state if any (might be null)
           } else {
              // Handle other critical errors (e.g., permissions preventing sync)
               console.error("Critical error during profile sync/fetch. Logging out.", error);
               setCurrentUser(null);
               // Consider logging out the user if profile sync fails critically
               // await logout(); // Be careful with async operations in error handlers
           }
        }
      } else {
        // No Firebase user, clear the app user profile
        setCurrentUser(null);
      }
      setLoading(false); // Finish loading after profile handling
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Removed the secondary useEffect for redirection logic as AuthGuard handles it

  const logout = async () => {
    // No need to set loading here, as onAuthStateChanged will trigger and set loading
    try {
      await firebaseSignOut(auth);
      // Clear local state immediately for faster UI update
      setCurrentUser(null);
      setFirebaseUser(null);
      router.push('/login'); // Redirect after sign out
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle error (e.g., show toast)
    }
    // No finally block needed, onAuthStateChanged handles loading state
  };

  const value = {
    currentUser,
    firebaseUser,
    loading,
    logout,
  };

  // Render children only when loading is false to prevent flash of incorrect content
  // AuthGuard also provides a loading state, but this adds an extra layer
  return (
      <AuthContext.Provider value={value}>
          {!loading ? children : (
              // Optional: Render a global loading indicator here if desired
              // Or rely on AuthGuard's loading indicator
              null
          )}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
