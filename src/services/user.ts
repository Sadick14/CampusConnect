
/**
 * @fileOverview Service functions for managing user data.
 */
import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc, serverTimestamp, Timestamp, FirestoreError } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth'; // Keep FirebaseUser type
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; // Import auth functions
import { db, auth } from '@/lib/firebase';
import type { School } from './school'; // Assuming School type is available
import { z } from 'zod';

/**
 * Represents a user in the system.
 */
export interface User {
  /**
   * The unique identifier of the user (Firebase Auth UID / Firestore Doc ID).
   */
  id: string;
  /**
   * The display name of the user.
   */
  name: string; // Typically displayName
  /**
   * The email of the user.
   */
  email: string | null;
  /**
   * The role of the user (e.g., 'superadmin', 'school_admin', 'teacher', 'student').
   */
  role: string;
  /**
   * The ID of the school the user is associated with (optional). Stored as null if not associated.
   */
  schoolId?: string | null;
  /**
   * The name of the school the user is associated with (optional, denormalized).
   */
  schoolName?: string | null;
  /**
   * ISO string representation of the creation date.
   */
  createdAt?: string;
  /**
   * ISO string representation of the last update date.
   */
  updatedAt?: string;
}

// Zod schema for validating user data when created/edited by an admin
// Now includes password for creation.
export const AdminUserFormSchema = z.object({
  id: z.string().optional(), // Firestore Doc ID, present when editing.
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").optional(), // Required for creation, optional for update
  role: z.enum(['student', 'teacher', 'school_admin'], { // Superadmin role handled separately
    errorMap: () => ({ message: "Invalid role selected." })
  }),
  schoolId: z.string().optional().nullable(), // Allow null or optional string
}).refine(data => data.id || data.password, { // Password is required if ID is not present (i.e., creating)
    message: "Password is required when creating a new user.",
    path: ["password"],
});

export type AdminUserFormData = z.infer<typeof AdminUserFormSchema>;


/**
 * Fetches a user's profile from Firestore.
 * @param uid The Firebase Authentication UID / Firestore Document ID of the user.
 * @returns A promise that resolves to a User object if found, or null.
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  if (!uid) {
      console.error('getUserProfile called with invalid UID:', uid);
      return null;
  }
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      let schoolName = data.schoolName;

      // If schoolId exists but schoolName doesn't, try fetching it
      if (data.schoolId && !schoolName) {
        try {
            const schoolDocRef = doc(db, 'schools', data.schoolId);
            const schoolSnap = await getDoc(schoolDocRef);
            if (schoolSnap.exists()) {
              const schoolData = schoolSnap.data() as School;
              schoolName = schoolData.name;
              // Optionally update the user profile with the fetched name (can cause extra writes)
              // await updateDoc(userDocRef, { schoolName: schoolName });
            } else {
                console.warn(`School document ${data.schoolId} not found for user ${uid}.`);
                schoolName = null; // Set to null if school doc is missing
            }
        } catch (schoolError) {
            console.warn(`Could not fetch school name for schoolId ${data.schoolId}:`, schoolError);
            schoolName = null; // Set to null on error fetching school
        }
      }

      return {
        id: userSnap.id,
        name: data.name || data.displayName || 'Unnamed User',
        email: data.email,
        role: data.role || 'guest',
        schoolId: data.schoolId ?? null, // Ensure null if undefined/missing
        schoolName: schoolName ?? null, // Ensure null if undefined/missing/fetch failed
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    } else {
      console.warn(`No profile found for user UID: ${uid} in 'users' collection.`);
      // Check if this is the superadmin UID, if so, create profile on the fly (handled in login logic now)
      // if (uid === 'superadmin') {
      //   console.log("Superadmin profile not found, will be created on login.");
      // }
      return null;
    }
  } catch (error: any) {
    console.error(`Error fetching user profile for UID ${uid}:`, error);
    if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
        console.warn("getUserProfile: Failed to get user profile because the client is offline.");
        // Consider returning a placeholder or cached data if available
        return null; // Or potentially throw to indicate critical failure
    }
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
        console.error(`Permission denied fetching user profile for UID ${uid}. Check Firestore rules.`);
        // Return null or throw, depending on how you want AuthGuard to react
        return null;
     }
    return null; // Return null for other errors
  }
}

/**
 * Creates or updates the user's profile in Firestore *during the login process*.
 * This ensures the profile exists and syncs basic info (name, email) from Auth.
 * It also specifically handles setting the 'superadmin' role based on the UID.
 * @param firebaseUser The Firebase Auth user object from onAuthStateChanged or signIn.
 * @param existingProfileData Optional: If profile was fetched *before* calling this (e.g., in AuthProvider).
 * @returns Promise resolving to the User profile from Firestore.
 */
