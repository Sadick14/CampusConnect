
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
    * The URL of the associated school's logo (optional, denormalized).
    */
  schoolLogoUrl?: string | null; // Added school logo URL
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
 * Fetches a user's profile from Firestore, including associated school details.
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
      let schoolLogoUrl = data.schoolLogoUrl; // Get logo URL from user doc first

      // If schoolId exists, try fetching school details to potentially update denormalized fields
      if (data.schoolId) {
        try {
            const schoolDocRef = doc(db, 'schools', data.schoolId);
            const schoolSnap = await getDoc(schoolDocRef);
            if (schoolSnap.exists()) {
              const schoolData = schoolSnap.data() as School; // Use updated School interface
              schoolName = schoolData.name;
              schoolLogoUrl = schoolData.logoUrl; // Get latest logo URL from school doc
              
              // Check if denormalized fields need updating on the user doc
              const updates: { schoolName?: string | null, schoolLogoUrl?: string | null } = {};
              if (schoolName !== data.schoolName) updates.schoolName = schoolName ?? null;
              if (schoolLogoUrl !== data.schoolLogoUrl) updates.schoolLogoUrl = schoolLogoUrl ?? null;

              if (Object.keys(updates).length > 0) {
                   console.log(`Updating denormalized school info for user ${uid}`);
                   // Perform the update asynchronously, don't block returning the profile
                   updateDoc(userDocRef, updates).catch(updateError => {
                        console.warn(`Failed to update denormalized school info for user ${uid}:`, updateError);
                   });
              }
            } else {
                console.warn(`School document ${data.schoolId} not found for user ${uid}. Clearing denormalized info.`);
                schoolName = null;
                schoolLogoUrl = null;
                 // If school doc is missing, clear the fields on the user doc too
                 if (data.schoolName || data.schoolLogoUrl) {
                     updateDoc(userDocRef, { schoolName: null, schoolLogoUrl: null }).catch(updateError => {
                          console.warn(`Failed to clear denormalized school info for user ${uid}:`, updateError);
                     });
                 }
            }
        } catch (schoolError) {
            console.warn(`Could not fetch school details for schoolId ${data.schoolId} (user ${uid}):`, schoolError);
            // Keep potentially stale data from user doc if fetch fails, or clear? Clear is safer for consistency.
            schoolName = null;
            schoolLogoUrl = null;
        }
      } else {
        // No schoolId, ensure schoolName and logo are null
        schoolName = null;
        schoolLogoUrl = null;
      }

      return {
        id: userSnap.id,
        name: data.name || data.displayName || 'Unnamed User',
        email: data.email,
        role: data.role || 'guest',
        schoolId: data.schoolId ?? null,
        schoolName: schoolName, // Use fetched/updated value
        schoolLogoUrl: schoolLogoUrl, // Use fetched/updated value
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    } else {
      console.warn(`No profile found for user UID: ${uid} in 'users' collection.`);
      return null;
    }
  } catch (error: any) {
    console.error(`Error fetching user profile for UID ${uid}:`, error);
    if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
        console.warn("getUserProfile: Failed to get user profile because the client is offline.");
        return null;
    }
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
        console.error(`Permission denied fetching user profile for UID ${uid}. Check Firestore rules.`);
        return null;
     }
    return null;
  }
}

/**
 * Creates or updates the user's profile in Firestore *during the login process*.
 * This ensures the profile exists, syncs basic info, sets roles, and denormalizes school info.
 * @param firebaseUser The Firebase Auth user object.
 * @param existingProfileData Optional: If profile was fetched *before* calling this.
 * @returns Promise resolving to the User profile from Firestore.
 */
