
'use server';
/**
 * @fileOverview Service functions for managing user data.
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
import type { School } from './school'; // Assuming School type is available

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
   * The role of the user (e.g., 'superadmin', 'school_admin', 'teacher').
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
}

/**
 * Fetches a user's profile from Firestore.
 * @param uid The Firebase Authentication UID of the user.
 * @returns A promise that resolves to a User object if found, or null.
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      let schoolName = data.schoolName;

      // If schoolId exists but schoolName is not denormalized or needs update, fetch it.
      if (data.schoolId && !schoolName) {
        const schoolDocRef = doc(db, 'schools', data.schoolId);
        const schoolSnap = await getDoc(schoolDocRef);
        if (schoolSnap.exists()) {
          schoolName = (schoolSnap.data() as School).name;
        }
      }

      return {
        id: userSnap.id,
        name: data.displayName || data.name || 'Unnamed User',
        email: data.email,
        role: data.role || 'guest', // Default to 'guest' if no role
        schoolId: data.schoolId,
        schoolName: schoolName,
      };
    } else {
      console.warn(`No profile found for user UID: ${uid} in 'users' collection.`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Creates or updates a user's profile in Firestore.
 * Typically called after user signs up or logs in for the first time.
 * @param firebaseUser The Firebase Auth user object.
 * @param additionalData Additional data to store, like role or schoolId.
 */
export async function createUserProfile(
  firebaseUser: FirebaseUser,
  additionalData: Partial<User> = {}
): Promise<User> {
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userProfile: User = {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || additionalData.name || firebaseUser.email?.split('@')[0] || 'Anonymous User',
    email: firebaseUser.email,
    role: additionalData.role || 'student', // Default role, adjust as needed
    schoolId: additionalData.schoolId,
    schoolName: additionalData.schoolName,
    ...additionalData, // Explicitly spread additionalData to override defaults if provided
  };

  // If schoolId is present and schoolName is not, try to fetch schoolName
  if (userProfile.schoolId && !userProfile.schoolName) {
    try {
      const schoolDoc = await getDoc(doc(db, 'schools', userProfile.schoolId));
      if (schoolDoc.exists()) {
        userProfile.schoolName = (schoolDoc.data() as School).name;
      }
    } catch (error) {
      console.error(`Error fetching school name for schoolId ${userProfile.schoolId}:`, error);
    }
  }

  await setDoc(userDocRef, userProfile, { merge: true });
  return userProfile;
}


// Keep existing placeholder functions for now if they serve other admin purposes
// Or remove if createUserProfile and getUserProfile cover all needs.

/**
 * Asynchronously retrieves a generic user by its ID (placeholder).
 *
 * @param id The ID of the user to retrieve.
 * @returns A promise that resolves to a User object if found, or null if not found.
 */
export async function getGenericUser(id: string): Promise<User | null> {
  // This might be different from getUserProfile if it refers to a different kind of user record
  // For now, it can alias to getUserProfile if 'id' is a UID.
  return getUserProfile(id);
}

/**
 * Asynchronously creates a new generic user (placeholder).
 *
 * @param user The user data to create.
 * @returns A promise that resolves to the created User object.
 */
export async function createGenericUser(userData: Omit<User, 'id' > & {idToSet?: string}): Promise<User> {
  // This is a generic user creation, might not use Firebase Auth directly for this
  // Needs a clear definition of how users are created outside Auth flow.
  // For now, let's assume it creates a document in 'users' collection with a generated or provided ID.
  
  const id = userData.idToSet || doc(collection(db, 'users')).id; // Example: auto-generate ID if not provided
  const newUser: User = {
    id,
    ...userData,
  };
  await setDoc(doc(db, 'users', id), newUser);
  return newUser;
}