export async function syncUserProfileOnLogin(
  firebaseUser: FirebaseUser,
  existingProfileData?: User | null // Pass existing data if already fetched
): Promise<User> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let needsWrite = false;
    let profileDataToSave: Partial<User> & { updatedAt: any, createdAt?: any } = {
        updatedAt: serverTimestamp(),
    };

    let currentRole = existingProfileData?.role;
    let currentSchoolId = existingProfileData?.schoolId;
    let currentSchoolName = existingProfileData?.schoolName;

    // 1. Determine Role (Superadmin override)
    if (firebaseUser.uid === 'superadmin') {
        if (currentRole !== 'superadmin') {
            console.log(`User ${firebaseUser.uid} is superadmin. Setting/updating role.`);
            profileDataToSave.role = 'superadmin';
            profileDataToSave.schoolId = null; // Superadmin has no school
            profileDataToSave.schoolName = null;
            needsWrite = true;
        }
         // Ensure role is superadmin even if profile somehow existed with a different role
         currentRole = 'superadmin';
         currentSchoolId = null;
         currentSchoolName = null;
    } else if (!currentRole) {
        // If profile didn't exist or had no role, assign default (e.g., 'student')
        // This case is less likely if profiles are created via admin actions first.
        console.warn(`User ${firebaseUser.uid} has no role in Firestore profile. Assigning default 'student'.`);
        profileDataToSave.role = 'student';
        currentRole = 'student';
        needsWrite = true;
    } else {
         // Use the role from the existing profile if not superadmin
         profileDataToSave.role = currentRole;
    }


    // 2. Sync Basic Info (Name, Email) if different from Auth
    const authName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous';
    const existingName = existingProfileData?.name;
    if (!existingProfileData || authName !== existingName) {
         // Prefer existing Firestore name unless it's missing/default and Auth has a better one.
         // Let admin updates control the canonical name, generally. Only set if Firestore is missing it.
         if (!existingName || existingName === 'Anonymous User' || existingName === 'Unnamed User') {
             profileDataToSave.name = authName;
             needsWrite = true;
         } else if (!profileDataToSave.name) {
              // Ensure name field is set even if not changing
              profileDataToSave.name = existingName;
         }
    } else if (!profileDataToSave.name) {
         profileDataToSave.name = existingName;
    }


    if (!existingProfileData || firebaseUser.email !== existingProfileData.email) {
        profileDataToSave.email = firebaseUser.email;
        needsWrite = true;
    } else if (!profileDataToSave.email) {
        profileDataToSave.email = existingProfileData.email;
    }

     // 3. Set schoolId/schoolName based on currentRole (ensure consistency)
     if (currentRole === 'superadmin') {
         if (currentSchoolId !== null || currentSchoolName !== null) {
             profileDataToSave.schoolId = null;
             profileDataToSave.schoolName = null;
             needsWrite = true;
         } else {
             profileDataToSave.schoolId = null;
             profileDataToSave.schoolName = null;
         }
     } else {
         // Use existing schoolId/Name if available, otherwise null
         profileDataToSave.schoolId = currentSchoolId ?? null;
         profileDataToSave.schoolName = currentSchoolName ?? null;
         // Note: We don't fetch schoolName here; assume it's correct if present.
         // getUserProfile handles fetching if missing.
     }


    // 4. Add createdAt timestamp if creating new profile
    if (!existingProfileData) {
        profileDataToSave.createdAt = serverTimestamp();
        needsWrite = true;
        console.log(`Creating new Firestore profile for user ${firebaseUser.uid}`);
    }

    // 5. Perform Write only if necessary
    if (needsWrite) {
        try {
             // Clean data just before writing
             const cleanData = Object.entries(profileDataToSave).reduce((acc, [key, value]) => {
                 if (value !== undefined) {
                     acc[key as keyof typeof profileDataToSave] = value;
                 }
                 return acc;
             }, {} as { [key: string]: any });

            await setDoc(userDocRef, cleanData, { merge: true });
            console.log(`User profile synced/created for UID: ${firebaseUser.uid}`);
        } catch (error: any) {
            console.error(`Error syncing user profile for UID ${firebaseUser.uid}:`, error);
             if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
                 console.error("syncUserProfileOnLogin failed: Client is offline.");
                 // Decide how to handle - maybe return existing data or throw?
                 // Returning existing might be safer for login flow continuity.
                 if (existingProfileData) return existingProfileData;
                 throw new Error(`Failed to sync user profile (offline): ${error.message}`); // Throw if no existing data
             }
            throw new Error(`Failed to sync user profile: ${error.message}`);
        }
    } else {
         console.log(`User profile for ${firebaseUser.uid} is up-to-date. No sync needed.`);
    }

    // 6. Return the definitive profile state (fetch again if written, or use existing/merged)
    if (needsWrite) {
        const finalSnap = await getDoc(userDocRef);
        if (!finalSnap.exists()) throw new Error("Failed to retrieve profile after sync write.");
        const finalData = finalSnap.data();
        return {
            id: firebaseUser.uid,
            name: finalData.name,
            email: finalData.email,
            role: finalData.role,
            schoolId: finalData.schoolId ?? null,
            schoolName: finalData.schoolName ?? null,
            createdAt: finalData.createdAt instanceof Timestamp ? finalData.createdAt.toDate().toISOString() : undefined,
            updatedAt: finalData.updatedAt instanceof Timestamp ? finalData.updatedAt.toDate().toISOString() : undefined,
        };
    } else {
        // Return the merged data if no write occurred but fields were potentially added
        return {
            id: firebaseUser.uid,
            name: profileDataToSave.name!, // Should be set
            email: profileDataToSave.email!, // Should be set
            role: profileDataToSave.role!, // Should be set
            schoolId: profileDataToSave.schoolId,
            schoolName: profileDataToSave.schoolName,
            createdAt: existingProfileData?.createdAt, // Preserve original
            updatedAt: existingProfileData?.updatedAt, // Preserve original
        };
    }
}