export async function syncUserProfileOnLogin(
  firebaseUser: FirebaseUser,
  existingProfileData?: User | null
): Promise<User> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let needsWrite = false;
    let schoolDataFetched: School | null = null;

    let profileDataToSave: Partial<User> & { updatedAt: any, createdAt?: any } = {
        updatedAt: serverTimestamp(),
    };

    let currentRole = existingProfileData?.role;
    let currentSchoolId = existingProfileData?.schoolId;
    // School name and logo will be fetched if schoolId exists

    // --- 1. Fetch School Info if user has schoolId (and not superadmin) ---
    if (currentSchoolId && firebaseUser.uid !== 'superadmin') {
      try {
        schoolDataFetched = await getSchoolById(currentSchoolId);
        if (!schoolDataFetched) {
          console.warn(`User ${firebaseUser.uid} has schoolId ${currentSchoolId}, but school not found. Clearing school association.`);
          currentSchoolId = null; // Clear invalid ID
        }
      } catch (e) {
        console.error(`Error fetching school ${currentSchoolId} during user sync:`, e);
        // Decide: proceed without school info or throw? Proceeding might be okay for login.
      }
    }

    // --- 2. Determine Role (Superadmin override) ---
    if (firebaseUser.uid === 'superadmin') {
        if (currentRole !== 'superadmin' || currentSchoolId !== null) {
            profileDataToSave.role = 'superadmin';
            profileDataToSave.schoolId = null;
            profileDataToSave.schoolName = null;
            profileDataToSave.schoolLogoUrl = null;
            needsWrite = true;
        }
        currentRole = 'superadmin';
        currentSchoolId = null;
        schoolDataFetched = null; // Superadmin has no school data
    } else if (!currentRole) {
        profileDataToSave.role = 'student'; // Default role if missing
        currentRole = 'student';
        needsWrite = true;
    } else {
        profileDataToSave.role = currentRole; // Keep existing role
    }

    // --- 3. Sync Basic Info (Name, Email) ---
    const authName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous';
    const existingName = existingProfileData?.name;
    if (!existingProfileData || authName !== existingName) {
       if (!existingName || existingName === 'Anonymous User' || existingName === 'Unnamed User') {
           profileDataToSave.name = authName;
           needsWrite = true;
       } else if (!profileDataToSave.name) {
           profileDataToSave.name = existingName;
       }
    } else if (!profileDataToSave.name) {
         profileDataToSave.name = existingName;
    }

    if (!existingProfileData || firebaseUser.email !== existingProfileData?.email) {
        profileDataToSave.email = firebaseUser.email;
        needsWrite = true;
    } else if (!profileDataToSave.email) {
        profileDataToSave.email = existingProfileData?.email;
    }

     // --- 4. Set/Sync School Details ---
     profileDataToSave.schoolId = currentSchoolId ?? null; // Use the possibly corrected ID

     const currentSchoolName = schoolDataFetched?.name ?? null;
     const currentLogoUrl = schoolDataFetched?.logoUrl ?? null;

     if (currentSchoolName !== existingProfileData?.schoolName) {
         profileDataToSave.schoolName = currentSchoolName;
         needsWrite = true;
     } else if (!profileDataToSave.hasOwnProperty('schoolName')) { // Ensure field is set
          profileDataToSave.schoolName = existingProfileData?.schoolName ?? null;
     }

     if (currentLogoUrl !== existingProfileData?.schoolLogoUrl) {
         profileDataToSave.schoolLogoUrl = currentLogoUrl;
         needsWrite = true;
     } else if (!profileDataToSave.hasOwnProperty('schoolLogoUrl')) { // Ensure field is set
          profileDataToSave.schoolLogoUrl = existingProfileData?.schoolLogoUrl ?? null;
     }

    // --- 5. Add createdAt timestamp if creating new profile ---
    if (!existingProfileData) {
        profileDataToSave.createdAt = serverTimestamp();
        needsWrite = true;
        console.log(`Creating new Firestore profile for user ${firebaseUser.uid}`);
    }

    // --- 6. Perform Write only if necessary ---
    if (needsWrite) {
        try {
             const cleanData = Object.entries(profileDataToSave).reduce((acc, [key, value]) => {
                 acc[key as keyof typeof profileDataToSave] = value === undefined ? null : value; // Convert undefined to null
                 return acc;
             }, {} as { [key: string]: any });

            await setDoc(userDocRef, cleanData, { merge: true });
            console.log(`User profile synced/created for UID: ${firebaseUser.uid}`);
        } catch (error: any) {
            console.error(`Error syncing user profile for UID ${firebaseUser.uid}:`, error);
             if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
                 console.error("syncUserProfileOnLogin failed: Client is offline.");
                 if (existingProfileData) return existingProfileData; // Return stale data if possible
                 throw new Error(`Failed to sync user profile (offline): ${error.message}`);
             }
            throw new Error(`Failed to sync user profile: ${error.message}`);
        }
    } else {
         console.log(`User profile for ${firebaseUser.uid} is up-to-date. No sync needed.`);
    }

    // --- 7. Return the definitive profile state ---
    // Fetch again to ensure we have server-resolved timestamps and latest data
    try {
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
            schoolLogoUrl: finalData.schoolLogoUrl ?? null,
            createdAt: finalData.createdAt instanceof Timestamp ? finalData.createdAt.toDate().toISOString() : undefined,
            updatedAt: finalData.updatedAt instanceof Timestamp ? finalData.updatedAt.toDate().toISOString() : undefined,
         };
    } catch (fetchError: any) {
         console.error("Error fetching final profile state after sync:", fetchError);
          // Fallback: return the data we intended to write/had before, timestamps might be client-side estimates
          const fallbackData = { ...existingProfileData, ...profileDataToSave };
          return {
              id: firebaseUser.uid,
              name: fallbackData.name!,
              email: fallbackData.email!,
              role: fallbackData.role!,
              schoolId: fallbackData.schoolId ?? null,
              schoolName: fallbackData.schoolName ?? null,
              schoolLogoUrl: fallbackData.schoolLogoUrl ?? null,
              createdAt: fallbackData.createdAt instanceof Timestamp ? fallbackData.createdAt.toDate().toISOString() : fallbackData.createdAt ?? undefined,
              updatedAt: new Date().toISOString(), // Use current time as best guess
          };
    }
}



