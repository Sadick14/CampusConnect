
/**
 * @fileOverview Service functions for managing user data.
 */
import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc, serverTimestamp, Timestamp, FirestoreError } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
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
// NOTE: `id` is included for updates but generated for creates.
// `authUid` is removed as it's no longer manually input in this workflow.
export const AdminUserFormSchema = z.object({
  id: z.string().optional(), // Firestore Doc ID, present when editing.
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.enum(['student', 'teacher', 'school_admin'], { // Superadmin role handled separately
    errorMap: () => ({ message: "Invalid role selected." })
  }),
  schoolId: z.string().optional().nullable(), // Allow null or optional string
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
            schoolName = (schoolSnap.data() as School).name;
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
      return null;
    }
  } catch (error: any) {
    console.error(`Error fetching user profile for UID ${uid}:`, error);
    if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
        console.warn("getUserProfile: Failed to get user profile because the client is offline.");
        return null;
    }
    return null;
  }
}

/**
 * Creates or updates a user's profile in Firestore.
 * IMPORTANT: This is typically called during login to ensure the profile exists and matches Auth info.
 * It handles the special 'superadmin' UID case.
 * For admin-initiated creation, use `adminCreateUserProfile`.
 * @param firebaseUser The Firebase Auth user object.
 * @param additionalData Additional data like role or schoolId (usually from existing profile or defaults).
 * @returns Promise resolving to the created/updated User profile.
 */
export async function createUserProfile(
  firebaseUser: FirebaseUser,
  additionalData: Partial<Omit<User, 'id' | 'email' | 'name'>> = {}
): Promise<User> {
  const userDocRef = doc(db, 'users', firebaseUser.uid);

  // Determine role: superadmin based on UID overrides everything else.
  let role = 'student'; // Default role if not specified and not superadmin
  if (firebaseUser.uid === 'superadmin') {
    role = 'superadmin';
    console.log(`Assigning superadmin role based on UID: ${firebaseUser.uid}`);
    // Superadmin should not be associated with a specific school
    additionalData.schoolId = null;
    additionalData.schoolName = null;
  } else if (additionalData.role) {
    role = additionalData.role; // Use provided role if not superadmin UID
  }

  // Prepare data for Firestore write/merge
  const userProfileData: Partial<Omit<User, 'id'>> & { createdAt?: any, updatedAt: any } = {
    name: firebaseUser.displayName || additionalData.name || firebaseUser.email?.split('@')[0] || 'Anonymous User',
    email: firebaseUser.email,
    schoolId: additionalData.schoolId ?? null, // Use provided or default to null
    schoolName: additionalData.schoolName ?? null, // Use provided or default to null
    ...additionalData, // Spread provided data first
    role: role,        // Ensure determined role takes precedence
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(), // Firestore handles this on create during merge
  };


  // If schoolId is present and schoolName is not, try to fetch schoolName
  if (userProfileData.schoolId && !userProfileData.schoolName) {
    try {
      const schoolDoc = await getDoc(doc(db, 'schools', userProfileData.schoolId));
      if (schoolDoc.exists()) {
        userProfileData.schoolName = (schoolDoc.data() as School).name;
      } else {
         console.warn(`School ${userProfileData.schoolId} not found when creating/updating profile for ${firebaseUser.uid}. Setting schoolName to null.`);
         userProfileData.schoolName = null; // Ensure consistency
      }
    } catch (error) {
      console.error(`Error fetching school name for schoolId ${userProfileData.schoolId}:`, error);
      userProfileData.schoolName = null; // Set to null on error
    }
  }

  // Clean data: Remove undefined values before sending to Firestore
  const cleanData = Object.entries(userProfileData).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof typeof userProfileData] = value;
    }
    // Keep explicit nulls (like for schoolId/schoolName)
    else if (value === null && (key === 'schoolId' || key === 'schoolName')) {
        acc[key as keyof typeof userProfileData] = null;
    }
    return acc;
  }, {} as { [key: string]: any }); // Cast to allow serverTimestamp


  try {
    // Use setDoc with merge: true to create or update
    await setDoc(userDocRef, cleanData, { merge: true });
    console.log(`User profile created/updated for UID: ${firebaseUser.uid}`, cleanData);

    // Fetch the just-written doc to return the complete profile
    const savedProfileSnap = await getDoc(userDocRef);
    if (savedProfileSnap.exists()) {
        const savedData = savedProfileSnap.data();
        return {
            id: firebaseUser.uid,
            name: savedData.name,
            email: savedData.email,
            role: savedData.role,
            schoolId: savedData.schoolId ?? null,
            schoolName: savedData.schoolName ?? null,
            createdAt: savedData.createdAt instanceof Timestamp ? savedData.createdAt.toDate().toISOString() : undefined,
            updatedAt: savedData.updatedAt instanceof Timestamp ? savedData.updatedAt.toDate().toISOString() : undefined,
        };
    }
    throw new Error("Failed to retrieve profile after creation/update.");

  } catch (error: any) {
    console.error(`Error setting user profile for UID ${firebaseUser.uid}:`, error);
     if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
         console.error("createUserProfile failed: Client is offline.");
         throw new Error(`Failed to create/update user profile because the client is offline: ${error.message}`);
     }
    throw new Error(`Failed to create/update user profile: ${error.message}`);
  }
}