/**
 * Retrieves all users (for superadmin) or users for a specific school (for school_admin).
 * @param forSchoolId Optional school ID to filter users by. If provided, only users matching this schoolId are returned.
 *                    If undefined, behavior depends on the caller's assumed role (superadmin likely gets all, others might get none or error).
 * @returns A promise that resolves to an array of User objects.
 */
export async function getUsers(forSchoolId?: string): Promise<User[]> {
  try {
    const usersCol = collection(db, 'users');
    let q;
    if (forSchoolId) {
      console.log(`Fetching users specifically for school: ${forSchoolId}`);
      q = query(usersCol, where('schoolId', '==', forSchoolId));
    } else {
      // When no schoolId is provided, we fetch ALL users.
      // The calling context (e.g., the UI) should enforce whether the current user
      // *should* be allowed to see all users (i.e., if they are superadmin).
      // This function itself doesn't enforce role-based access to the *list*, only filtering.
      console.log("Fetching all users (Superadmin view or unfiltered request).");
      q = query(usersCol);
    }
    const userSnapshot = await getDocs(q);
    const userListPromises = userSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let schoolName = data.schoolName;

      // Fetch school name if missing and schoolId exists
      if (data.schoolId && !schoolName) {
          try {
              const schoolDoc = await getDoc(doc(db, 'schools', data.schoolId));
              if (schoolDoc.exists()) {
                 schoolName = (schoolDoc.data() as School).name;
              } else {
                   schoolName = null; // Indicate school not found
              }
          } catch (e) {
              console.warn(`Could not fetch school name for user ${docSnap.id} school ${data.schoolId}`, e);
              schoolName = null;
          }
      }


      return {
        id: docSnap.id,
        name: data.name || data.displayName || 'N/A',
        email: data.email || 'N/A',
        role: data.role || 'N/A',
        schoolId: data.schoolId ?? null,
        schoolName: schoolName ?? (data.schoolId ? 'School Not Found' : null), // Provide feedback if school lookup failed
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as User;
    });

    const userList = await Promise.all(userListPromises);
    console.log(`Fetched ${userList.length} users.`);
    return userList;
  } catch (error: any) {
    console.error('Error fetching users:', error);
    if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
        console.warn("getUsers: Client is offline, returning empty list.");
        return [];
    }
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
         console.error("Permission denied fetching users list. Check Firestore rules for the 'users' collection.");
         // Depending on app requirements, you might throw or return empty
         // Throwing is often better to indicate a configuration issue.
         throw new Error("Permission denied fetching users list.");
     }
    return []; // Return empty for other unexpected errors
  }
}

