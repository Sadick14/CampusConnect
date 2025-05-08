'use client';

import type { ReactNode} from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { syncUserProfileOnLogin, type User as AppUser } from '@/services/user';
import { useRouter } from 'next/navigation';

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
  const [loading, setLoading] = useState(true); // Initialize loading to true
  const router = useRouter();

  // Function to fetch and set the user profile from memory
   const fetchAndSetProfile = useCallback(async (fbUser: FirebaseUser | null) => {
       console.log("[AuthContext] fetchAndSetProfile called. fbUser UID:", fbUser?.uid);
       // Start loading only if we are actually going to fetch/sync
       setLoading(true);
       let profile: AppUser | null = null;
       try {
           if (fbUser) {
               console.log(`[AuthContext] Fetching/syncing profile for UID: ${fbUser.uid}`);
               profile = await syncUserProfileOnLogin(fbUser); // Pass only fbUser
               console.log(`[AuthContext] Profile fetched/synced:`, profile);
               // Only update state if the profile data has actually changed
               if (JSON.stringify(profile) !== JSON.stringify(currentUser)) {
                    console.log("[AuthContext] Setting new currentUser state.");
                    setCurrentUser(profile);
               } else {
                    console.log("[AuthContext] Profile data hasn't changed, skipping currentUser update.");
               }
           } else {
               console.log("[AuthContext] No Firebase user, setting currentUser to null.");
               if (currentUser !== null) { // Only update if it's currently not null
                   setCurrentUser(null);
               }
           }
       } catch (error) {
           console.error("[AuthContext] Error syncing/fetching user profile:", error);
           setCurrentUser(null); // Clear user on error
       } finally {
           console.log("[AuthContext] Setting loading to false.");
           setLoading(false);
       }
   // Depend on currentUser to compare against fetched profile
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [currentUser]); // currentUser needed for comparison inside

  // Listener for Firebase Auth state changes
  useEffect(() => {
      // Set initial loading true when the listener mounts
      setLoading(true);
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log("[AuthContext] Auth state changed. New Firebase User:", user?.uid, "Current Firebase User State:", firebaseUser?.uid);
          // Check if the user *actually* changed before processing
          if (user?.uid !== firebaseUser?.uid) {
              console.log("[AuthContext] Firebase user changed. Updating firebaseUser state and fetching profile...");
              setFirebaseUser(user); // Update the firebaseUser state FIRST
              await fetchAndSetProfile(user);
          } else if (!user && firebaseUser) {
              // Handle logout case where user becomes null
              console.log("[AuthContext] User logged out. Updating firebaseUser state and clearing profile...");
              setFirebaseUser(null);
              await fetchAndSetProfile(null);
          } else {
              console.log("[AuthContext] Auth state changed, but firebaseUser UID is the same or initial load. Ensuring loading is false.");
              // If user hasn't changed, we are likely done with initial check or redundant firing.
              setLoading(false);
          }
      });

      return () => {
          console.log("[AuthContext] Unsubscribing from onAuthStateChanged.");
          unsubscribe();
      };
  // fetchAndSetProfile is stable. firebaseUser is needed for comparison.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndSetProfile, firebaseUser]);


  // Function to manually refresh the profile from memory
  const refreshUserProfile = useCallback(async () => {
      const currentFbUser = auth.currentUser; // Get the latest firebase user state directly
      if (currentFbUser) {
          console.log("[AuthContext] Manually refreshing user profile (in-memory)...");
          await fetchAndSetProfile(currentFbUser);
      } else {
           console.log("No Firebase user to refresh profile for.");
           await fetchAndSetProfile(null); // Ensure profile is cleared if no user
      }
  }, [fetchAndSetProfile]);


  const logout = async () => {
    setLoading(true); // Indicate loading during logout
    try {
      await firebaseSignOut(auth);
      // State updates (currentUser, firebaseUser) will be handled by the onAuthStateChanged listener
      console.log("User signed out initiated via logout function.");
      // Don't push here, let AuthGuard handle redirect based on state change
      // router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      setLoading(false); // Ensure loading is false on error
    }
    // No finally block needed for loading, as onAuthStateChanged handles it
  };

  const value = {
    currentUser,
    firebaseUser,
    loading,
    logout,
    refreshUserProfile,
  };

  // Render children only when loading is false to prevent rendering protected routes prematurely
  return (
      <AuthContext.Provider value={value}>
          {children}
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
