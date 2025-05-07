
'use server';
/**
 * @fileOverview Service functions for managing user data.
 */
import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc, serverTimestamp, Timestamp, FirestoreError } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth'; // Keep FirebaseUser type
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; // Import auth functions
import { getDb, auth } from '@/lib/firebase'; // Import getDb instead of db
import { getSchoolById, type School } from './school'; // Assuming School type is available (import from service for now, could move School type later)
// Import schemas and types from the dedicated file
import { 
    type User, 
    type AdminUserFormData, 
    type StudentWithContact 
} from '@/schemas/user';


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
    const db = await getDb(); // Get DB instance
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      let schoolName = data.schoolName;
      let schoolLogoUrl = data.schoolLogoUrl; // Get logo URL from user doc first

      // If schoolId exists, try fetching school details to potentially update denormalized fields
      if (data.schoolId) {
        try {
            // Fetch school data (assuming getSchoolById is async and handles its own db connection)
            const schoolData = await getSchoolById(data.schoolId);
            if (schoolData) {
              schoolName = schoolData.name;
              schoolLogoUrl = schoolData.logoUrl;

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
        // Include student-specific fields if they exist
        class: data.class ?? null,
        parentContact: data.parentContact ?? null,
      };
    } else {
      console.warn(`No profile found for user UID: ${uid} in 'users' collection.`);
      return null;
    }
  } catch (error: any) {
    console.error(`Error fetching user profile for UID ${uid}:`, error);
    if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
        console.warn("getUserProfile: Failed to get user profile because the client is offline.");
        // Attempt to return potentially stale data if offline? Risky.
        // For now, return null when offline fetch fails.
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
 * @throws Error if profile creation/update fails critically.
 */
export async function syncUserProfileOnLogin(
  firebaseUser: FirebaseUser,
  existingProfileData?: User | null
): Promise<User> {
    const db = await getDb(); // Get DB instance
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let needsWrite = false;
    let schoolDataFetched: School | null = null;

    // Initialize with values from existing profile or defaults
    let profileDataToSave: Partial<User> & { updatedAt?: any, createdAt?: any } = {
        ...(existingProfileData || {}), // Start with existing data or empty object
        id: firebaseUser.uid, // Ensure ID is always the auth UID
        updatedAt: serverTimestamp(), // Always update timestamp
    };


    // --- 1. Fetch School Info if user has schoolId (and not superadmin) ---
    const currentSchoolId = profileDataToSave.schoolId; // Use ID from initial object
    if (currentSchoolId && firebaseUser.uid !== 'superadmin') {
      try {
        schoolDataFetched = await getSchoolById(currentSchoolId); // This now uses getDb internally
        if (!schoolDataFetched) {
          console.warn(`User ${firebaseUser.uid} has schoolId ${currentSchoolId}, but school not found. Clearing school association.`);
          profileDataToSave.schoolId = null;
          profileDataToSave.schoolName = null;
          profileDataToSave.schoolLogoUrl = null;
          needsWrite = true;
        }
      } catch (e) {
        console.error(`Error fetching school ${currentSchoolId} during user sync:`, e);
        // Keep existing school info but log error, or clear? Clearing is safer.
        profileDataToSave.schoolId = null;
        profileDataToSave.schoolName = null;
        profileDataToSave.schoolLogoUrl = null;
        needsWrite = true;
      }
    }

    // --- 2. Determine/Verify Role (Superadmin override) ---
    if (firebaseUser.uid === 'superadmin') {
        if (profileDataToSave.role !== 'superadmin' || profileDataToSave.schoolId !== null) {
            profileDataToSave.role = 'superadmin';
            profileDataToSave.schoolId = null;
            profileDataToSave.schoolName = null;
            profileDataToSave.schoolLogoUrl = null;
            needsWrite = true;
        }
    } else if (!profileDataToSave.role) {
        profileDataToSave.role = 'student'; // Default role if missing
        needsWrite = true;
    }
    // If role exists, keep it unless overridden above

    // --- 3. Sync Basic Info (Name, Email) ---
    const authName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User';
    if (profileDataToSave.name !== authName) {
        // Only overwrite if profile name is default/empty or auth name is explicitly set
        if (!profileDataToSave.name || profileDataToSave.name === 'Anonymous User' || profileDataToSave.name === 'Unnamed User' || firebaseUser.displayName) {
            profileDataToSave.name = authName;
            needsWrite = true;
        }
    }

    if (profileDataToSave.email !== firebaseUser.email) {
        profileDataToSave.email = firebaseUser.email;
        needsWrite = true;
    }

     // --- 4. Set/Sync School Details based on fetched data (if applicable) ---
     if (firebaseUser.uid !== 'superadmin') {
         const currentSchoolName = schoolDataFetched?.name ?? null;
         const currentLogoUrl = schoolDataFetched?.logoUrl ?? null;

         if (profileDataToSave.schoolName !== currentSchoolName) {
             profileDataToSave.schoolName = currentSchoolName;
             needsWrite = true;
         }
         if (profileDataToSave.schoolLogoUrl !== currentLogoUrl) {
             profileDataToSave.schoolLogoUrl = currentLogoUrl;
             needsWrite = true;
         }
          // Ensure schoolId reflects fetched state (could have been cleared if school not found)
         if (profileDataToSave.schoolId !== (schoolDataFetched?.id ?? null)) {
              profileDataToSave.schoolId = schoolDataFetched?.id ?? null;
              needsWrite = true;
         }
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
             // Clean the data: Remove undefined keys, convert specific undefined values to null if needed
             const cleanDataToWrite = Object.entries(profileDataToSave).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    // Firestore handles serverTimestamp() correctly, others should be actual values or null
                     acc[key as keyof typeof profileDataToSave] = value;
                } else if (['schoolId', 'schoolName', 'schoolLogoUrl', 'class', 'parentContact', 'email', 'createdAt', 'updatedAt'].includes(key)) {
                    // Explicitly set potentially undefined optional fields to null if they ended up undefined
                    acc[key as keyof typeof profileDataToSave] = null;
                }
                 // Skip 'id' field for Firestore document data
                 if (key === 'id') return acc;

                return acc;
             }, {} as { [key: string]: any });


            await setDoc(userDocRef, cleanDataToWrite, { merge: true });
            console.log(`User profile synced/created for UID: ${firebaseUser.uid}`);
        } catch (error: any) {
            console.error(`Error syncing user profile for UID ${firebaseUser.uid}:`, error);
             if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
                 console.error("syncUserProfileOnLogin failed: Client is offline.");
                 // Cannot guarantee profile creation/update offline, throw specific error
                 throw new Error(`Failed to create/update user profile because the client is offline.`);
             }
            // Handle specific errors like invalid data
             if (error.message.includes("invalid data") || error.message.includes("Unsupported field value")) {
                console.error("Firestore write failed due to invalid data:", cleanDataToWrite);
                throw new Error(`Failed to save profile due to invalid data: ${error.message}`);
             }
            throw new Error(`Failed to create/update user profile: ${error.message}`);
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

         // Ensure all expected fields are present, defaulting to null if missing
         return {
            id: firebaseUser.uid,
            name: finalData.name || authName, // Fallback name
            email: finalData.email ?? firebaseUser.email ?? null,
            role: finalData.role ?? 'student', // Fallback role
            schoolId: finalData.schoolId ?? null,
            schoolName: finalData.schoolName ?? null,
            schoolLogoUrl: finalData.schoolLogoUrl ?? null,
            createdAt: finalData.createdAt instanceof Timestamp ? finalData.createdAt.toDate().toISOString() : undefined,
            updatedAt: finalData.updatedAt instanceof Timestamp ? finalData.updatedAt.toDate().toISOString() : undefined,
            class: finalData.class ?? null,
            parentContact: finalData.parentContact ?? null,
         };
    } catch (fetchError: any) {
         console.error("Error fetching final profile state after sync:", fetchError);
         // Fallback: return the data we *intended* to write or had before sync.
         // Timestamps might be client-side estimates or missing.
         const fallbackData = { ...existingProfileData, ...profileDataToSave };
         return {
             id: firebaseUser.uid,
             name: fallbackData.name!,
             email: fallbackData.email!,
             role: fallbackData.role!,
             schoolId: fallbackData.schoolId ?? null,
             schoolName: fallbackData.schoolName ?? null,
             schoolLogoUrl: fallbackData.schoolLogoUrl ?? null,
             createdAt: fallbackData.createdAt instanceof Timestamp ? fallbackData.createdAt.toDate().toISOString() : undefined,
             updatedAt: new Date().toISOString(), // Best guess
             class: fallbackData.class ?? null,
             parentContact: fallbackData.parentContact ?? null,
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
    const db = await getDb(); // Get DB instance
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
                 // Use getSchoolById to potentially trigger updates if needed elsewhere
                 const schoolDetails = await getSchoolById(data.schoolId);
                 if(schoolDetails) {
                      schoolName = schoolDetails.name ?? schoolName; // Use fetched if available
                      schoolLogoUrl = schoolDetails.logoUrl ?? schoolLogoUrl;
                 } else {
                      schoolName = null;
                      schoolLogoUrl = null;
                 }
                 // Optionally trigger an update to the user doc if data was missing/stale
                 if (schoolName !== data.schoolName || schoolLogoUrl !== data.schoolLogoUrl) {
                     updateDoc(docSnap.ref, { schoolName: schoolName ?? null, schoolLogoUrl: schoolLogoUrl ?? null }).catch(e => console.warn("Failed background update", e));
                 }
              } else {
                   schoolName = null; // Indicate school not found
                   schoolLogoUrl = null;
                   if (data.schoolName || data.schoolLogoUrl) {
                      updateDoc(docSnap.ref, { schoolName: null, schoolLogoUrl: null }).catch(e => console.warn("Failed background update", e));
                   }
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
        class: data.class ?? null,
        parentContact: data.parentContact ?? null,
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
    // --- Permission Checks ---
    if (creatingAdminRole !== 'superadmin' && creatingAdminRole !== 'school_admin') {
        throw new Error("Permission denied: Only admins can create users.");
    }
    if (!userData.password) {
        throw new Error("Password is required to create a new user.");
    }
     // Ensure schoolId exists if the role requires it and assigning correctly
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


    // --- 1. Create Firebase Auth User ---
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
    const db = await getDb(); // Get DB instance
    const userDocRef = doc(db, 'users', authUser.uid);
    // Use Partial<User> to handle potentially missing student fields based on role
    const profileToCreate: Partial<User> & { createdAt: any, updatedAt: any } = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        schoolId: userData.schoolId ?? null,
        schoolName: null, // Initialize as null
        schoolLogoUrl: null, // Initialize as null
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // Add student-specific fields only if the role is student
     if (userData.role === 'student') {
       profileToCreate.class = userData.class ?? null;
       profileToCreate.parentContact = userData.parentContact ?? null;
     }

    // Fetch school details if schoolId is provided
    if (profileToCreate.schoolId) {
        try {
            const schoolDetails = await getSchoolById(profileToCreate.schoolId); // Use existing function
            if (schoolDetails) {
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
        // Convert undefined values to null before writing
        const cleanDataToWrite = Object.entries(profileToCreate).reduce((acc, [key, value]) => {
            // Skip 'id' as it's the document ref ID
             if (key === 'id') return acc;
             acc[key as keyof typeof profileToCreate] = value === undefined ? null : value;
            return acc;
        }, {} as { [key: string]: any });

        await setDoc(userDocRef, cleanDataToWrite);
        console.log(`Successfully created Firestore profile for ${userData.email} with ID ${authUser.uid}`);

    } catch (error: any) {
        console.error(`Error setting Firestore user profile document for ${userData.email} (UID: ${authUser.uid}):`, error);
        console.error(`CRITICAL: Failed to create Firestore profile for Auth user ${authUser.uid}. Manual cleanup likely needed.`);
        // ... Firestore error handling ...
        throw new Error(`Failed to create Firestore profile: ${error.message}`);
    }

    // --- 3. Fetch and Return Created Profile ---
    try {
      const createdProfile = await getUserProfile(authUser.uid); // Use reliable fetch function
      if (!createdProfile) {
        throw new Error("Failed to retrieve created user profile immediately after creation.");
      }
      return createdProfile;
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
   if (updatingAdminRole !== 'superadmin' && updatingAdminRole !== 'school_admin') {
    throw new Error("Permission denied: Only admins can update users.");
  }
  const db = await getDb(); // Get DB instance
  const userDocRef = doc(db, 'users', userId);
  let existingUserData: User;
  try {
      // Fetch full current profile using the reliable function
      const profile = await getUserProfile(userId);
       if (!profile) throw new Error("User profile not found.");
       existingUserData = profile;
  } catch (error: any) {
       // ... error handling ...
       throw new Error(`Failed to fetch user profile for update: ${error.message}`);
  }

  // --- Apply Authorization Rules ---
   if (existingUserData.role === 'superadmin' && updatingAdminRole !== 'superadmin') {
        throw new Error("Only a superadmin can modify another superadmin's profile.");
   }
   if (userId === 'superadmin' && updates.role && updates.role !== 'superadmin') {
        throw new Error("The role of the primary superadmin (UID 'superadmin') cannot be changed.");
   }
    // Prevent school admin from editing users outside their school or editing roles to school_admin
    if (updatingAdminRole === 'school_admin') {
        if (!updatingAdminSchoolId) throw new Error("School admin must have a school ID.");
        if (existingUserData.schoolId !== updatingAdminSchoolId) {
            throw new Error("School admins can only edit users within their own school.");
        }
        if (updates.role && updates.role === 'school_admin') {
             throw new Error("School admins cannot promote others to school admin.");
        }
         if (updates.schoolId && updates.schoolId !== updatingAdminSchoolId) {
             throw new Error("School admins cannot change a user's school assignment.");
         }
    }


   // --- Prepare Data for Update ---
   const dataToUpdate: { [key: string]: any } = { updatedAt: serverTimestamp() };
   let needsUpdate = false;
   let schoolChanged = false;
   let newSchoolData: School | null = null;

   if (updates.name !== undefined && updates.name !== existingUserData.name) {
     dataToUpdate.name = updates.name;
     needsUpdate = true;
   }
   // Email cannot be changed here (managed by Firebase Auth)

   // Update role if allowed and changed
   if (updates.role && updates.role !== existingUserData.role) {
       dataToUpdate.role = updates.role;
       needsUpdate = true;
       console.log(`Updating role for user ${userId} to ${updates.role}`);
       // If changing role TO superadmin, clear school info
       if (updates.role === 'superadmin') {
           if (existingUserData.schoolId) {
               dataToUpdate.schoolId = null;
               dataToUpdate.schoolName = null;
               dataToUpdate.schoolLogoUrl = null;
               schoolChanged = true; // Mark school changed to ensure denormalized fields are cleared
           }
       }
        // If changing role AWAY from student, clear student-specific fields
        if (existingUserData.role === 'student' && updates.role !== 'student') {
            dataToUpdate.class = null;
            dataToUpdate.parentContact = null;
            needsUpdate = true;
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
         newSchoolData = await getSchoolById(newSchoolId); // Uses getDb internally
         if (!newSchoolData) {
           throw new Error(`Cannot assign user to non-existent school ID: ${newSchoolId}`);
         }
         // Update schoolName and logoUrl based on fetched data
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
   } else if (schoolChanged) {
      // Ensure schoolName and logoUrl are updated even if schoolId didn't change *in this update*,
      // but was changed by a role update (e.g., to superadmin).
      dataToUpdate.schoolName = null;
      dataToUpdate.schoolLogoUrl = null;
   }


    // Update student-specific fields if role is student and fields are provided
    const finalRole = updates.role || existingUserData.role;
    if (finalRole === 'student') {
        if (updates.hasOwnProperty('class') && updates.class !== existingUserData.class) {
             dataToUpdate.class = updates.class ?? null;
             needsUpdate = true;
        }
         // Deep check for parentContact changes
        if (updates.hasOwnProperty('parentContact')) {
            const newContact = updates.parentContact ?? null;
            const oldContact = existingUserData.parentContact ?? null;
             // Basic check if objects are different; could be more granular
            if (JSON.stringify(newContact) !== JSON.stringify(oldContact)) {
                 dataToUpdate.parentContact = newContact;
                 needsUpdate = true;
            }
        }
    }


  // --- Perform Update ---
  if (needsUpdate) {
    try {
         // Convert undefined values to null
         const cleanDataToUpdate = Object.entries(dataToUpdate).reduce((acc, [key, value]) => {
            // Skip 'id' and 'password' as they are not part of the Firestore document update schema here
            if (key === 'id' || key === 'password') return acc;
            acc[key as keyof typeof dataToUpdate] = value === undefined ? null : value;
            return acc;
         }, {} as { [key: string]: any });

        await updateDoc(userDocRef, cleanDataToUpdate);
        console.log(`User profile updated for ID: ${userId}`, cleanDataToUpdate);
    } catch (error: any) {
        console.error(`Error updating user profile for ID ${userId}:`, error);
         if (error instanceof FirestoreError && error.message.includes("invalid data")) {
             console.error("Firestore update failed due to invalid data:", cleanDataToUpdate);
             throw new Error(`Failed to update profile due to invalid data: ${error.message}`);
         }
        // ... other Firestore error handling ...
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
export async function getStudentsWithContacts(schoolId: string): Promise<StudentWithContact[]> {
    if (!schoolId) {
        throw new Error("School ID is required to fetch students.");
    }
    try {
        const db = await getDb(); // Get DB instance
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
                 class: data.class ?? null, // Include class
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