/**
 * Admin action to create a new user profile (Auth and Firestore).
 * Creates the Firebase Auth user first, then the Firestore profile using the Auth UID.
 * @param userData Data for the new user profile (name, email, password, role, schoolId).
 * @param creatingAdminRole The role of the admin performing the action ('superadmin' or 'school_admin').
 * @param creatingAdminSchoolId The school ID of the school admin (required if role is 'school_admin').
 * @returns A promise that resolves to the created User object (Firestore profile).
 * @throws Error on permission issues, duplicate email, auth creation failure, or other errors.
 */
export async function adminCreateUserProfile(
    userData: Omit<AdminUserFormData, 'id'>, // Expect password here now
    creatingAdminRole: string,
    creatingAdminSchoolId?: string
): Promise<User> {
    // --- Permission Checks ---
    if (creatingAdminRole !== 'superadmin' && creatingAdminRole !== 'school_admin') {
        throw new Error("Permission denied: Only admins can create users.");
    }
    if (!userData.password) {
        throw new Error("Password is required to create a new user.");
    }
    if (creatingAdminRole === 'school_admin') {
        if (!creatingAdminSchoolId) {
            throw new Error("School admin must have a school ID to create users.");
        }
        if (userData.role === 'school_admin') {
            throw new Error("School admins cannot create other school admins.");
        }
        // Ensure school admin assigns the user to their own school
        if (userData.schoolId && userData.schoolId !== creatingAdminSchoolId) {
            console.warn(`School admin attempting to assign user to different school (${userData.schoolId}). Overriding with admin's school (${creatingAdminSchoolId}).`);
            userData.schoolId = creatingAdminSchoolId;
        } else if (!userData.schoolId) {
            userData.schoolId = creatingAdminSchoolId;
        }
    }
    // Prevent assigning reserved superadmin email/role unless it's the specific login flow
    if (userData.email === 'superadmin@example.com') {
        throw new Error("Cannot create user with the reserved superadmin email via this function.");
    }


    // --- 1. Create Firebase Auth User ---
    let authUser: FirebaseUser;
    try {
         // IMPORTANT: Client-side SDK usage. Recommend backend function with Admin SDK for production.
        console.log(`Attempting to create Auth user for ${userData.email} via admin action...`);
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        authUser = userCredential.user;
        console.log(`Admin action: Auth user created successfully with UID: ${authUser.uid}`);

        // Prevent accidental creation with the superadmin UID via this function
        if (authUser.uid === 'superadmin') {
             // This should ideally not happen if email check is working, but as a safeguard...
             // Need to delete the wrongly created auth user. This is complex to handle reliably client-side.
             console.error("CRITICAL: Accidentally created Auth user with reserved 'superadmin' UID. Manual cleanup needed.");
             // Attempt deletion (might fail due to permissions or needing re-auth)
             // await deleteUser(authUser); // Requires careful implementation
             throw new Error("Critical error: Attempted to create profile with reserved 'superadmin' UID.");
        }

        // Set display name
        try {
             await updateProfile(authUser, { displayName: userData.name });
             console.log(`Set display name for Auth user ${authUser.uid}.`);
        } catch (profileError) {
             console.warn(`Could not set display name for new Auth user ${authUser.uid}:`, profileError);
        }

    } catch (error: any) {
        console.error('Error creating Firebase Auth user via admin action:', error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error(`Authentication failed: The email address ${userData.email} is already in use.`);
        } else if (error.code === 'auth/weak-password') {
            throw new Error('Authentication failed: The password is too weak.');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('Authentication failed: The email address is not valid.');
        }
        throw new Error(`Failed to create user authentication account: ${error.message}`);
    }

    // --- 2. Prepare and Create Firestore User Profile ---
    const userDocRef = doc(db, 'users', authUser.uid); // Use Auth UID as Doc ID
    const profileToCreate: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        schoolId: userData.schoolId ?? null,
        schoolName: null, // Initialize as null, fetch below
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // Fetch schoolName if schoolId is provided
    if (profileToCreate.schoolId) {
        try {
            const schoolDoc = await getDoc(doc(db, 'schools', profileToCreate.schoolId));
            if (schoolDoc.exists()) {
                profileToCreate.schoolName = (schoolDoc.data() as School).name;
                console.log(`Assigning user ${userData.email} to school: ${profileToCreate.schoolName} (${profileToCreate.schoolId})`);
            } else {
                console.warn(`Admin provided non-existent school ID ${profileToCreate.schoolId} for user ${userData.email}. Setting school assignment to null.`);
                profileToCreate.schoolId = null; // Correct invalid ID
                profileToCreate.schoolName = null;
            }
        } catch (e: any) {
             if (e instanceof FirestoreError && (e.code === 'unavailable' || e.message.includes("offline"))) {
                 // Decide: block creation or proceed without school name? Block is safer.
                 throw new Error("Cannot validate school ID: Client is offline.");
             }
            console.error(`Failed to validate school ${profileToCreate.schoolId}:`, e);
            throw new Error(`Failed to validate school information: ${e.message}`);
        }
    } else {
         profileToCreate.schoolName = null;
    }

    // Create the Firestore document
    try {
        const cleanData = Object.entries(profileToCreate).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key as keyof typeof profileToCreate] = value;
            } else if (key === 'schoolId' || key === 'schoolName') {
                 acc[key as keyof typeof profileToCreate] = null;
            }
            return acc;
        }, {} as { [key: string]: any });

        await setDoc(userDocRef, cleanData); // Use setDoc with the Auth UID
        console.log(`Successfully created Firestore profile for ${userData.email} with ID ${authUser.uid}`);

    } catch (error: any) {
        console.error(`Error setting Firestore user profile document for ${userData.email} (UID: ${authUser.uid}):`, error);
         // Attempt cleanup? Very difficult. Log critical error.
         console.error(`CRITICAL: Failed to create Firestore profile for Auth user ${authUser.uid}. Manual cleanup likely needed.`);
         if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
             throw new Error("Cannot create user profile: Client is offline.");
         }
         if (error instanceof FirestoreError && error.code === 'permission-denied') {
            throw new Error("Permission denied creating Firestore profile. Check rules.");
         }
        throw new Error(`Failed to create Firestore profile: ${error.message}`);
    }

    // --- 3. Fetch and Return Created Profile ---
    // Fetch again to get server timestamps resolved
    try {
      const createdDocSnap = await getDoc(userDocRef);
      if (!createdDocSnap.exists()) {
        throw new Error("Failed to retrieve created user profile immediately after creation.");
      }
      const finalData = createdDocSnap.data();
      return {
        id: authUser.uid, // Return the Auth UID
        name: finalData.name,
        email: finalData.email,
        role: finalData.role,
        schoolId: finalData.schoolId ?? null,
        schoolName: finalData.schoolName ?? null,
        createdAt: finalData.createdAt instanceof Timestamp ? finalData.createdAt.toDate().toISOString() : undefined,
        updatedAt: finalData.updatedAt instanceof Timestamp ? finalData.updatedAt.toDate().toISOString() : undefined,
      };
   } catch (error: any) {
        console.error("Error retrieving created profile after saving:", error);
        // Profile likely exists, but retrieval failed. Return based on input data? Risky.
        // Throwing is probably best to signal inconsistency.
       throw new Error("Failed to retrieve complete profile data after creation.");
   }
}