/**
 * Retrieves all users (for superadmin) or users for a specific school (for school_admin).
 * @param forSchoolId Optional school ID to filter users by.
 * @returns A promise that resolves to an array of User objects.
 */
export async function getUsers(forSchoolId?: string): Promise<User[]> {
  try {
    const usersCol = collection(db, 'users');
    let q;
    if (forSchoolId) {
      console.log(`Fetching users for school: ${forSchoolId}`);
      q = query(usersCol, where('schoolId', '==', forSchoolId));
    } else {
      console.log("Fetching all users (Superadmin view or no schoolId specified).");
      q = query(usersCol);
    }
    const userSnapshot = await getDocs(q);
    const userList = userSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || data.displayName || 'N/A',
        email: data.email || 'N/A',
        role: data.role || 'N/A',
        schoolId: data.schoolId ?? null,
        schoolName: data.schoolName ?? null,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as User;
    });
    console.log(`Fetched ${userList.length} users.`);
    return userList;
  } catch (error: any) {
    console.error('Error fetching users:', error);
    if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
        console.warn("getUsers: Client is offline, returning empty list.");
        return [];
    }
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
         console.error("Permission denied fetching users.");
         throw new Error("Permission denied fetching users.");
     }
    return []; // Return empty for other errors
  }
}

/**
 * Admin action to create a new user profile in Firestore.
 * IMPORTANT: This function DOES NOT create the Firebase Authentication user.
 * The Auth user must be created separately (e.g., manually in Firebase Console).
 * The UID of the Auth user MUST match the `id` returned by this function (which is the Firestore doc ID).
 * @param userData Data for the new user profile (name, email, role, schoolId). ID is omitted as it's generated.
 * @param creatingAdminRole The role of the admin performing the action ('superadmin' or 'school_admin').
 * @param creatingAdminSchoolId The school ID of the school admin (required if role is 'school_admin').
 * @returns A promise that resolves to the created User object (Firestore profile).
 * @throws Error on permission issues, duplicate email, or other failures.
 */