/**
 * Retrieves all users (for superadmin) or users for a specific school (for school_admin).
 * Includes denormalized school information.
 * @param forSchoolId Optional school ID to filter users by.
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
      console.log("Fetching all users (Superadmin view or unfiltered request).");
      q = query(usersCol);
    }
    const userSnapshot = await getDocs(q);
    const userListPromises = userSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let schoolName = data.schoolName;
      let schoolLogoUrl = data.schoolLogoUrl;

      // Fetch school name/logo if missing and schoolId exists (optional consistency check)
      if (data.schoolId && (!schoolName || !schoolLogoUrl)) {
          try {
              const schoolDoc = await getDoc(doc(db, 'schools', data.schoolId));
              if (schoolDoc.exists()) {
                 const schoolDetails = schoolDoc.data() as School;
                 schoolName = schoolDetails.name ?? schoolName; // Use fetched if available
                 schoolLogoUrl = schoolDetails.logoUrl ?? schoolLogoUrl;
                 // Optionally trigger an update to the user doc if data was missing/stale
              } else {
                   schoolName = null; // Indicate school not found
                   schoolLogoUrl = null;
              }
          } catch (e) {
              console.warn(`Could not fetch school details for user ${docSnap.id} school ${data.schoolId}`, e);
              // Keep existing potentially stale data or nullify? Nullify for consistency.
               schoolName = null;
               schoolLogoUrl = null;
          }
      }

      return {
        id: docSnap.id,
        name: data.name || data.displayName || 'N/A',
        email: data.email || 'N/A',
        role: data.role || 'N/A',
        schoolId: data.schoolId ?? null,
        schoolName: schoolName ?? null,
        schoolLogoUrl: schoolLogoUrl ?? null,
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
         throw new Error("Permission denied fetching users list.");
     }
    return [];
  }
}

/**
 * Admin action to create a new user profile (Auth and Firestore).
 * @param userData Data for the new user profile.
 * @param creatingAdminRole The role of the admin performing the action.
 * @param creatingAdminSchoolId The school ID of the school admin (if applicable).
 * @returns A promise that resolves to the created User object (Firestore profile).
 */
