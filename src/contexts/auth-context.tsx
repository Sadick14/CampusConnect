
'use client';

import type { ReactNode} from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  refreshUserProfile: () => Promise<void>; // Add refresh function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // Keep pathname for potential future use

  // Function to fetch and set the user profile
  const fetchAndSetProfile = useCallback(async (fbUser: FirebaseUser | null) => {
      setLoading(true);
      let profile: AppUser | null = null;
       if (fbUser) {
         try {
           // Try to get existing profile first (might be stale if just updated)
           const existingProfile = await getUserProfile(fbUser.uid);
           // Sync handles creation/update/role assignment, including school details
           profile = await syncUserProfileOnLogin(fbUser, existingProfile);
           setCurrentUser(profile);
         } catch (error) {
           console.error("Error syncing/fetching user profile:", error);
           if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
              console.warn("AuthProvider: Could not sync/fetch profile while offline. User authenticated but profile data may be stale.");
              // Attempt to use potentially stale data if available, otherwise null
              // setCurrentUser(currentUser); // Keep existing state if any (might be null) - Risky if login needs fresh data
              // For login, better to show an error or prevent proceeding without profile
              setCurrentUser(null); // Clear profile if sync fails offline during login/refresh
           } else {
               console.error("Critical error during profile sync/fetch. Logging out.", error);
               setCurrentUser(null);
               // await logout(); // Avoid potential infinite loop if logout also fails
           }
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
      setFirebaseUser(user); // Update Firebase user state
      await fetchAndSetProfile(user); // Fetch/sync profile based on new auth state
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndSetProfile]); // Depend on the stable fetch function

  // Function to manually refresh the profile
  const refreshUserProfile = useCallback(async () => {
      if (firebaseUser) {
          console.log("Manually refreshing user profile...");
          await fetchAndSetProfile(firebaseUser);
      } else {
           console.log("No Firebase user to refresh profile for.");
      }
  }, [firebaseUser, fetchAndSetProfile]);


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
    refreshUserProfile, // Expose refresh function
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