export async function adminCreateUserProfile(userData: Omit<AdminUserFormData, 'id'>, creatingAdminRole: string, creatingAdminSchoolId?: string): Promise<User> {
  // Permission Checks
  if (creatingAdminRole !== 'superadmin' && creatingAdminRole !== 'school_admin') {
    throw new Error("Permission denied: Only admins can create users.");
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
       userData.schoolId = creatingAdminSchoolId; // Force assignment to admin's school
    } else if (!userData.schoolId) {
         userData.schoolId = creatingAdminSchoolId; // Assign to admin's school if not provided
    }
  }
  // Prevent assigning reserved superadmin email to non-superadmin roles
   if (userData.email === 'superadmin@example.com' && userData.role !== 'superadmin') { // Note: Superadmin role isn't directly creatable here
      throw new Error("The email superadmin@example.com is reserved for the superadmin role.");
   }


  // Check for existing user profile with the same email
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', userData.email));
  try {
      const existingUserSnap = await getDocs(q);
      if (!existingUserSnap.empty) {
        throw new Error(`A user profile with email ${userData.email} already exists in Firestore.`);
      }
  } catch (error: any) {
      if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
          throw new Error("Cannot check for existing user: Client is offline.");
      }
       if (error instanceof Error && error.message.includes("already exists")) {
         throw error; // Re-throw specific error
       }
      console.error("Error checking for existing user email:", error);
      throw new Error("Failed to verify email uniqueness.");
  }

  // Generate Firestore Document ID - This MUST match the Firebase Auth UID you create manually.
  const newUserDocRef = doc(collection(db, 'users'));
  const generatedUserId = newUserDocRef.id;
  console.log(`Generated Firestore ID for new user profile (${userData.email}): ${generatedUserId}. Ensure Firebase Auth UID matches this ID.`);

   // Prevent accidental creation with the superadmin UID via this function
    if (generatedUserId === 'superadmin') {
        throw new Error("Cannot programmatically create a profile with the reserved 'superadmin' UID. This must be handled via login flow.");
    }


  const profileToCreate: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
    name: userData.name,
    email: userData.email,
    role: userData.role,
    schoolId: userData.schoolId ?? null, // Ensure null if not provided
    schoolName: null, // Initialize as null, fetch below if schoolId exists
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Validate and fetch schoolName if schoolId is provided
  if (profileToCreate.schoolId) {
    try {
        const schoolDoc = await getDoc(doc(db, 'schools', profileToCreate.schoolId));
        if (schoolDoc.exists()) {
            profileToCreate.schoolName = (schoolDoc.data() as School).name;
            console.log(`Assigning user ${userData.email} to school: ${profileToCreate.schoolName} (${profileToCreate.schoolId})`);
        } else {
            // If school admin is creating, this shouldn't happen due to checks above.
            // If superadmin provides invalid ID:
             if (creatingAdminRole === 'superadmin') {
                 console.warn(`Superadmin provided non-existent school ID ${profileToCreate.schoolId} for user ${userData.email}. Proceeding without school assignment.`);
                 profileToCreate.schoolId = null; // Clear invalid schoolId
                 profileToCreate.schoolName = null;
             } else {
                // This implies school admin's school doesn't exist? Should not happen.
                 throw new Error(`School with ID ${profileToCreate.schoolId} not found.`);
             }
        }
    } catch (e: any) {
        if (e instanceof FirestoreError && (e.code === 'unavailable' || e.message.includes("offline"))) {
             throw new Error("Cannot validate school ID: Client is offline.");
        }
        // Throw other errors during school validation
        throw new Error(`Failed to validate school: ${e.message}`);
    }
  } else if (userData.role !== 'superadmin' && creatingAdminRole === 'superadmin') {
    // Allow superadmin to create users without school, but log warning for non-admin roles.
     console.warn(`Superadmin creating user ${userData.email} with role ${userData.role} without assigning a school.`);
     profileToCreate.schoolName = null; // Explicitly set to null
  } else {
      profileToCreate.schoolName = null; // Ensure null if no schoolId
  }


  // Create the Firestore document using the generated ID
  try {
       // Ensure we don't pass undefined fields explicitly
      const cleanData = Object.entries(profileToCreate).reduce((acc, [key, value]) => {
          if (value !== undefined) {
              acc[key as keyof typeof profileToCreate] = value;
          } else {
              // Explicitly set known optional fields to null if undefined
               if (key === 'schoolId' || key === 'schoolName') {
                   acc[key as keyof typeof profileToCreate] = null;
               }
          }
          return acc;
      }, {} as { [key: string]: any }); // Cast to allow serverTimestamp

      await setDoc(newUserDocRef, cleanData);
  } catch (error: any) {
       if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
             throw new Error("Cannot create user profile: Client is offline.");
        }
      console.error(`Error setting user profile document for ${userData.email}:`, error);
      throw new Error(`Failed to create Firestore profile: ${error.message}`);
  }

  // Fetch and return the created profile
  try {
      const createdDocSnap = await getDoc(newUserDocRef);
      if (!createdDocSnap.exists()) {
        throw new Error("Failed to retrieve created user profile.");
      }
      const finalData = createdDocSnap.data();

      console.log(`Successfully created Firestore profile for ${finalData.email} with ID ${generatedUserId}`);
      console.warn(`REMINDER: Manually create Firebase Auth user for ${finalData.email} with UID: ${generatedUserId}`);


      return {
        id: generatedUserId, // This is the Firestore document ID
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
             console.error("Failed to retrieve created profile: Client is offline.");
             // Consider what to return here. Throwing might be best.
             throw new Error("Failed to retrieve created profile: Client is offline.");
        }
       console.error("Error retrieving created profile:", error);
       throw new Error("Failed to retrieve created profile after saving.");
   }
}

/**
 * Admin action to update an existing user's profile in Firestore.
 * @param userId The ID (Firebase Auth UID / Firestore Doc ID) of the user profile to update.
 * @param updates Partial data for the user profile (name, role, schoolId). Email cannot be updated here.
 * @param updatingAdminRole Role of the admin performing the action.
 * @param updatingAdminSchoolId School ID of the admin (if school_admin).
 * @returns A promise that resolves to the updated User object.
 * @throws Error on permission issues or other failures.
 */
