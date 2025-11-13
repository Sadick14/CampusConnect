/**
 * @fileOverview Service functions for managing user data in Firestore.
 * PRODUCTION VERSION - Uses Firestore for persistent storage.
 */

import type { User as FirebaseUser } from 'firebase/auth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  deleteDoc 
} from 'firebase/firestore';
import { auth, getDb } from '@/lib/firebase';

// Import types from schemas
import {
    type User,
    type AdminUserFormData,
    type StudentWithContact
} from '@/schemas/user';

// Re-export types for convenience
export type { User, AdminUserFormData, StudentWithContact };

console.log('User Service: Using Firestore Database.');

/**
 * Fetches a user's profile from Firestore, including associated school details.
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  if (!uid) {
      console.error('getUserProfile called with invalid UID:', uid);
      return null;
  }
  
  try {
    const db = getDb();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`No profile found for user UID: ${uid}`);
      return null;
    }

    const data = userSnap.data();
    
    // Fetch school details if organizationId exists
    let schoolName = data.schoolName || null;
    let schoolLogoUrl = data.schoolLogoUrl || null;
    
    if (data.organizationId && data.role !== 'superadmin') {
      try {
        const schoolRef = doc(db, 'schools', data.organizationId);
        const schoolSnap = await getDoc(schoolRef);
        
        if (schoolSnap.exists()) {
          const schoolData = schoolSnap.data();
          schoolName = schoolData.name || null;
          schoolLogoUrl = schoolData.logoUrl || null;
          
          // Update denormalized fields if they've changed
          if (schoolName !== data.schoolName || schoolLogoUrl !== data.schoolLogoUrl) {
            await updateDoc(userRef, {
              schoolName,
              schoolLogoUrl,
              updatedAt: serverTimestamp()
            });
          }
        } else {
          // School not found, clear association
          console.warn(`School ${data.organizationId} not found for user ${uid}`);
          await updateDoc(userRef, {
            organizationId: null,
            schoolName: null,
            schoolLogoUrl: null,
            updatedAt: serverTimestamp()
          });
          schoolName = null;
          schoolLogoUrl = null;
        }
      } catch (error) {
        console.error(`Error fetching school for user ${uid}:`, error);
      }
    }

    return {
      id: userSnap.id,
      name: data.name,
      email: data.email,
      role: data.role,
      currentOrganizationId: (data as any).organizationId || null,
      organizationIds: data.organizationIds || [],
      schoolName,
      schoolLogoUrl,
      class: data.class || null,
      parentContact: data.parentContact || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as User;
  } catch (error: any) {
    console.error(`Error fetching user profile for UID ${uid}:`, error);
    return null;
  }
}

/**
 * Creates or updates the user's profile in Firestore during the login process.
 * Handles both Google Auth and Email/Password auth without conflicts.
 */