export async function adminCreateUserProfile(
    userData: Omit<AdminUserFormData, 'id'>,
    creatingAdminRole: string,
    creatingAdminSchoolId?: string
): Promise<User> {
    // --- Permission Checks --- (Same as previous version)
    if (creatingAdminRole !== 'superadmin' && creatingAdminRole !== 'school_admin') {
        throw new Error("Permission denied: Only admins can create users.");
    }
    if (!userData.password) {
        throw new Error("Password is required to create a new user.");
    }
     // Add stricter check: Ensure schoolId exists if the role requires it
     if ((userData.role === 'teacher' || userData.role === 'student') && !userData.schoolId) {
          if(creatingAdminRole === 'school_admin' && creatingAdminSchoolId) {
               userData.schoolId = creatingAdminSchoolId; // Auto-assign if school admin is creating
          } else {
               throw new Error(`School ID is required for role '${userData.role}'.`);
          }
     } else if (userData.role === 'school_admin' && creatingAdminRole !== 'superadmin') {
         throw new Error("School admins cannot create other school admins.");
     } else if (creatingAdminRole === 'school_admin') {
          if (!creatingAdminSchoolId) throw new Error("School admin must have a school ID.");
          if (userData.schoolId && userData.schoolId !== creatingAdminSchoolId) {
             console.warn(`School admin assigning user to different school (${userData.schoolId}). Overriding with admin's school (${creatingAdminSchoolId}).`);
             userData.schoolId = creatingAdminSchoolId;
          } else if (!userData.schoolId) {
             userData.schoolId = creatingAdminSchoolId;
          }
     }
      if (userData.email === 'superadmin@example.com') { // Prevent creating reserved email
        throw new Error("Cannot create user with the reserved superadmin email via this function.");
      }


    // --- 1. Create Firebase Auth User --- (Same as previous version)
    let authUser: FirebaseUser;
    try {
        console.log(`Attempting to create Auth user for ${userData.email} via admin action...`);
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        authUser = userCredential.user;
        console.log(`Admin action: Auth user created successfully with UID: ${authUser.uid}`);
        if (authUser.uid === 'superadmin') { // Safeguard
             console.error("CRITICAL: Accidentally created Auth user with reserved 'superadmin' UID. Manual cleanup needed.");
             throw new Error("Critical error: Attempted to create profile with reserved 'superadmin' UID.");
        }
        await updateProfile(authUser, { displayName: userData.name });
    } catch (error: any) {
        console.error('Error creating Firebase Auth user via admin action:', error);
         if (error.code === 'auth/email-already-in-use') {
            throw new Error(`Authentication failed: The email address ${userData.email} is already in use.`);
         } // ... other auth error handling
        throw new Error(`Failed to create user authentication account: ${error.message}`);
    }

    // --- 2. Prepare and Create Firestore User Profile ---
    const userDocRef = doc(db, 'users', authUser.uid);
    const profileToCreate: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        schoolId: userData.schoolId ?? null,
        schoolName: null, // Initialize as null
        schoolLogoUrl: null, // Initialize as null
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // Fetch school details if schoolId is provided
    if (profileToCreate.schoolId) {
        try {
            const schoolDoc = await getDoc(doc(db, 'schools', profileToCreate.schoolId));
            if (schoolDoc.exists()) {
                 const schoolDetails = schoolDoc.data() as School;
                 profileToCreate.schoolName = schoolDetails.name ?? null;
                 profileToCreate.schoolLogoUrl = schoolDetails.logoUrl ?? null;
                 console.log(`Assigning user ${userData.email} to school: ${profileToCreate.schoolName} (${profileToCreate.schoolId})`);
            } else {
                console.warn(`Admin provided non-existent school ID ${profileToCreate.schoolId} for user ${userData.email}. Setting school assignment to null.`);
                profileToCreate.schoolId = null;
            }
        } catch (e: any) {
             if (e instanceof FirestoreError && (e.code === 'unavailable' || e.message.includes("offline"))) {
                 throw new Error("Cannot validate school ID: Client is offline.");
             }
            console.error(`Failed to validate school ${profileToCreate.schoolId}:`, e);
            throw new Error(`Failed to validate school information: ${e.message}`);
        }
    }

    // Create the Firestore document
    try {
        const cleanData = Object.entries(profileToCreate).reduce((acc, [key, value]) => {
             acc[key as keyof typeof profileToCreate] = value === undefined ? null : value; // Ensure nulls
            return acc;
        }, {} as { [key: string]: any });

        await setDoc(userDocRef, cleanData);
        console.log(`Successfully created Firestore profile for ${userData.email} with ID ${authUser.uid}`);

    } catch (error: any) {
        console.error(`Error setting Firestore user profile document for ${userData.email} (UID: ${authUser.uid}):`, error);
        console.error(`CRITICAL: Failed to create Firestore profile for Auth user ${authUser.uid}. Manual cleanup likely needed.`);
        // ... Firestore error handling ...
        throw new Error(`Failed to create Firestore profile: ${error.message}`);
    }

    // --- 3. Fetch and Return Created Profile --- (Same as previous version)
    try {
      const createdDocSnap = await getDoc(userDocRef);
      if (!createdDocSnap.exists()) {
        throw new Error("Failed to retrieve created user profile immediately after creation.");
      }
      const finalData = createdDocSnap.data();
      return {
        id: authUser.uid,
        name: finalData.name,
        email: finalData.email,
        role: finalData.role,
        schoolId: finalData.schoolId ?? null,
        schoolName: finalData.schoolName ?? null,
        schoolLogoUrl: finalData.schoolLogoUrl ?? null,
        createdAt: finalData.createdAt instanceof Timestamp ? finalData.createdAt.toDate().toISOString() : undefined,
        updatedAt: finalData.updatedAt instanceof Timestamp ? finalData.updatedAt.toDate().toISOString() : undefined,
      };
   } catch (error: any) {
      console.error("Error retrieving created profile after saving:", error);
      throw new Error("Failed to retrieve complete profile data after creation.");
   }
}


