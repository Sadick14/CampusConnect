
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
   * The unique identifier of the user (Firebase Auth UID).
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
   * The ID of the school the user is associated with (optional).
   */
  schoolId?: string;
  /**
   * The name of the school the user is associated with (optional, denormalized).
   */
  schoolName?: string;
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
export const AdminUserFormSchema = z.object({
  id: z.string().optional(), // UID, present if editing. For new users, this might be undefined if Auth user isn't created first.
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.enum(['student', 'teacher', 'school_admin'], {
    errorMap: () => ({ message: "Invalid role selected." })
  }),
  schoolId: z.string().optional(),
  // schoolName is derived or passed, not directly part of the form input usually
});
export type AdminUserFormData = z.infer<typeof AdminUserFormSchema>;


/**
 * Fetches a user's profile from Firestore.
 * @param uid The Firebase Authentication UID of the user.
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
            }
        } catch (schoolError) {
            console.warn(`Could not fetch school name for schoolId ${data.schoolId}:`, schoolError);
        }
      }

      return {
        id: userSnap.id,
        name: data.name || data.displayName || 'Unnamed User',
        email: data.email,
        role: data.role || 'guest',
        schoolId: data.schoolId,
        schoolName: schoolName,
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
        // Decide how to handle offline: return null, throw, or return potentially stale data if cached?
        // Returning null is safest to avoid inconsistent state.
        return null;
    }
    // For other errors (permissions, etc.), also return null or throw
    return null;
  }
}

/**
 * Creates or updates a user's profile in Firestore.
 * Typically called after user signs up or logs in for the first time.
 * Checks for superadmin UID to assign role.
 * @param firebaseUser The Firebase Auth user object.
 * @param additionalData Additional data to store, like role or schoolId. Overrides determined role if provided (except for superadmin UID).
 * @returns Promise resolving to the created/updated User profile.
 */
export async function createUserProfile(
  firebaseUser: FirebaseUser,
  additionalData: Partial<Omit<User, 'id' | 'email' | 'name'>> = {}
): Promise<User> {
  const userDocRef = doc(db, 'users', firebaseUser.uid);

  // Determine role: superadmin based on UID overrides everything else.
  let role = 'student'; // Default role
  if (firebaseUser.uid === 'superadmin') {
    role = 'superadmin';
    console.log(`Assigning superadmin role based on UID: ${firebaseUser.uid}`);
  } else if (additionalData.role) {
    role = additionalData.role; // Use provided role if not superadmin email
  }

  const userProfileData: Omit<User, 'id'> & { createdAt: any, updatedAt: any } = {
    name: firebaseUser.displayName || additionalData.name || firebaseUser.email?.split('@')[0] || 'Anonymous User',
    email: firebaseUser.email,
    schoolId: additionalData.schoolId,
    schoolName: additionalData.schoolName,
    ...additionalData, // Spread additionalData first
    role: role,        // Ensure determined role takes precedence
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // If schoolId is present and schoolName is not, try to fetch schoolName
  if (userProfileData.schoolId && !userProfileData.schoolName) {
    try {
      const schoolDoc = await getDoc(doc(db, 'schools', userProfileData.schoolId));
      if (schoolDoc.exists()) {
        userProfileData.schoolName = (schoolDoc.data() as School).name;
      }
    } catch (error) {
      console.error(`Error fetching school name for schoolId ${userProfileData.schoolId}:`, error);
      // Don't fail the profile creation, just proceed without schoolName
    }
  }

  try {
    // Use setDoc with merge: true to create or update
    await setDoc(userDocRef, userProfileData, { merge: true });
    console.log(`User profile created/updated for UID: ${firebaseUser.uid}`, userProfileData);

    // Fetch the just-written doc to return the complete profile with server timestamps
    const savedProfileSnap = await getDoc(userDocRef);
    if (savedProfileSnap.exists()) {
        const savedData = savedProfileSnap.data();
        return {
            id: firebaseUser.uid,
            name: savedData.name,
            email: savedData.email,
            role: savedData.role,
            schoolId: savedData.schoolId,
            schoolName: savedData.schoolName,
            createdAt: savedData.createdAt instanceof Timestamp ? savedData.createdAt.toDate().toISOString() : undefined,
            updatedAt: savedData.updatedAt instanceof Timestamp ? savedData.updatedAt.toDate().toISOString() : undefined,
        };
    }
    throw new Error("Failed to retrieve profile after creation/update.");

  } catch (error: any) {
    console.error(`Error setting user profile for UID ${firebaseUser.uid}:`, error);
     if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
         console.error("createUserProfile failed: Client is offline.");
         // Rethrow or handle offline case specifically
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
      // Superadmin gets all users, or if no schoolId provided, get all.
      // TODO: Add pagination for large user sets in production.
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
        schoolId: data.schoolId,
        schoolName: data.schoolName,
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
         // Depending on requirements, could throw or return empty
         throw new Error("Permission denied fetching users.");
         // return [];
     }
    return []; // Return empty for other errors
  }
}