export async function syncUserProfileOnLogin(firebaseUser: FirebaseUser): Promise<User> {
    console.log(`[User Service - Firestore] Syncing profile for UID: ${firebaseUser.uid}, Email: ${firebaseUser.email}`);
    
    const db = getDb();
    const userRef = doc(db, 'users', firebaseUser.uid);
    
    // Determine role - Superadmin identified by email
    const superadminEmails = [
      'issakasaddick14@gmail.com',
      'superadmin@campusconnect.com',
      'superadmin@example.com',
      'admin@campusconnect.com'
    ];
    
    const isSuperAdmin = firebaseUser.email && superadminEmails.includes(firebaseUser.email.toLowerCase());
    
    try {
      const userSnap = await getDoc(userRef);
      const existingProfile = userSnap.exists() ? userSnap.data() : null;
      
      // Get user's current organization from user_organizations
      let currentOrganizationId: string | null = null;
      try {
        const { getUserCurrentOrganization } = await import('./user-organization');
        currentOrganizationId = await getUserCurrentOrganization(firebaseUser.uid);
        console.log(`[User Service] Current organization ID: ${currentOrganizationId}`);
      } catch (error) {
        console.error('[User Service] Error fetching current organization:', error);
      }
      
      // Build profile data
      const profileData: any = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.photoURL || null,
        currentOrganizationId: currentOrganizationId,
      };
      
      if (existingProfile) {
        // User exists - preserve existing data and only update what's needed
        console.log(`[User Service] Existing user found with role: ${existingProfile.role}`);
        
        profileData.role = existingProfile.role;
        profileData.organizationId = existingProfile.organizationId || null;
        profileData.organizationIds = existingProfile.organizationIds || [];
        profileData.schoolName = existingProfile.schoolName || null;
        profileData.schoolLogoUrl = existingProfile.schoolLogoUrl || null;
        profileData.class = existingProfile.class || null;
        profileData.parentContact = existingProfile.parentContact || null;
        profileData.createdAt = existingProfile.createdAt;
        
        // Override to superadmin if email matches
        if (isSuperAdmin && profileData.role !== 'superadmin') {
          console.log(`[User Service] Promoting user to superadmin based on email`);
          profileData.role = 'superadmin';
          profileData.organizationId = null;
          profileData.schoolName = null;
          profileData.schoolLogoUrl = null;
          profileData.currentOrganizationId = null;
        }
        
        profileData.updatedAt = serverTimestamp();
        
        // Update existing document
        await updateDoc(userRef, profileData);
        console.log(`[User Service] Updated existing user profile with currentOrganizationId: ${currentOrganizationId}`);
        
      } else {
        // New user - create profile
        console.log(`[User Service] Creating new user profile`);
        
        if (isSuperAdmin) {
          profileData.role = 'superadmin';
          profileData.organizationId = null;
          profileData.schoolName = null;
          profileData.schoolLogoUrl = null;
        } else {
          // New users default to school_admin (can be changed during onboarding)
          profileData.role = 'school_admin';
          profileData.organizationId = null;
          profileData.schoolName = null;
          profileData.schoolLogoUrl = null;
        }
        
        profileData.createdAt = serverTimestamp();
        profileData.updatedAt = serverTimestamp();
        
        // Create new document (use set with merge to avoid conflicts)
        console.log(`[User Service] Attempting to create Firestore document...`);
        try {
          await setDoc(userRef, profileData, { merge: true });
          console.log(`[User Service] ✅ setDoc completed without error`);
          
          // Verify the document was actually created
          const verifySnap = await getDoc(userRef);
          if (verifySnap.exists()) {
            console.log(`[User Service] ✅ Document verified in Firestore!`);
          } else {
            console.error(`[User Service] ❌ Document NOT found in Firestore after setDoc!`);
            console.error(`[User Service] This usually means Firestore rules blocked the creation.`);
            throw new Error('Document creation blocked by Firestore rules');
          }
        } catch (createError: any) {
          console.error(`[User Service] ❌ Failed to create user document:`, createError);
          console.error(`[User Service] Error code:`, createError.code);
          console.error(`[User Service] Error message:`, createError.message);
          throw createError;
        }
      }
      
      // Fetch and return the updated profile
      console.log(`[User Service] Fetching final profile data...`);
      const updatedSnap = await getDoc(userRef);
      
      if (!updatedSnap.exists()) {
        console.error(`[User Service] ❌ CRITICAL: Profile document does not exist in Firestore!`);
        throw new Error('Profile document not found after sync');
      }
      
      const data = updatedSnap.data()!;
      
      return {
        id: updatedSnap.id,
        name: data.name,
        email: data.email,
        role: data.role,
        currentOrganizationId: (data as any).organizationId || data.currentOrganizationId || null,
        organizationIds: data.organizationIds || [],
        schoolName: data.schoolName || null,
        schoolLogoUrl: data.schoolLogoUrl || null,
        photoURL: data.photoURL || null,
        class: data.class || null,
        parentContact: data.parentContact || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as User;
      
    } catch (error: any) {
      console.error(`[User Service] ❌ Error syncing user profile:`, error);
      console.error(`[User Service] Error code:`, error?.code);
      console.error(`[User Service] Error message:`, error?.message);
      console.error(`[User Service] Full error:`, JSON.stringify(error, null, 2));
      
      // If there's an error, create a minimal profile to allow login
      const fallbackProfile: any = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: isSuperAdmin ? 'superadmin' : 'school_admin',
        organizationId: null,
        photoURL: firebaseUser.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log(`[User Service] Attempting to create fallback profile...`);
      try {
        await setDoc(userRef, fallbackProfile, { merge: true });
        console.log(`[User Service] ✅ Created fallback profile successfully`);
      } catch (fallbackError: any) {
        console.error(`[User Service] ❌ Fallback profile creation also failed:`, fallbackError);
        console.error(`[User Service] Fallback error code:`, fallbackError?.code);
        console.error(`[User Service] Fallback error message:`, fallbackError?.message);
      };
      
      // Return fallback user object
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: fallbackProfile.name,
        role: fallbackProfile.role,
        currentOrganizationId: null,
        organizationIds: [],
        photoURL: firebaseUser.photoURL || null,
        class: null,
        parentContact: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
}

/**
 * Retrieves all users from Firestore, optionally filtered by school.
 */
export async function getUsers(forSchoolId?: string): Promise<User[]> {
  try {
    const db = getDb();
    const usersRef = collection(db, 'users');
    
    let q = forSchoolId 
      ? query(usersRef, where('organizationId', '==', forSchoolId))
      : query(usersRef);

    const querySnapshot = await getDocs(q);
    const users: User[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        currentOrganizationId: (data as any).organizationId || data.currentOrganizationId || null,
        organizationIds: data.organizationIds || [],
        photoURL: data.photoURL || null,
        class: data.class || null,
        parentContact: data.parentContact || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as User);
    });

    console.log(`Fetched ${users.length} users${forSchoolId ? ` for school ${forSchoolId}` : ''}`);
    return users;
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Admin creates a new user (Auth + Firestore profile).
 */
export async function adminCreateUserProfile(
    userData: Omit<AdminUserFormData, 'id'>,
    creatingAdminRole: string,
    creatingAdminSchoolId?: string | null
): Promise<User> {
    // Permission checks
    if (creatingAdminRole !== 'superadmin' && creatingAdminRole !== 'school_admin') {
        throw new Error("Permission denied: Only admins can create users.");
    }
    
    if (!userData.password) {
        throw new Error("Password is required to create a new user.");
    }
    
    let effectiveSchoolId = userData.organizationId;
    if ((userData.role === 'teacher' || userData.role === 'student') && !effectiveSchoolId) {
        if (creatingAdminRole === 'school_admin' && creatingAdminSchoolId) {
            effectiveSchoolId = creatingAdminSchoolId;
        } else if (creatingAdminRole !== 'superadmin') {
            throw new Error(`School ID is required for role '${userData.role}'.`);
        }
    }
    
    if (userData.email === 'superadmin@example.com') {
        throw new Error("Cannot create user with the reserved superadmin email.");
    }
    
    // Check if email already exists in Firestore
    const db = getDb();
    const usersRef = collection(db, 'users');
    const emailQuery = query(usersRef, where('email', '==', userData.email));
    const existingUsers = await getDocs(emailQuery);
    
    if (!existingUsers.empty) {
        throw new Error(`Email ${userData.email} is already in use.`);
    }

    // Create Firebase Auth User
    let authUser: FirebaseUser;
    try {
        console.log(`Creating Auth user for ${userData.email}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        authUser = userCredential.user;
        console.log(`Auth user created with UID: ${authUser.uid}`);
        await updateProfile(authUser, { displayName: userData.name });
    } catch (error: any) {
        console.error(`Error creating Firebase Auth user:`, error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error(`Email ${userData.email} is already in use.`);
        }
        throw new Error(`Failed to create authentication account: ${error.message}`);
    }

    // Prepare user profile
    const profileToCreate: any = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        organizationId: effectiveSchoolId || null,
        schoolName: null,
        schoolLogoUrl: null,
        class: (userData.role === 'student' ? userData.class : null) || null,
        parentContact: (userData.role === 'student' ? userData.parentContact : null) || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // Fetch school details if organizationId provided
    if (profileToCreate.organizationId) {
        try {
            const schoolRef = doc(db, 'schools', profileToCreate.organizationId);
            const schoolSnap = await getDoc(schoolRef);
            
            if (schoolSnap.exists()) {
                const schoolData = schoolSnap.data();
                profileToCreate.schoolName = schoolData.name || null;
                profileToCreate.schoolLogoUrl = schoolData.logoUrl || null;
                console.log(`Assigning user to school: ${profileToCreate.schoolName}`);
            } else {
                console.warn(`School ID ${profileToCreate.organizationId} not found, setting to null`);
                profileToCreate.organizationId = null;
            }
        } catch (error) {
            console.error('Error fetching school:', error);
            profileToCreate.organizationId = null;
        }
    }

    // Create Firestore profile
    try {
        const userRef = doc(db, 'users', authUser.uid);
        await setDoc(userRef, profileToCreate);
        console.log(`User profile created for ${userData.email} with ID ${authUser.uid}`);
        
        // Return the created profile
        const createdProfile = await getUserProfile(authUser.uid);
        if (!createdProfile) {
            throw new Error('Failed to retrieve created profile');
        }
        return createdProfile;
    } catch (error: any) {
        console.error(`Error creating user profile:`, error);
        throw new Error(`Failed to create profile: ${error.message}`);
    }
}

/**
 * Admin updates an existing user's profile in Firestore.
 */
export async function adminUpdateUserProfile(
    userId: string,
    updates: Partial<AdminUserFormData>,
    updatingAdminRole: string,
    updatingAdminSchoolId?: string | null
): Promise<User> {
    if (updatingAdminRole !== 'superadmin' && updatingAdminRole !== 'school_admin') {
        throw new Error("Permission denied: Only admins can update users.");
    }

    const existingUser = await getUserProfile(userId);
    if (!existingUser) {
        throw new Error("User profile not found.");
    }

    // Authorization checks
    if (existingUser.role === 'superadmin' && updatingAdminRole !== 'superadmin') {
        throw new Error("Only a superadmin can modify another superadmin's profile.");
    }
    
    if (updatingAdminRole === 'school_admin') {
        if (!updatingAdminSchoolId) throw new Error("School admin must have a school ID.");
        const existingOrgId = (existingUser as any).organizationId || existingUser.currentOrganizationId;
        if (existingOrgId !== updatingAdminSchoolId) {
            throw new Error("School admins can only edit users within their own school.");
        }
    }

    // Prepare updates
    const dataToUpdate: any = {};
    let needsUpdate = false;

    if (updates.name !== undefined && updates.name !== existingUser.name) {
        dataToUpdate.name = updates.name;
        needsUpdate = true;
    }
    
    if (updates.role && updates.role !== existingUser.role) {
        dataToUpdate.role = updates.role;
        needsUpdate = true;
    }
    
    if (updates.hasOwnProperty('class') && updates.class !== existingUser.class) {
        dataToUpdate.class = updates.class || null;
        needsUpdate = true;
    }
    
    if (updates.hasOwnProperty('parentContact')) {
        const newContact = updates.parentContact || null;
        if (JSON.stringify(newContact) !== JSON.stringify(existingUser.parentContact)) {
            dataToUpdate.parentContact = newContact;
            needsUpdate = true;
        }
    }

    // Update in Firestore
    if (needsUpdate) {
        try {
            const db = getDb();
            const userRef = doc(db, 'users', userId);
            dataToUpdate.updatedAt = serverTimestamp();
            
            await updateDoc(userRef, dataToUpdate);
            console.log(`User ${userId} updated successfully`);
            
            const updatedUser = await getUserProfile(userId);
            if (!updatedUser) {
                throw new Error('Failed to retrieve updated user');
            }
            return updatedUser;
        } catch (error: any) {
            console.error(`Error updating user:`, error);
            throw new Error(`Failed to update profile: ${error.message}`);
        }
    } else {
        console.log(`No changes to update for user ${userId}`);
        return existingUser;
    }
}

/**
 * Check if an email is a superadmin email.
 */
export async function isSuperAdminEmail(email: string): Promise<boolean> {
    const superadminEmails = [
        'issakasaddick14@gmail.com',
        'superadmin@campusconnect.com',
        'superadmin@example.com',
        'admin@campusconnect.com'
    ];
    return superadminEmails.includes(email.toLowerCase());
}

/**
 * Get students with parent contact for a specific school.
 */
export async function getStudentsWithContacts(organizationId: string): Promise<StudentWithContact[]> {
    if (!organizationId) {
        throw new Error("School ID is required to fetch students.");
    }
    
    try {
        const db = getDb();
        const usersRef = collection(db, 'users');
        const studentsQuery = query(
            usersRef,
            where('organizationId', '==', organizationId),
            where('role', '==', 'student')
        );
        
        const querySnapshot = await getDocs(studentsQuery);
        const students: StudentWithContact[] = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            students.push({
                id: doc.id,
                name: data.name,
                email: data.email,
                role: data.role,
                currentOrganizationId: (data as any).organizationId || data.currentOrganizationId || null,
                organizationIds: data.organizationIds || [],
                class: data.class || null,
                parentContact: data.parentContact || null,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            } as StudentWithContact);
        });
        
        console.log(`Fetched ${students.length} students for school ${organizationId}`);
        return students;
    } catch (error: any) {
        console.error(`Error fetching students:`, error);
        throw new Error("Failed to fetch students.");
    }
}

/**
 * Updates user's role and profile data after signup.
 * This is called from the client after account creation to set the initial role.
 */
export async function updateUserRoleAfterSignup(
    userId: string, 
    role: 'school_admin' | 'teacher' | 'student',
    name: string
): Promise<User> {
    try {
        const db = getDb();
        const userRef = doc(db, 'users', userId);
        
        // Update the user's role and name
        await updateDoc(userRef, {
            role,
            name,
            updatedAt: serverTimestamp()
        });
        
        console.log(`Updated user ${userId} role to ${role}`);
        
        // Fetch and return the updated profile
        const updatedProfile = await getUserProfile(userId);
        if (!updatedProfile) {
            throw new Error('Failed to retrieve updated profile');
        }
        
        return updatedProfile;
    } catch (error: any) {
        console.error('Error updating user role after signup:', error);
        throw new Error('Failed to update user role');
    }
}

/**
 * Updates user's role to organization_owner when they create their first organization.
 */
export async function promoteToOrganizationOwner(userId: string): Promise<User> {
    try {
        const db = getDb();
        const userRef = doc(db, 'users', userId);
        
        // Update the user's role to organization_owner
        await updateDoc(userRef, {
            role: 'organization_owner',
            updatedAt: serverTimestamp()
        });
        
        console.log(`Promoted user ${userId} to organization_owner`);
        
        // Fetch and return the updated profile
        const updatedProfile = await getUserProfile(userId);
        if (!updatedProfile) {
            throw new Error('Failed to retrieve updated profile');
        }
        
        return updatedProfile;
    } catch (error: any) {
        console.error('Error promoting user to organization owner:', error);
        throw new Error('Failed to promote user to organization owner');
    }
}
