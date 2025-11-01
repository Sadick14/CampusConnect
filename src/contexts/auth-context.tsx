'use client';

import type { ReactNode} from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { syncUserProfileOnLogin, type User as AppUser } from '@/services/user';

interface AuthContextType {
  user: AppUser | null;
  currentUser: AppUser | null; // Kept for backward compatibility
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

  // Function to fetch and set the user profile from Firestore
   const fetchAndSetProfile = useCallback(async (fbUser: FirebaseUser | null) => {
       console.log("[AuthContext] fetchAndSetProfile called. fbUser UID:", fbUser?.uid);
       setLoading(true);
       let profile: AppUser | null = null;
       try {
           if (fbUser) {
               console.log(`[AuthContext] Fetching/syncing profile for UID: ${fbUser.uid}`);
               profile = await syncUserProfileOnLogin(fbUser);
               console.log(`[AuthContext] Profile fetched/synced:`, profile);
               if (JSON.stringify(profile) !== JSON.stringify(currentUser)) {
                    console.log("[AuthContext] Setting new currentUser state.");
                    setCurrentUser(profile);
               } else {
                    console.log("[AuthContext] Profile data hasn't changed, skipping currentUser update.");
               }
           } else {
               console.log("[AuthContext] No Firebase user, setting currentUser to null.");
               if (currentUser !== null) {
                   setCurrentUser(null);
               }
           }
       } catch (error) {
           console.error("[AuthContext] Error syncing/fetching user profile:", error);
           setCurrentUser(null);
       } finally {
           console.log("[AuthContext] Setting loading to false.");
           setLoading(false);
       }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [currentUser]);

  // Listener for Firebase Auth state changes
  useEffect(() => {
      setLoading(true);
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log("[AuthContext] Auth state changed. New Firebase User:", user?.uid, "Current Firebase User State:", firebaseUser?.uid);
          if (user?.uid !== firebaseUser?.uid) {
              console.log("[AuthContext] Firebase user changed. Updating firebaseUser state and fetching profile...");
              setFirebaseUser(user);
              await fetchAndSetProfile(user);
          } else if (!user && firebaseUser) {
              console.log("[AuthContext] User logged out. Updating firebaseUser state and clearing profile...");
              setFirebaseUser(null);
              await fetchAndSetProfile(null);
          } else {
              console.log("[AuthContext] Auth state changed, but firebaseUser UID is the same or initial load. Ensuring loading is false.");
              setLoading(false);
          }
      });

      return () => {
          console.log("[AuthContext] Unsubscribing from onAuthStateChanged.");
          unsubscribe();
      };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndSetProfile, firebaseUser]);

  // Function to manually refresh the profile from Firestore
  const refreshUserProfile = useCallback(async () => {
      const currentFbUser = auth.currentUser;
      if (currentFbUser) {
          console.log("[AuthContext] Manually refreshing user profile from Firestore...");
          await fetchAndSetProfile(currentFbUser);
      } else {
           console.log("No Firebase user to refresh profile for.");
           await fetchAndSetProfile(null);
      }
  }, [fetchAndSetProfile]);

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Error signing out: ", error);
      setLoading(false);
    }
  };

  const value = {
    user: currentUser, // Modern alias
    currentUser, // Kept for backward compatibility
    firebaseUser,
    loading,
    logout,
    refreshUserProfile,
  };

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
