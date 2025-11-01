'use server';
/**
 * @fileOverview Service functions for managing school data in Firestore.
 * PRODUCTION VERSION - Uses Firestore for persistent storage.
 */

import { auth, storage } from '@/lib/firebase';
import { getDb } from '@/lib/firebase-server';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Import types from schemas
import {
    type School,
    type NewSchoolData,
    type UpdateSchoolProfileData,
} from '@/schemas/school';
import type { User } from '@/schemas/user';
import { calculateTrialExpiry, SUBSCRIPTION_PLANS } from '@/schemas/subscription';


// Re-export types for convenience
export type { School, NewSchoolData, UpdateSchoolProfileData };

console.log('School Service: Using Firestore Database.');

/**
 * Generates a simple license key.
 */
function generateLicenseKey(): string {
  const prefix = 'CCP'; // CampusConnect Pro
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${randomPart}`;
}

/**
 * Registers a new school using Firestore.
 * Creates the Firebase Auth user, then adds school and user profile to Firestore.
 */
export async function registerSchool(schoolData: NewSchoolData): Promise<School> {
    const db = getDb();
    
    // 1. Check if email already exists in Firestore
    const usersRef = collection(db, 'users');
    const emailQuery = query(usersRef, where('email', '==', schoolData.adminEmail));
    const existingUsers = await getDocs(emailQuery);
    
    if (!existingUsers.empty) {
        throw new Error(`Registration failed: The email address ${schoolData.adminEmail} is already registered.`);
    }
    
    // 2. Create Firebase Auth User
    let adminAuthUid: string;
    try {
        console.log(`Attempting to create Auth user for ${schoolData.adminEmail}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, schoolData.adminEmail, schoolData.adminPassword);
        adminAuthUid = userCredential.user.uid;
        console.log(`Auth user created successfully with UID: ${adminAuthUid}`);

        try {
             await updateProfile(userCredential.user, { displayName: `${schoolData.name} Admin` });
             console.log(`Set display name for Auth user ${adminAuthUid}.`);
        } catch (profileError) {
            console.warn(`Could not set display name for Auth user ${adminAuthUid}:`, profileError);
        }
    } catch (error: any) {
        console.error('Error creating Firebase Auth user:', error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error(`Authentication failed: The email address ${schoolData.adminEmail} is already in use by another account.`);
        }
        throw new Error(`Failed to create admin authentication account: ${error.message}`);
    }

    // 3. Create School in Firestore
    try {
        const schoolsRef = collection(db, 'schools');
        const newSchoolRef = doc(schoolsRef); // Generate a new ID
        const schoolId = newSchoolRef.id;
        const now = new Date();
        const trialEndDate = calculateTrialExpiry(now);
        
        const schoolToAdd = {
            name: schoolData.name,
            licenseKey: generateLicenseKey(),
            adminEmail: schoolData.adminEmail,
            adminUid: adminAuthUid,
            address: null,
            phone: null,
            website: null,
            logoUrl: null,
            
            // Correctly initialize subscription fields
            subscriptionStatus: 'trial',
            subscriptionType: 'TRIAL',
            trialStartDate: Timestamp.fromDate(now),
            trialEndDate: Timestamp.fromDate(trialEndDate),
            isTrialActive: true,
            daysRemaining: SUBSCRIPTION_PLANS.TRIAL.duration,
            subscriptionStartDate: null,
            subscriptionEndDate: null,
            nextBillingDate: null,
            lastPaymentDate: null,
            totalAmountPaid: 0,
            paymentStatus: 'none',

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        
        await setDoc(newSchoolRef, schoolToAdd);
        console.log(`School ${schoolData.name} registered in Firestore with ID: ${schoolId}`);

        // 4. Create Admin User Profile in Firestore
        const adminProfileRef = doc(db, 'users', adminAuthUid);
        const adminProfile = {
            name: `${schoolData.name} Admin`,
            email: schoolData.adminEmail,
            role: 'school_admin',
            schoolId: schoolId,
            schoolName: schoolData.name,
            schoolLogoUrl: null,
            class: null,
            parentContact: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        
        await setDoc(adminProfileRef, adminProfile);
        console.log(`Admin profile created in Firestore for ${schoolData.adminEmail} using Auth UID: ${adminAuthUid}`);

        // Return the created school
        return {
            id: schoolId,
            ...schoolToAdd,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as School;

    } catch (error: any) {
        console.error('Error adding school/admin profile to Firestore:', error);
        console.error(`CRITICAL: Failed to add data to Firestore for school ${schoolData.name}. Auth user ${adminAuthUid} may exist without linked profile/school.`);
        throw new Error(`Failed to save school/profile data. Please try again. ${error.message}`);
    }
}

/**
 * Retrieves all schools from Firestore.
 */
export async function getSchools(): Promise<School[]> {
  try {
    const db = getDb();
    const schoolsRef = collection(db, 'schools');
    const querySnapshot = await getDocs(schoolsRef);
    
    const schools: School[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      schools.push({
        id: doc.id,
        name: data.name,
        licenseKey: data.licenseKey,
        adminEmail: data.adminEmail,
        adminUid: data.adminUid,
        address: data.address || null,
        phone: data.phone || null,
        website: data.website || null,
        logoUrl: data.logoUrl || null,
        subscriptionStatus: data.subscriptionStatus || 'trial',
        subscriptionType: data.subscriptionType || 'TRIAL',
        trialStartDate: data.trialStartDate?.toDate?.().toISOString() || new Date().toISOString(),
        trialEndDate: data.trialEndDate?.toDate?.().toISOString() || new Date().toISOString(),
        isTrialActive: data.isTrialActive || false,
        daysRemaining: data.daysRemaining || 0,
        subscriptionStartDate: data.subscriptionStartDate?.toDate?.().toISOString() || null,
        subscriptionEndDate: data.subscriptionEndDate?.toDate?.().toISOString() || null,
        nextBillingDate: data.nextBillingDate?.toDate?.().toISOString() || null,
        lastPaymentDate: data.lastPaymentDate?.toDate?.().toISOString() || null,
        totalAmountPaid: data.totalAmountPaid || 0,
        paymentStatus: data.paymentStatus || 'none',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      });
    });
    
    console.log(`Fetched ${schools.length} schools from Firestore`);
    return schools;
  }  catch (error: any) {
    console.error('Error fetching schools from Firestore:', error);
    return [];
  }
}

/**
 * Retrieves a school by its ID from Firestore.
 */
export async function getSchoolById(id: string): Promise<School | null> {
  try {
    const db = getDb();
    const schoolRef = doc(db, 'schools', id);
    const schoolSnap = await getDoc(schoolRef);
    
    if (!schoolSnap.exists()) {
      console.warn(`School with ID ${id} not found in Firestore`);
      return null;
    }
    
    const data = schoolSnap.data();
    return {
      id: schoolSnap.id,
      name: data.name,
      licenseKey: data.licenseKey,
      adminEmail: data.adminEmail,
      adminUid: data.adminUid,
      address: data.address || null,
      phone: data.phone || null,
      website: data.website || null,
      logoUrl: data.logoUrl || null,
      subscriptionStatus: data.subscriptionStatus || 'trial',
      subscriptionType: data.subscriptionType || 'TRIAL',
      trialStartDate: data.trialStartDate?.toDate?.().toISOString() || new Date().toISOString(),
      trialEndDate: data.trialEndDate?.toDate?.().toISOString() || new Date().toISOString(),
      isTrialActive: data.isTrialActive || false,
      daysRemaining: data.daysRemaining || 0,
      subscriptionStartDate: data.subscriptionStartDate?.toDate?.().toISOString() || null,
      subscriptionEndDate: data.subscriptionEndDate?.toDate?.().toISOString() || null,
      nextBillingDate: data.nextBillingDate?.toDate?.().toISOString() || null,
      lastPaymentDate: data.lastPaymentDate?.toDate?.().toISOString() || null,
      totalAmountPaid: data.totalAmountPaid || 0,
      paymentStatus: data.paymentStatus || 'none',
      createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };
  } catch (error: any) {
    console.error(`Error fetching school with ID ${id} from Firestore:`, error);
    return null;
  }
}


/**
 * Updates a school's profile information in Firestore and optionally uploads a new logo to Firebase Storage.
 * Only callable by the school's admin.
 */
export async function updateSchoolProfile(
  schoolId: string,
  data: UpdateSchoolProfileData,
  logoFile: File | null,
  currentAdminUid: string
): Promise<School> {
  try {
    const db = getDb();
    
    // 1. Verify Admin Permissions (Check Firestore)
    const schoolRef = doc(db, 'schools', schoolId);
    const schoolSnap = await getDoc(schoolRef);
    
    if (!schoolSnap.exists()) {
      throw new Error('School not found in Firestore.');
    }
    
    const existingSchoolData = schoolSnap.data();
    if (existingSchoolData.adminUid !== currentAdminUid) {
      throw new Error('Permission denied: Only the assigned admin can update this school.');
    }

    const updateData: any = {};
    let needsUpdate = false;

    // Add provided fields to updateData if they exist and are defined
    if (data.hasOwnProperty('address') && data.address !== existingSchoolData.address) {
        updateData.address = data.address ?? null;
        needsUpdate = true;
    }
    if (data.hasOwnProperty('phone') && data.phone !== existingSchoolData.phone) {
         updateData.phone = data.phone ?? null;
         needsUpdate = true;
    }
    if (data.hasOwnProperty('website') && data.website !== existingSchoolData.website) {
        updateData.website = data.website ?? null;
        needsUpdate = true;
    }
    if (data.hasOwnProperty('name') && data.name !== undefined && data.name !== existingSchoolData.name) {
         updateData.name = data.name;
         needsUpdate = true;
    }

    // 2. Handle Logo Upload (if provided - Storage interaction remains)
    let newLogoUrl: string | null = existingSchoolData.logoUrl ?? null;
    if (logoFile) {
      console.log(`Uploading new logo for school ${schoolId}...`);
      const fileExtension = logoFile.name.split('.').pop();
      const logoFileName = `logo.${fileExtension}`;
      const logoStorageRef = ref(storage, `school-logos/${schoolId}/${logoFileName}`);

      // Delete previous logo if it exists
      if (existingSchoolData.logoUrl) {
        try {
          const oldLogoRef = ref(storage, existingSchoolData.logoUrl);
          await deleteObject(oldLogoRef);
          console.log(`Deleted previous logo for school ${schoolId}`);
        } catch (deleteError: any) {
          console.warn(`Could not delete previous logo (${existingSchoolData.logoUrl}): ${deleteError.message}`);
        }
      }

      // Upload the new logo
      const uploadResult = await uploadBytes(logoStorageRef, logoFile);
      newLogoUrl = await getDownloadURL(uploadResult.ref);
      updateData.logoUrl = newLogoUrl;
      needsUpdate = true;
      console.log(`Logo uploaded successfully for school ${schoolId}. URL: ${newLogoUrl}`);
    }

    // 3. Update Firestore
    if (needsUpdate) {
        updateData.updatedAt = serverTimestamp();
        await updateDoc(schoolRef, updateData);
        console.log(`School profile updated successfully in Firestore for ID: ${schoolId}`);

        // If school name or logo changed, update the admin's user profile in Firestore
        if (updateData.name || updateData.hasOwnProperty('logoUrl')) {
            const adminRef = doc(db, 'users', currentAdminUid);
            const adminSnap = await getDoc(adminRef);
            
            if (adminSnap.exists()) {
                const userUpdates: any = { updatedAt: serverTimestamp() };
                if (updateData.name) userUpdates.schoolName = updateData.name;
                if (updateData.hasOwnProperty('logoUrl')) userUpdates.schoolLogoUrl = updateData.logoUrl;
                
                await updateDoc(adminRef, userUpdates);
                console.log(`Updated admin profile for ${currentAdminUid} with new school info`);
            }
        }
    } else {
        console.log(`No changes detected for school profile ${schoolId}. Skipping Firestore update.`);
    }

    // Return the updated school
    const updatedSchool = await getSchoolById(schoolId);
    if (!updatedSchool) {
        throw new Error('Failed to retrieve updated school');
    }
    return updatedSchool;

  } catch (error: any) {
    console.error(`Error updating school profile for ID ${schoolId}:`, error);
    if (error.code?.startsWith('storage/')) {
        throw new Error(`Failed to update school logo: ${error.message}`);
    }
    throw new Error(`Failed to update school profile: ${error.message}`);
  }
}
