'use client';

import type { ReactNode} from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // auth and storage only now
import { getUserProfile, syncUserProfileOnLogin, type User as AppUser } from '@/services/user';
import { useRouter, usePathname } from 'next/navigation';
// Remove FirestoreError import
// import { FirestoreError } from 'firebase/firestore';

interface AuthContextType {
  currentUser: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Function to fetch and set the user profile from memory
  const fetchAndSetProfile = useCallback(async (fbUser: FirebaseUser | null) => {
      setLoading(true);
      let profile: AppUser | null = null;
       if (fbUser) {
         try {
           // getUserProfile now uses the in-memory store
           const existingProfile = await getUserProfile(fbUser.uid);
           // syncUserProfileOnLogin now uses the in-memory store
           profile = await syncUserProfileOnLogin(fbUser, existingProfile);
           setCurrentUser(profile);
         } catch (error) {
           console.error("[AuthContext] Error syncing/fetching user profile (in-memory):", error);
           // Remove Firestore specific offline error handling
           // if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) { ... }
           // Handle generic errors or specific errors from in-memory logic if needed
           console.error("Critical error during profile sync/fetch. Logging out.", error);
           setCurrentUser(null);
           // Consider if logout is needed here based on the error type
           // await logout();
         }
       } else {
         setCurrentUser(null);
       }
       setLoading(false);
  }, []); // No dependencies needed for the core logic

  // Listener for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed. User:", user?.uid);
      setFirebaseUser(user);
      await fetchAndSetProfile(user);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndSetProfile]);

  // Function to manually refresh the profile from memory
  const refreshUserProfile = useCallback(async () => {
      if (firebaseUser) {
          console.log("[AuthContext] Manually refreshing user profile (in-memory)...");
          await fetchAndSetProfile(firebaseUser);
      } else {
           console.log("No Firebase user to refresh profile for.");
      }
  }, [firebaseUser, fetchAndSetProfile]);


  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      router.push('/login');
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const value = {
    currentUser,
    firebaseUser,
    loading,
    logout,
    refreshUserProfile,
  };

  return (
      <AuthContext.Provider value={value}>
          {!loading ? children : null }
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