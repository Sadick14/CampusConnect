import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { User } from '@/schemas/user';

const USERS_COLLECTION = 'users';

/**
 * Add an organization ID to user's organizationIds array
 */
export async function addUserOrganization(userId: string, organizationId: string): Promise<void> {
  try {
    const userRef = doc(getDb(), USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data() as User;
    const currentOrgs = userData.organizationIds || [];
    
    if (!currentOrgs.includes(organizationId)) {
      await updateDoc(userRef, {
        organizationIds: [...currentOrgs, organizationId],
        currentOrganizationId: organizationId, // Set as current organization
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error adding organization to user:', error);
    throw new Error('Failed to add organization to user');
  }
}

/**
 * Remove an organization ID from user's organizationIds array
 */
export async function removeUserOrganization(userId: string, organizationId: string): Promise<void> {
  try {
    const userRef = doc(getDb(), USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data() as User;
    const currentOrgs = userData.organizationIds || [];
    const updatedOrgs = currentOrgs.filter(id => id !== organizationId);
    
    const updateData: any = {
      organizationIds: updatedOrgs,
      updatedAt: new Date().toISOString(),
    };

    // If removing the current organization, clear it or set to first available
    if (userData.currentOrganizationId === organizationId) {
      updateData.currentOrganizationId = updatedOrgs.length > 0 ? updatedOrgs[0] : null;
    }

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error removing organization from user:', error);
    throw new Error('Failed to remove organization from user');
  }
}

/**
 * Set user's current organization
 */
export async function setUserCurrentOrganization(userId: string, organizationId: string | null): Promise<void> {
  try {
    const userRef = doc(getDb(), USERS_COLLECTION, userId);
    
    await updateDoc(userRef, {
      currentOrganizationId: organizationId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error setting current organization:', error);
    throw new Error('Failed to set current organization');
  }
}

/**
 * Get user's current organization ID
 */
export async function getUserCurrentOrganization(userId: string): Promise<string | null> {
  try {
    const userRef = doc(getDb(), USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data() as User;
    return userData.currentOrganizationId || null;
  } catch (error) {
    console.error('Error getting current organization:', error);
    return null;
  }
}

/**
 * Get all organization IDs for a user
 */
export async function getUserOrganizationIds(userId: string): Promise<string[]> {
  try {
    const userRef = doc(getDb(), USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data() as User;
    return userData.organizationIds || [];
  } catch (error) {
    console.error('Error getting user organization IDs:', error);
    return [];
  }
}