/**
 * Admin action to update an existing user's profile in Firestore.
 * Does NOT update email or password. Auth details must be updated separately if needed.
 * @param userId The ID (Firebase Auth UID / Firestore Doc ID) of the user profile to update.
 * @param updates Partial data for the user profile (name, role, schoolId). ID and password are ignored.
 * @param updatingAdminRole Role of the admin performing the action.
 * @param updatingAdminSchoolId School ID of the admin (if school_admin).
 * @returns A promise that resolves to the updated User object.
 * @throws Error on permission issues or other failures.
 */
export async function adminUpdateUserProfile(userId: string, updates: Partial<AdminUserFormData>, updatingAdminRole: string, updatingAdminSchoolId?: string): Promise<User> {
  // Permission Checks & Initial Fetch (same as before)
   if (updatingAdminRole !== 'superadmin' && updatingAdminRole !== 'school_admin') {
    throw new Error("Permission denied: Only admins can update users.");
  }

  const userDocRef = doc(db, 'users', userId);
  let existingUserData: User;

  try {
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        throw new Error("User profile not found.");
      }
      const data = userSnap.data();
       existingUserData = {
         id: userSnap.id,
         name: data.name,
         email: data.email,
         role: data.role,
         schoolId: data.schoolId ?? null,
         schoolName: data.schoolName ?? null,
         createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
         updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
  } catch (error: any) {
        if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
             throw new Error("Cannot fetch existing user profile: Client is offline.");
        }
       console.error(`Error fetching user profile for update (ID: ${userId}):`, error);
       throw new Error(`Failed to fetch user profile for update: ${error.message}`);
  }

  // --- Apply Authorization Rules --- (same as before)
   if (existingUserData.role === 'superadmin' && updatingAdminRole !== 'superadmin') {
    throw new Error("Only a superadmin can modify another superadmin's profile.");
  }
  if (userId === 'superadmin' && updates.role && updates.role !== 'superadmin') {
      throw new Error("The role of the primary superadmin (UID 'superadmin') cannot be changed from 'superadmin'.");
  }
  if (updatingAdminRole === 'school_admin') {
    if (!updatingAdminSchoolId) {
         throw new Error("School admin performing update is missing their school ID.");
    }
    if (existingUserData.role !== 'superadmin' && existingUserData.schoolId !== updatingAdminSchoolId) {
      throw new Error("School admins can only update users within their own school.");
    }
    if (updates.role && (updates.role === 'school_admin' || updates.role === 'superadmin')) {
         throw new Error("School admins cannot promote users to admin roles.");
    }
    if (existingUserData.role === 'school_admin' && updates.role && updates.role !== 'school_admin') {
         throw new Error("School admins cannot change the role of another school admin.");
    }
     if (updates.schoolId !== undefined && updates.schoolId !== existingUserData.schoolId) {
      throw new Error("School admins cannot change a user's school assignment.");
    }
  }

   // Ignore attempts to change ID, password, or email via this function
   delete updates.id;
   delete updates.password;
    if (updates.email && updates.email !== existingUserData.email) {
        console.warn(`Attempted to update email for ${userId} via adminUpdateUserProfile. Ignoring email update.`);
        delete updates.email;
    }


  // --- Prepare Data for Update ---
  const dataToUpdate: { [key: string]: any } = { updatedAt: serverTimestamp() };
  let needsUpdate = false; // Track if any actual changes are made

  if (updates.name !== undefined && updates.name !== existingUserData.name) {
    dataToUpdate.name = updates.name;
    needsUpdate = true;
  }

  // Update role if allowed and changed
  if (updates.role && updates.role !== existingUserData.role) {
     // ... (role change permission logic remains the same as previous version)
     if (existingUserData.role === 'superadmin') {
        if (updatingAdminRole !== 'superadmin') throw new Error("Permission denied to change superadmin role.");
         if (userId !== 'superadmin') {
              dataToUpdate.role = updates.role;
              needsUpdate = true;
              console.log(`Superadmin changing role of user ${userId} to ${updates.role}`);
         } else {
             console.warn("Attempted to change role of primary superadmin (UID 'superadmin'). Skipping role update.");
         }
     } else if (updates.role === 'school_admin') {
          if (updatingAdminRole !== 'superadmin') throw new Error("Only superadmins can promote users to School Admin.");
          dataToUpdate.role = updates.role;
          needsUpdate = true;
          console.log(`Superadmin promoting user ${userId} to School Admin.`);
     } else {
          dataToUpdate.role = updates.role;
          needsUpdate = true;
          console.log(`Updating role for user ${userId} to ${updates.role}`);
     }
  }

  // Handle schoolId and schoolName update
  let schoolChanged = false;
  if (updates.hasOwnProperty('schoolId') && updates.schoolId !== existingUserData.schoolId) {
    if (updatingAdminRole !== 'superadmin' && existingUserData.role !== 'superadmin') {
         throw new Error("Only superadmins can change a user's school assignment.");
    }
    schoolChanged = true;
    needsUpdate = true; // Mark that an update is needed
    dataToUpdate.schoolId = updates.schoolId ?? null;
  }

  if (schoolChanged) {
    const targetRole = dataToUpdate.role ?? existingUserData.role;
     if (dataToUpdate.schoolId) {
       try {
         const schoolDoc = await getDoc(doc(db, 'schools', dataToUpdate.schoolId));
         if (schoolDoc.exists()) {
           dataToUpdate.schoolName = (schoolDoc.data() as School).name;
           console.log(`Updating school for user ${userId} to ${dataToUpdate.schoolName} (${dataToUpdate.schoolId})`);
         } else {
             if(targetRole !== 'superadmin') {
                 throw new Error(`Cannot assign user to non-existent school ID: ${dataToUpdate.schoolId}`);
             }
             console.warn(`Assigning superadmin ${userId} to non-existent school ID ${dataToUpdate.schoolId}. Clearing school name.`);
             dataToUpdate.schoolName = null;
             dataToUpdate.schoolId = null; // Correct the schoolId to null
         }
       } catch (e: any) {
          if (e instanceof FirestoreError && (e.code === 'unavailable' || e.message.includes("offline"))) {
              throw new Error("Cannot validate new school ID: Client is offline.");
          }
          throw new Error(`Failed to validate school for update: ${e.message}`);
       }
     } else { // Clearing school assignment
        if (targetRole !== 'superadmin' && updatingAdminRole !== 'superadmin') {
            throw new Error("Only superadmins can unassign users from a school.");
        }
         dataToUpdate.schoolId = null;
         dataToUpdate.schoolName = null;
         console.log(`Clearing school assignment for user ${userId}`);
     }
      // Ensure schoolName update doesn't revert if only schoolId changed to null/valid
      if (dataToUpdate.schoolName === undefined) {
           // If we changed schoolId but didn't explicitly set schoolName (e.g., to null),
           // make sure it's explicitly nulled if schoolId is null.
           if(dataToUpdate.schoolId === null) dataToUpdate.schoolName = null;
      }

  } // End if (schoolChanged)


  // --- Perform Update ---
  if (needsUpdate) {
    try {
        // Clean the data just before updating
         const cleanDataToUpdate = Object.entries(dataToUpdate).reduce((acc, [key, value]) => {
           if (value !== undefined) {
             acc[key as keyof typeof dataToUpdate] = value;
           } else if (key === 'schoolId' || key === 'schoolName') {
               // Ensure explicit nulls are kept if they were set
                acc[key as keyof typeof dataToUpdate] = null;
           }
           return acc;
         }, {} as { [key: string]: any });


        await updateDoc(userDocRef, cleanDataToUpdate);
        console.log(`User profile updated for ID: ${userId}`, cleanDataToUpdate);
    } catch (error: any) {
        if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
            throw new Error("Cannot update user profile: Client is offline.");
        }
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
           throw new Error("Permission denied updating Firestore profile. Check rules.");
        }
        console.error(`Error updating user profile for ID ${userId}:`, error);
        throw new Error(`Failed to update profile: ${error.message}`);
    }
  } else {
      console.log(`No actual changes to update for user ID: ${userId}. Skipping Firestore update.`);
  }

  // Fetch and return the latest profile data
  try {
      const updatedUserSnap = await getDoc(userDocRef);
       if (!updatedUserSnap.exists()) {
           throw new Error("Failed to retrieve user profile after update attempt.");
       }
       const finalData = updatedUserSnap.data();
       return {
        id: updatedUserSnap.id,
        name: finalData.name,
        email: finalData.email,
        role: finalData.role,
        schoolId: finalData.schoolId ?? null,
        schoolName: finalData.schoolName ?? null,
        createdAt: finalData.createdAt instanceof Timestamp ? finalData.createdAt.toDate().toISOString() : undefined,
        updatedAt: finalData.updatedAt instanceof Timestamp ? finalData.updatedAt.toDate().toISOString() : undefined,
      };
   } catch (error: any) {
        if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
            console.error("Failed to retrieve updated profile: Client is offline.");
            // Return the data we *intended* to write as a fallback, though timestamps might be wrong
             return { ...existingUserData, ...dataToUpdate, updatedAt: new Date().toISOString() };
        }
      console.error("Error retrieving updated profile:", error);
      throw new Error("Failed to retrieve updated profile after saving.");
   }
}


// Removed the old createUserProfile - it's replaced by adminCreateUserProfile
// and the syncUserProfileOnLogin logic.

// Placeholder for initialization reminder - actual creation happens via login flow.
export async function initializeSuperAdmin() {
    console.log(`Super Admin Auth user MUST be created manually in Firebase Console with UID: 'superadmin'. Use any email and a strong password.`);
    console.log(`On first login with these credentials, their Firestore profile will be created/synced with 'superadmin' role by syncUserProfileOnLogin.`);
}