export async function adminUpdateUserProfile(userId: string, updates: Partial<AdminUserFormData>, updatingAdminRole: string, updatingAdminSchoolId?: string): Promise<User> {
  // Permission Checks
  if (updatingAdminRole !== 'superadmin' && updatingAdminRole !== 'school_admin') {
    throw new Error("Permission denied: Only admins can update users.");
  }

  const userDocRef = doc(db, 'users', userId);
  let existingUserData: User;

  // Fetch existing user data
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

  // --- Apply Authorization Rules ---

  // Prevent non-superadmins from editing superadmin
  if (existingUserData.role === 'superadmin' && updatingAdminRole !== 'superadmin') {
    throw new Error("Only a superadmin can modify another superadmin's profile.");
  }
  // Prevent changing UID 'superadmin' role unless current editor is also superadmin
  if (userId === 'superadmin' && updates.role && updates.role !== 'superadmin') {
      throw new Error("The role of the primary superadmin (UID 'superadmin') cannot be changed from 'superadmin'.");
  }


  // School Admin Restrictions
  if (updatingAdminRole === 'school_admin') {
    if (!updatingAdminSchoolId) {
         throw new Error("School admin performing update is missing their school ID.");
    }
    // Allow updating superadmin if they happen to be listed under the school (unlikely but possible)
    if (existingUserData.role !== 'superadmin' && existingUserData.schoolId !== updatingAdminSchoolId) {
      throw new Error("School admins can only update users within their own school.");
    }
    // Prevent school admins from changing roles to/from admin roles
    if (updates.role && (updates.role === 'school_admin' || updates.role === 'superadmin')) {
         throw new Error("School admins cannot promote users to admin roles.");
    }
    if (existingUserData.role === 'school_admin' && updates.role && updates.role !== 'school_admin') {
         throw new Error("School admins cannot change the role of another school admin.");
    }
    // Prevent school admins from changing school assignment
     if (updates.schoolId !== undefined && updates.schoolId !== existingUserData.schoolId) {
      throw new Error("School admins cannot change a user's school assignment.");
    }
  }

   // Prevent changing email via this function
   if (updates.email && updates.email !== existingUserData.email) {
       console.warn(`Attempted to update email for ${userId}, which is not allowed via adminUpdateUserProfile. Skipping email update.`);
       delete updates.email;
   }
   // Prevent changing the ID
   if (updates.id) {
      delete updates.id;
   }

  // --- Prepare Data for Update ---
  const dataToUpdate: { [key: string]: any } = { updatedAt: serverTimestamp() };

  if (updates.name !== undefined && updates.name !== existingUserData.name) dataToUpdate.name = updates.name;

  // Update role if allowed and changed
  if (updates.role && updates.role !== existingUserData.role) {
     // Check permissions again based on target role and existing role
     if (existingUserData.role === 'superadmin') {
        // Should have been caught earlier, but double-check
        if (updatingAdminRole !== 'superadmin') throw new Error("Permission denied to change superadmin role.");
         // Allow superadmin to demote another superadmin (if not the primary 'superadmin' UID)
         if (userId !== 'superadmin') {
              dataToUpdate.role = updates.role;
              console.log(`Superadmin demoting user ${userId} to ${updates.role}`);
         } else {
             // Cannot change primary superadmin role
              console.warn("Attempted to change role of primary superadmin (UID 'superadmin'). Skipping role update.");
         }
     } else if (updates.role === 'school_admin') {
          // Check if promoter is superadmin
         if (updatingAdminRole !== 'superadmin') throw new Error("Only superadmins can promote users to School Admin.");
          dataToUpdate.role = updates.role;
          console.log(`Superadmin promoting user ${userId} to School Admin.`);
     } else {
          // Allow changing between non-admin roles (student, teacher) by authorized admins
          dataToUpdate.role = updates.role;
          console.log(`Updating role for user ${userId} to ${updates.role}`);
     }
  }

  // Handle schoolId and schoolName update
  let schoolChanged = false;
  // Check if schoolId is explicitly being set (could be null or a string)
  if (updates.hasOwnProperty('schoolId') && updates.schoolId !== existingUserData.schoolId) {
    // Permission check: Only superadmin can change school assignment
    if (updatingAdminRole !== 'superadmin' && existingUserData.role !== 'superadmin') { // Allow superadmin to change their own non-existent schoolId
         throw new Error("Only superadmins can change a user's school assignment.");
    }
    schoolChanged = true;
    dataToUpdate.schoolId = updates.schoolId ?? null; // Store null if updates.schoolId is null or undefined
  }


  if (schoolChanged) {
    const targetRole = dataToUpdate.role ?? existingUserData.role; // Use updated role if changed
     // Ensure non-superadmin roles are assigned to a valid school or nullified only by superadmin
     if (dataToUpdate.schoolId) { // Assigning to a new school or changing school
       try {
         const schoolDoc = await getDoc(doc(db, 'schools', dataToUpdate.schoolId));
         if (schoolDoc.exists()) {
           dataToUpdate.schoolName = (schoolDoc.data() as School).name;
           console.log(`Updating school for user ${userId} to ${dataToUpdate.schoolName} (${dataToUpdate.schoolId})`);
         } else {
            // If assigning to a non-existent school:
             if(targetRole !== 'superadmin') {
                 throw new Error(`Cannot assign user to non-existent school ID: ${dataToUpdate.schoolId}`);
             }
             // Allow superadmin role to have non-existent school ID (treat as unassigned)
             console.warn(`Assigning superadmin ${userId} to non-existent school ID ${dataToUpdate.schoolId}. Clearing school name.`);
             dataToUpdate.schoolName = null;
             dataToUpdate.schoolId = null; // Correct the schoolId to null if school doc doesn't exist
         }
       } catch (e: any) {
          if (e instanceof FirestoreError && (e.code === 'unavailable' || e.message.includes("offline"))) {
              throw new Error("Cannot validate new school ID: Client is offline.");
          }
          throw new Error(`Failed to validate school for update: ${e.message}`);
       }
     } else { // Clearing school assignment (setting schoolId to null)
       // Only superadmin can clear school assignment for non-superadmin users
       if (targetRole !== 'superadmin' && updatingAdminRole !== 'superadmin') {
           throw new Error("Only superadmins can unassign users from a school.");
       }
        // Ensure superadmin role always has null schoolId/Name if cleared
         if(targetRole === 'superadmin') {
             dataToUpdate.schoolId = null;
             dataToUpdate.schoolName = null;
             console.log(`Ensuring superadmin ${userId} has null school assignment.`);
         } else {
             console.log(`Clearing school assignment for user ${userId}`);
             dataToUpdate.schoolId = null;
             dataToUpdate.schoolName = null;
         }
     }
  }


  // Perform the update only if there are changes other than just updatedAt
  if (Object.keys(dataToUpdate).length > 1) {
    try {
        // Clean the data before updating (remove undefined)
         const cleanDataToUpdate = Object.entries(dataToUpdate).reduce((acc, [key, value]) => {
           if (value !== undefined) {
             acc[key as keyof typeof dataToUpdate] = value;
           }
           return acc;
         }, {} as { [key: string]: any });

        await updateDoc(userDocRef, cleanDataToUpdate);
        console.log(`User profile updated for ID: ${userId}`, cleanDataToUpdate);
    } catch (error: any) {
        if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
            throw new Error("Cannot update user profile: Client is offline.");
        }
        console.error(`Error updating user profile for ID ${userId}:`, error);
        throw new Error(`Failed to update profile: ${error.message}`);
    }
  } else {
      console.log(`No actual changes to update for user ID: ${userId}. Skipping Firestore update.`);
  }


  // Fetch and return the (potentially unchanged if no fields were modified) profile
  try {
      const updatedUserSnap = await getDoc(userDocRef);
       if (!updatedUserSnap.exists()) {
           // This should not happen if the initial fetch succeeded
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
            // Consider returning existingUserData or throwing
            throw new Error("Failed to retrieve updated profile: Client is offline.");
       }
      console.error("Error retrieving updated profile:", error);
      throw new Error("Failed to retrieve updated profile after saving.");
   }
}


// Placeholder - actual superadmin initialization is more about ensuring the Auth user exists
// and then their profile is created on first login by createUserProfile.
export async function initializeSuperAdmin() {
    // The createUserProfile function handles creating/updating the Firestore doc
    // with 'superadmin' role if the logged-in user's UID is 'superadmin'.
    console.log(`Super Admin Auth user (any email) MUST be created manually in Firebase Console with UID: 'superadmin'.`);
    console.log(`On first login with these credentials, their Firestore profile will be created/updated with 'superadmin' role.`);
}