/**
 * Admin action to create a new user profile in Firestore.
 * IMPORTANT: This function DOES NOT create the Firebase Authentication user.
 * The Auth user must be created separately (e.g., manually in Firebase Console or via Admin SDK).
 * The UID of the Auth user MUST match the `id` returned by this function (which is the Firestore doc ID).
 * @param userData Data for the new user profile (name, email, role, schoolId).
 * @param creatingAdminRole The role of the admin performing the action ('superadmin' or 'school_admin').
 * @param creatingAdminSchoolId The school ID of the school admin (required if role is 'school_admin').
 * @returns A promise that resolves to the created User object (Firestore profile).
 * @throws Error on permission issues, duplicate email, or other failures.
 */
export async function adminCreateUserProfile(userData: AdminUserFormData, creatingAdminRole: string, creatingAdminSchoolId?: string): Promise<User> {
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
   if (userData.email === 'superadmin@example.com' && userData.role !== 'superadmin') { // Prevent non-superadmins from using this email unless setting role to superadmin
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
      console.error("Error checking for existing user email:", error);
      throw new Error("Failed to verify email uniqueness.");
  }

  // Generate Firestore Document ID - This MUST match the Firebase Auth UID you create manually.
  const newUserDocRef = doc(collection(db, 'users'));
  console.log(`Generated Firestore ID for new user profile (${userData.email}): ${newUserDocRef.id}. Ensure Firebase Auth UID matches this ID.`);

   // Also check against the superadmin UID if we know it, though this function primarily deals with email
    if (newUserDocRef.id === 'superadmin' && userData.role !== 'superadmin') {
        throw new Error("Cannot assign UID 'superadmin' to a non-superadmin role.");
    }


  const profileToCreate: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
    name: userData.name,
    email: userData.email,
    role: userData.role,
    schoolId: userData.schoolId,
    schoolName: '', // Will be populated if schoolId is provided
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
            // This should ideally not happen if school admins are restricted correctly
            throw new Error(`School with ID ${profileToCreate.schoolId} not found.`);
        }
    } catch (e: any) {
        if (e instanceof FirestoreError && (e.code === 'unavailable' || e.message.includes("offline"))) {
             throw new Error("Cannot validate school ID: Client is offline.");
        }
        throw new Error(`Failed to validate school: ${e.message}`);
    }
  } else if (userData.role !== 'superadmin' && creatingAdminRole === 'superadmin') {
    // Allow superadmin to create users without school, but log warning for non-admin roles.
     console.warn(`Superadmin creating user ${userData.email} with role ${userData.role} without assigning a school.`);
  }


  // Create the Firestore document
  try {
      await setDoc(newUserDocRef, profileToCreate);
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

      console.log(`Successfully created Firestore profile for ${finalData.email} with ID ${newUserDocRef.id}`);
      console.warn(`REMINDER: Manually create Firebase Auth user for ${finalData.email} with UID: ${newUserDocRef.id}`);


      return {
        id: newUserDocRef.id, // This is the Firestore document ID
        name: finalData.name,
        email: finalData.email,
        role: finalData.role,
        schoolId: finalData.schoolId,
        schoolName: finalData.schoolName,
        createdAt: finalData.createdAt instanceof Timestamp ? finalData.createdAt.toDate().toISOString() : undefined,
        updatedAt: finalData.updatedAt instanceof Timestamp ? finalData.updatedAt.toDate().toISOString() : undefined,
      };
   } catch (error: any) {
        if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
             console.error("Failed to retrieve created profile: Client is offline.");
             // Return potentially incomplete data or rethrow
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
         schoolId: data.schoolId,
         schoolName: data.schoolName,
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

  // Prevent non-superadmins from editing superadmin
  if (existingUserData.role === 'superadmin' && updatingAdminRole !== 'superadmin') {
    throw new Error("Only a superadmin can modify another superadmin's profile.");
  }
  // Prevent changing UID 'superadmin' role unless current editor is also superadmin (and UID matches 'superadmin')
  if (userId === 'superadmin' && updates.role && updates.role !== 'superadmin') {
      throw new Error("The role of the primary superadmin (UID 'superadmin') cannot be changed from 'superadmin'.");
  }


  // School Admin Restrictions
  if (updatingAdminRole === 'school_admin') {
    if (!updatingAdminSchoolId) {
         throw new Error("School admin performing update is missing their school ID.");
    }
    if (existingUserData.schoolId !== updatingAdminSchoolId && existingUserData.role !== 'superadmin') { // superadmin can be unattached
      throw new Error("School admins can only update users within their own school.");
    }
    // Prevent school admins from changing roles to/from admin roles
    if ((updates.role && (updates.role === 'school_admin' || updates.role === 'superadmin')) || existingUserData.role === 'school_admin' || existingUserData.role === 'superadmin') {
      if (updates.role !== existingUserData.role) { // Allow changing between student/teacher
         throw new Error("School admins cannot change user roles to/from admin-level roles.");
      }
    }
    // Prevent school admins from changing school assignment
     if (updates.schoolId && updates.schoolId !== updatingAdminSchoolId) {
      throw new Error("School admins cannot change a user's school assignment.");
    }
  }

   // Prevent changing email via this function as it has implications for Firebase Auth
   if (updates.email && updates.email !== existingUserData.email) {
       console.warn(`Attempted to update email for ${userId}, which is not allowed via adminUpdateUserProfile. Skipping email update.`);
       delete updates.email; // Remove email from updates
   }


  // Prepare data for Firestore update
  const dataToUpdate: { [key: string]: any } = { updatedAt: serverTimestamp() }; 
  if (updates.name) dataToUpdate.name = updates.name;

  // Update role if allowed and changed
  if (updates.role && updates.role !== existingUserData.role) {
     // Additional check: if target user is 'superadmin', only a superadmin can change their role (and not away from 'superadmin' if UID is 'superadmin')
     if (existingUserData.role === 'superadmin' && userId !== 'superadmin' && updatingAdminRole === 'superadmin') {
        dataToUpdate.role = updates.role; // Superadmin can demote another superadmin (not the primary one)
        console.log(`Superadmin updating role for user ${userId} to ${updates.role}`);
     } else if (existingUserData.role !== 'superadmin') { // Non-superadmins can have their role changed
        dataToUpdate.role = updates.role;
        console.log(`Updating role for user ${userId} to ${updates.role}`);
     }
  }

  // Handle schoolId and schoolName update
  let schoolChanged = false;
  if (updates.schoolId !== undefined && updates.schoolId !== (existingUserData.schoolId || null)) { // Compare with null if schoolId can be empty
    schoolChanged = true;
    dataToUpdate.schoolId = updates.schoolId || null; // Store null if cleared
  } else if (updates.schoolId === undefined && existingUserData.schoolId !== null && updates.hasOwnProperty('schoolId') && updates.schoolId === null ) { 
    // Explicitly setting schoolId to null (clearing it)
    schoolChanged = true;
    dataToUpdate.schoolId = null;
  }


  if (schoolChanged) {
    if (dataToUpdate.schoolId) { // Assigning to a new school or changing school
      try {
        const schoolDoc = await getDoc(doc(db, 'schools', dataToUpdate.schoolId));
        if (schoolDoc.exists()) {
          dataToUpdate.schoolName = (schoolDoc.data() as School).name;
          console.log(`Updating school for user ${userId} to ${dataToUpdate.schoolName} (${dataToUpdate.schoolId})`);
        } else {
           // If user is not superadmin, they must be assigned to a valid school
           if(existingUserData.role !== 'superadmin' && dataToUpdate.role !== 'superadmin') {
               throw new Error(`Cannot assign user to non-existent school ID: ${dataToUpdate.schoolId}`);
           }
           console.warn(`Assigning user ${userId} (role: ${existingUserData.role}) to non-existent school ID ${dataToUpdate.schoolId}. Clearing school name.`);
           dataToUpdate.schoolName = null; 
        }
      } catch (e: any) {
         if (e instanceof FirestoreError && (e.code === 'unavailable' || e.message.includes("offline"))) {
             throw new Error("Cannot validate new school ID: Client is offline.");
         }
         throw new Error(`Failed to validate school for update: ${e.message}`);
      }
    } else { // Clearing school assignment
      if (existingUserData.role !== 'superadmin' && (dataToUpdate.role ? dataToUpdate.role !== 'superadmin' : true) ) {
          throw new Error("Non-superadmin users must be assigned to a school. Cannot clear schoolId.");
      }
      console.log(`Clearing school assignment for user ${userId}`);
      dataToUpdate.schoolId = null;
      dataToUpdate.schoolName = null;
    }
  }


  // Perform the update
  if (Object.keys(dataToUpdate).length > 1) { // at least updatedAt + one other field
    try {
        await updateDoc(userDocRef, dataToUpdate);
        console.log(`User profile updated for ID: ${userId}`, dataToUpdate);
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


  // Fetch and return the updated profile
  try {
      const updatedUserSnap = await getDoc(userDocRef);
       if (!updatedUserSnap.exists()) {
           throw new Error("Failed to retrieve updated user profile.");
       }
       const finalData = updatedUserSnap.data();
       return {
        id: updatedUserSnap.id,
        name: finalData.name,
        email: finalData.email,
        role: finalData.role,
        schoolId: finalData.schoolId,
        schoolName: finalData.schoolName,
        createdAt: finalData.createdAt instanceof Timestamp ? finalData.createdAt.toDate().toISOString() : undefined,
        updatedAt: finalData.updatedAt instanceof Timestamp ? finalData.updatedAt.toDate().toISOString() : undefined,
      };
   } catch (error: any) {
       if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
            console.error("Failed to retrieve updated profile: Client is offline.");
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