/**
 * Admin action to update an existing user's profile in Firestore.
 * Updates denormalized school info if schoolId changes.
 * @param userId The ID of the user profile to update.
 * @param updates Partial data for the user profile.
 * @param updatingAdminRole Role of the admin performing the action.
 * @param updatingAdminSchoolId School ID of the admin (if school_admin).
 * @returns A promise that resolves to the updated User object.
 */
export async function adminUpdateUserProfile(
    userId: string,
    updates: Partial<AdminUserFormData>,
    updatingAdminRole: string,
    updatingAdminSchoolId?: string
): Promise<User> {
  // --- Permission Checks & Initial Fetch --- (Same as previous version)
   if (updatingAdminRole !== 'superadmin' && updatingAdminRole !== 'school_admin') {
    throw new Error("Permission denied: Only admins can update users.");
  }
  const userDocRef = doc(db, 'users', userId);
  let existingUserData: User;
  try {
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) throw new Error("User profile not found.");
      // Fetch current data to compare against
      existingUserData = await getUserProfile(userId) as User; // Reuse getUserProfile to get full current state
       if (!existingUserData) throw new Error("User profile not found during fetch for update.");
  } catch (error: any) {
        // ... error handling ...
       throw new Error(`Failed to fetch user profile for update: ${error.message}`);
  }

  // --- Apply Authorization Rules --- (Same as previous version)
   if (existingUserData.role === 'superadmin' && updatingAdminRole !== 'superadmin') {
        throw new Error("Only a superadmin can modify another superadmin's profile.");
   }
   if (userId === 'superadmin' && updates.role && updates.role !== 'superadmin') {
        throw new Error("The role of the primary superadmin (UID 'superadmin') cannot be changed.");
   }
   // ... other role/school admin checks ...


   // --- Prepare Data for Update ---
   const dataToUpdate: { [key: string]: any } = { updatedAt: serverTimestamp() };
   let needsUpdate = false;
   let schoolChanged = false;
   let newSchoolData: School | null = null;

   if (updates.name !== undefined && updates.name !== existingUserData.name) {
     dataToUpdate.name = updates.name;
     needsUpdate = true;
   }

   // Update role if allowed and changed
   if (updates.role && updates.role !== existingUserData.role) {
     // ... role change permission logic ...
     if (/* role change is allowed */ true) { // Replace true with actual permission check logic
         dataToUpdate.role = updates.role;
         needsUpdate = true;
         console.log(`Updating role for user ${userId} to ${updates.role}`);
          // If changing role TO superadmin, clear school info
          if (updates.role === 'superadmin') {
               if (existingUserData.schoolId) { // Check if they had a school before
                    dataToUpdate.schoolId = null;
                    dataToUpdate.schoolName = null;
                    dataToUpdate.schoolLogoUrl = null;
                    schoolChanged = true; // Indicate change for logging/downstream effects
               }
          }
     } else {
          throw new Error("Permission denied to change user role.");
     }
   }

   // Handle schoolId change - Fetch new school data if ID changes
   if (updates.hasOwnProperty('schoolId') && updates.schoolId !== existingUserData.schoolId) {
     if (updatingAdminRole !== 'superadmin' && existingUserData.role !== 'superadmin') {
          throw new Error("Only superadmins can change a user's school assignment.");
     }
     const newSchoolId = updates.schoolId ?? null;
     dataToUpdate.schoolId = newSchoolId;
     schoolChanged = true;
     needsUpdate = true;

     if (newSchoolId) {
       try {
         newSchoolData = await getSchoolById(newSchoolId);
         if (!newSchoolData) {
           throw new Error(`Cannot assign user to non-existent school ID: ${newSchoolId}`);
         }
         dataToUpdate.schoolName = newSchoolData.name ?? null;
         dataToUpdate.schoolLogoUrl = newSchoolData.logoUrl ?? null;
         console.log(`Updating school for user ${userId} to ${dataToUpdate.schoolName} (${newSchoolId})`);
       } catch (e: any) {
         if (e instanceof FirestoreError && (e.code === 'unavailable' || e.message.includes("offline"))) {
           throw new Error("Cannot validate new school ID: Client is offline.");
         }
         throw new Error(`Failed to validate school for update: ${e.message}`);
       }
     } else { // Clearing school assignment
       newSchoolData = null; // Ensure newSchoolData is null if ID is cleared
       dataToUpdate.schoolName = null;
       dataToUpdate.schoolLogoUrl = null;
       console.log(`Clearing school assignment for user ${userId}`);
     }
   }


  // --- Perform Update ---
  if (needsUpdate) {
    try {
         const cleanDataToUpdate = Object.entries(dataToUpdate).reduce((acc, [key, value]) => {
           acc[key as keyof typeof dataToUpdate] = value === undefined ? null : value; // Ensure nulls
           return acc;
         }, {} as { [key: string]: any });

        await updateDoc(userDocRef, cleanDataToUpdate);
        console.log(`User profile updated for ID: ${userId}`, cleanDataToUpdate);
    } catch (error: any) {
        // ... Firestore error handling ...
        throw new Error(`Failed to update profile: ${error.message}`);
    }
  } else {
      console.log(`No actual changes to update for user ID: ${userId}. Skipping Firestore update.`);
  }

  // --- Fetch and Return the latest profile data ---
  // Use getUserProfile again to ensure consistency, including potentially updated school details
  try {
       const finalProfile = await getUserProfile(userId);
       if (!finalProfile) throw new Error("Failed to retrieve user profile after update.");
       return finalProfile;
   } catch (error: any) {
      console.error("Error retrieving updated profile:", error);
      throw new Error("Failed to retrieve updated profile after saving.");
   }
}



