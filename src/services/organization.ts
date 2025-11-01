
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Organization, OrganizationFirestoreDoc, NewOrganizationData } from '@/schemas/organization';
import { SUBSCRIPTION_PLANS } from '@/schemas/subscription';

const ORGANIZATIONS_COLLECTION = 'organizations';

/**
 * Generate a unique license key for the organization
 */
function generateLicenseKey(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `CC-${timestamp}-${randomPart}`.toUpperCase();
}

/**
 * Calculate trial dates (14 days from creation)
 */
function calculateTrialDates(createdAt: Date) {
  const trialStart = createdAt;
  const trialEnd = new Date(createdAt);
  trialEnd.setDate(trialEnd.getDate() + (SUBSCRIPTION_PLANS.TRIAL.duration || 14));

  return {
    trialStartDate: Timestamp.fromDate(trialStart),
    trialEndDate: Timestamp.fromDate(trialEnd),
  };
}

/**
 * Check if user already has organizations (to determine trial eligibility)
 */
async function userHasExistingOrganizations(userId: string): Promise<boolean> {
  try {
    const q = query(
      collection(getDb(), ORGANIZATIONS_COLLECTION),
      where('ownerId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking existing organizations:', error);
    return false;
  }
}

/**
 * Calculate days remaining in trial or subscription
 */
function calculateDaysRemaining(endDate: Timestamp): number {
  const now = new Date();
  const end = endDate.toDate();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Convert Firestore document to Organization interface
 */
function firestoreToOrganization(id: string, data: OrganizationFirestoreDoc): Organization {
  return {
    id,
    name: data.name,
    type: data.type,
    description: data.description,
    licenseKey: data.licenseKey,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
    ownerId: data.ownerId,
    ownerEmail: data.ownerEmail,
    address: data.address,
    phone: data.phone,
    website: data.website,
    logoUrl: data.logoUrl,
    subscriptionStatus: data.subscriptionStatus,
    subscriptionType: data.subscriptionType,
    trialStartDate: data.trialStartDate.toDate().toISOString(),
    trialEndDate: data.trialEndDate.toDate().toISOString(),
    isTrialActive: data.isTrialActive,
    daysRemaining: data.daysRemaining,
    subscriptionStartDate: data.subscriptionStartDate?.toDate().toISOString() || null,
    subscriptionEndDate: data.subscriptionEndDate?.toDate().toISOString() || null,
    nextBillingDate: data.nextBillingDate?.toDate().toISOString() || null,
    lastPaymentDate: data.lastPaymentDate?.toDate().toISOString() || null,
    totalAmountPaid: data.totalAmountPaid,
    paymentStatus: data.paymentStatus,
    memberIds: data.memberIds,
    memberCount: data.memberCount,
  };
}

/**
 * Create a new organization
 */
export async function createOrganization(
  organizationData: NewOrganizationData,
  ownerId: string,
  ownerEmail: string
): Promise<Organization> {
  try {
    const now = new Date();
    
    // Check if user already has organizations
    const hasExistingOrgs = await userHasExistingOrganizations(ownerId);
    
    let subscriptionStatus: Organization['subscriptionStatus'];
    let subscriptionType: Organization['subscriptionType'];
    let isTrialActive: boolean;
    let daysRemaining: number;
    let trialStartDate: Timestamp;
    let trialEndDate: Timestamp;
    
    if (hasExistingOrgs) {
      // Subsequent organizations need payment - no trial
      subscriptionStatus = 'pending_payment';
      subscriptionType = 'BASIC'; // Default to BASIC plan
      isTrialActive = false;
      daysRemaining = 0;
      trialStartDate = Timestamp.fromDate(now);
      trialEndDate = Timestamp.fromDate(now); // No trial period
    } else {
      // First organization gets 14-day trial
      const trialDates = calculateTrialDates(now);
      subscriptionStatus = 'trial';
      subscriptionType = 'TRIAL';
      isTrialActive = true;
      daysRemaining = SUBSCRIPTION_PLANS.TRIAL.duration;
      trialStartDate = trialDates.trialStartDate;
      trialEndDate = trialDates.trialEndDate;
    }
    
    const orgDoc: Omit<OrganizationFirestoreDoc, 'createdAt' | 'updatedAt'> = {
      name: organizationData.name,
      type: organizationData.type,
      description: organizationData.description,
      licenseKey: generateLicenseKey(),
      ownerId,
      ownerEmail,
      address: null,
      phone: null,
      website: null,
      logoUrl: null,
      
      // Subscription & Billing
      subscriptionStatus,
      subscriptionType,
      isTrialActive,
      daysRemaining,
      trialStartDate,
      trialEndDate,
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      nextBillingDate: null,
      lastPaymentDate: null,
      totalAmountPaid: 0,
      paymentStatus: hasExistingOrgs ? 'pending' : 'none',

      // Access Control
      memberIds: [ownerId],
      memberCount: 1,
    };

    const docRef = await addDoc(collection(getDb(), ORGANIZATIONS_COLLECTION), {
      ...orgDoc,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    // Return the created organization
    const createdDoc = await getDoc(docRef);
    if (!createdDoc.exists()) {
      throw new Error('Failed to retrieve created organization');
    }

    return firestoreToOrganization(docRef.id, createdDoc.data() as OrganizationFirestoreDoc);
  } catch (error) {
    console.error('Error creating organization:', error);
    throw new Error('Failed to create organization');
  }
}

/**
 * Get all organizations owned by a user
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    const q = query(
      collection(getDb(), ORGANIZATIONS_COLLECTION),
      where('ownerId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const organizations: Organization[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as OrganizationFirestoreDoc;
      organizations.push(firestoreToOrganization(doc.id, data));
    });

    // Sort by creation date in JavaScript (newest first)
    return organizations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    throw new Error('Failed to fetch organizations');
  }
}

/**
 * Get organizations where user is a member
 */
export async function getUserMemberOrganizations(userId: string): Promise<Organization[]> {
  try {
    const q = query(
      collection(getDb(), ORGANIZATIONS_COLLECTION),
      where('memberIds', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);
    const organizations: Organization[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as OrganizationFirestoreDoc;
      organizations.push(firestoreToOrganization(doc.id, data));
    });

    // Sort by creation date in JavaScript (newest first)
    return organizations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching member organizations:', error);
    throw new Error('Failed to fetch member organizations');
  }
}

/**
 * Get a specific organization by ID
 */
export async function getOrganizationById(organizationId: string): Promise<Organization | null> {
  try {
    const docRef = doc(getDb(), ORGANIZATIONS_COLLECTION, organizationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as OrganizationFirestoreDoc;
    return firestoreToOrganization(organizationId, data);
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw new Error('Failed to fetch organization');
  }
}

/**
 * Update organization profile
 */
export async function updateOrganizationProfile(
  organizationId: string, 
  updates: Partial<Pick<Organization, 'name' | 'type' | 'description' | 'address' | 'phone' | 'website'>>
): Promise<void> {
  try {
    const docRef = doc(getDb(), ORGANIZATIONS_COLLECTION, organizationId);
    
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    throw new Error('Failed to update organization');
  }
}

/**
 * Add a member to an organization
 */
export async function addOrganizationMember(organizationId: string, userId: string): Promise<void> {
  try {
    const orgRef = doc(getDb(), ORGANIZATIONS_COLLECTION, organizationId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }

    const orgData = orgDoc.data() as OrganizationFirestoreDoc;
    
    if (!orgData.memberIds.includes(userId)) {
      await updateDoc(orgRef, {
        memberIds: [...orgData.memberIds, userId],
        memberCount: orgData.memberCount + 1,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error adding organization member:', error);
    throw new Error('Failed to add member to organization');
  }
}

/**
 * Remove a member from an organization
 */
export async function removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
  try {
    const orgRef = doc(getDb(), ORGANIZATIONS_COLLECTION, organizationId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }

    const orgData = orgDoc.data() as OrganizationFirestoreDoc;
    
    if (orgData.ownerId === userId) {
      throw new Error('Cannot remove organization owner');
    }

    const updatedMemberIds = orgData.memberIds.filter(id => id !== userId);
    
    await updateDoc(orgRef, {
      memberIds: updatedMemberIds,
      memberCount: updatedMemberIds.length,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error removing organization member:', error);
    throw new Error('Failed to remove member from organization');
  }
}

/**
 * Update organization subscription status (for payment processing)
 */
export async function updateOrganizationSubscription(
  organizationId: string,
  subscriptionData: {
    subscriptionStatus: Organization['subscriptionStatus'];
    subscriptionType?: Organization['subscriptionType'];
    paymentStatus?: Organization['paymentStatus'];
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    nextBillingDate?: string;
    lastPaymentDate?: string;
    totalAmountPaid?: number;
  }
): Promise<void> {
  try {
    const docRef = doc(getDb(), ORGANIZATIONS_COLLECTION, organizationId);
    
    const updateData: any = {
      subscriptionStatus: subscriptionData.subscriptionStatus,
      updatedAt: Timestamp.now(),
    };

    if (subscriptionData.subscriptionType) {
      updateData.subscriptionType = subscriptionData.subscriptionType;
    }
    if (subscriptionData.paymentStatus) {
      updateData.paymentStatus = subscriptionData.paymentStatus;
    }
    if (subscriptionData.subscriptionStartDate) {
      updateData.subscriptionStartDate = Timestamp.fromDate(new Date(subscriptionData.subscriptionStartDate));
    }
    if (subscriptionData.subscriptionEndDate) {
      updateData.subscriptionEndDate = Timestamp.fromDate(new Date(subscriptionData.subscriptionEndDate));
    }
    if (subscriptionData.nextBillingDate) {
      updateData.nextBillingDate = Timestamp.fromDate(new Date(subscriptionData.nextBillingDate));
    }
    if (subscriptionData.lastPaymentDate) {
      updateData.lastPaymentDate = Timestamp.fromDate(new Date(subscriptionData.lastPaymentDate));
    }
    if (subscriptionData.totalAmountPaid !== undefined) {
      updateData.totalAmountPaid = subscriptionData.totalAmountPaid;
    }

    // If subscription is active, mark trial as inactive
    if (subscriptionData.subscriptionStatus === 'active') {
      updateData.isTrialActive = false;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating organization subscription:', error);
    throw new Error('Failed to update organization subscription');
  }
}

/**
 * Update days remaining for all organizations (for scheduled tasks)
 */
export async function updateOrganizationsDaysRemaining(): Promise<void> {
  try {
    const q = query(
      collection(getDb(), ORGANIZATIONS_COLLECTION),
      where('subscriptionStatus', 'in', ['trial', 'active'])
    );

    const snapshot = await getDocs(q);

    const batch = snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data() as OrganizationFirestoreDoc;
      
      let daysRemaining = 0;
      if (data.isTrialActive) {
        daysRemaining = calculateDaysRemaining(data.trialEndDate);
      } else if (data.subscriptionEndDate) {
        daysRemaining = calculateDaysRemaining(data.subscriptionEndDate);
      }

      // Update organization with new days remaining
      await updateDoc(doc(getDb(), ORGANIZATIONS_COLLECTION, docSnap.id), {
        daysRemaining,
        updatedAt: Timestamp.now(),
      });

      // Lock organization if trial/subscription expired
      if (daysRemaining === 0) {
        await updateDoc(doc(getDb(), ORGANIZATIONS_COLLECTION, docSnap.id), {
          subscriptionStatus: 'expired',
          isTrialActive: false,
          updatedAt: Timestamp.now(),
        });
      }
    });

    await Promise.all(batch);
  } catch (error) {
    console.error('Error updating organizations days remaining:', error);
    throw new Error('Failed to update organizations days remaining');
  }
}

/**
 * Delete an organization (only by owner)
 */
export async function deleteOrganization(organizationId: string, userId: string): Promise<void> {
  try {
    const orgRef = doc(getDb(), ORGANIZATIONS_COLLECTION, organizationId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }

    const orgData = orgDoc.data() as OrganizationFirestoreDoc;
    
    if (orgData.ownerId !== userId) {
      throw new Error('Only organization owner can delete the organization');
    }

    await deleteDoc(orgRef);
  } catch (error) {
    console.error('Error deleting organization:', error);
    throw new Error('Failed to delete organization');
  }
}