// Placeholder for initialization reminder - actual creation happens via login flow.
export async function initializeSuperAdmin() {
    console.log(`Super Admin Auth user MUST be created manually in Firebase Console with UID: 'superadmin'. Use any email and a strong password.`);
    console.log(`On first login with these credentials, their Firestore profile will be created/synced with 'superadmin' role by syncUserProfileOnLogin.`);
}

// Function to get students with parent/guardian contact for a specific school
// This assumes student documents have a 'parentContact' field (e.g., { email: '...', phone: '...' })
export interface StudentWithContact extends User {
  parentContact?: {
    email?: string | null;
    phone?: string | null;
  } | null;
}

export async function getStudentsWithContacts(schoolId: string): Promise<StudentWithContact[]> {
    if (!schoolId) {
        throw new Error("School ID is required to fetch students.");
    }
    try {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('schoolId', '==', schoolId), where('role', '==', 'student'));
        const snapshot = await getDocs(q);

        const students: StudentWithContact[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                 id: docSnap.id,
                 name: data.name || 'N/A',
                 email: data.email || null,
                 role: 'student',
                 schoolId: data.schoolId,
                 schoolName: data.schoolName ?? null, // Include if needed
                 schoolLogoUrl: data.schoolLogoUrl ?? null, // Include if needed
                 parentContact: data.parentContact ?? null, // Extract parent contact
                 createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                 updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            };
        });
        return students;
    } catch (error: any) {
         console.error(`Error fetching students for school ${schoolId}:`, error);
          if (error instanceof FirestoreError && error.code === 'permission-denied') {
            throw new Error("Permission denied fetching students.");
          }
          if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
              throw new Error("Cannot fetch students: Client is offline.");
          }
         throw new Error("An unexpected error occurred while fetching students.");
    }
}
