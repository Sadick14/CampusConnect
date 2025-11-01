/**
 * School Status Management Service
 * Handles trial expiry, school locking/unlocking, and payment confirmations
 */

import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { School } from '@/schemas/school';

const db = getDb();
const SCHOOLS_COLLECTION = 'schools';

/**
 * Check if a school's trial has expired
 */
export function isTrialExpired(school: School): boolean {
  const now = new Date();
  const trialEnd = new Date(school.trialEndDate);
  return now > trialEnd;
}

/**
 * Calculate days remaining in trial or subscription
 */
export function calculateDaysRemaining(school: School): number {
  const now = new Date();
  const endDate = school.subscriptionStatus === 'trial' 
    ? new Date(school.trialEndDate)
    : school.subscriptionEndDate 
      ? new Date(school.subscriptionEndDate) 
      : new Date(school.trialEndDate);
  
  const timeDiff = endDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return Math.max(0, daysDiff);
}

/**
 * Update school status based on trial/subscription status
 */
export async function updateSchoolStatus(schoolId: string, status: School['subscriptionStatus']): Promise<void> {
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    await updateDoc(schoolRef, {
      subscriptionStatus: status,
      updatedAt: Timestamp.now()
    });
    console.log(`School ${schoolId} status updated to: ${status}`);
  } catch (error) {
    console.error('Error updating school status:', error);
    throw new Error('Failed to update school status');
  }
}

/**
 * Lock expired schools automatically
 */
export async function lockExpiredSchools(): Promise<{ locked: number; errors: string[] }> {
  const results = { locked: 0, errors: [] as string[] };
  
  try {
    // Get all schools with active trials or expired status
    const schoolsQuery = query(
      collection(db, SCHOOLS_COLLECTION),
      where('subscriptionStatus', 'in', ['trial', 'expired'])
    );
    
    const querySnapshot = await getDocs(schoolsQuery);
    
    for (const docSnap of querySnapshot.docs) {
      try {
        const schoolData = docSnap.data();
        const school: School = {
          id: docSnap.id,
          ...schoolData,
          trialStartDate: schoolData.trialStartDate.toDate().toISOString(),
          trialEndDate: schoolData.trialEndDate.toDate().toISOString(),
          createdAt: schoolData.createdAt.toDate().toISOString(),
          updatedAt: schoolData.updatedAt.toDate().toISOString(),
        } as School;
        
        if (isTrialExpired(school) && school.subscriptionStatus !== 'locked') {
          await updateSchoolStatus(school.id, 'locked');
          results.locked++;
          console.log(`Locked expired school: ${school.name} (${school.id})`);
        }
      } catch (error) {
        const errorMsg = `Failed to process school ${docSnap.id}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in lockExpiredSchools:', error);
    throw new Error('Failed to lock expired schools');
  }
}

/**
 * Unlock school after payment confirmation
 */
export async function unlockSchoolAfterPayment(
  schoolId: string, 
  subscriptionType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
  paymentAmount: number
): Promise<void> {
  try {
    const now = new Date();
    let subscriptionEndDate: Date;
    let nextBillingDate: Date;
    
    // Calculate subscription period based on type
    switch (subscriptionType) {
      case 'MONTHLY':
        subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        nextBillingDate = new Date(subscriptionEndDate);
        break;
      case 'QUARTERLY':
        subscriptionEndDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        nextBillingDate = new Date(subscriptionEndDate);
        break;
      case 'ANNUAL':
        subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        nextBillingDate = new Date(subscriptionEndDate);
        break;
      default:
        throw new Error('Invalid subscription type');
    }
    
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    await updateDoc(schoolRef, {
      subscriptionStatus: 'active',
      subscriptionType: subscriptionType,
      subscriptionStartDate: Timestamp.fromDate(now),
      subscriptionEndDate: Timestamp.fromDate(subscriptionEndDate),
      nextBillingDate: Timestamp.fromDate(nextBillingDate),
      lastPaymentDate: Timestamp.fromDate(now),
      paymentStatus: 'approved',
      totalAmountPaid: paymentAmount,
      isTrialActive: false,
      daysRemaining: calculateDaysRemaining({
        subscriptionStatus: 'active',
        subscriptionEndDate: subscriptionEndDate.toISOString()
      } as School),
      updatedAt: Timestamp.now()
    });
    
    console.log(`School ${schoolId} unlocked with ${subscriptionType} subscription`);
  } catch (error) {
    console.error('Error unlocking school:', error);
    throw new Error('Failed to unlock school after payment');
  }
}

/**
 * Set school to pending payment status
 */
export async function setSchoolPendingPayment(schoolId: string): Promise<void> {
  try {
    await updateSchoolStatus(schoolId, 'pending_payment');
    
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    await updateDoc(schoolRef, {
      paymentStatus: 'pending'
    });
    
    console.log(`School ${schoolId} set to pending payment`);
  } catch (error) {
    console.error('Error setting school to pending payment:', error);
    throw new Error('Failed to set school to pending payment');
  }
}

/**
 * Get all schools that need attention (expired, locked, pending payment)
 */
export async function getSchoolsNeedingAttention(): Promise<{
  expired: School[];
  locked: School[];
  pendingPayment: School[];
}> {
  try {
    const schoolsQuery = query(
      collection(db, SCHOOLS_COLLECTION),
      where('subscriptionStatus', 'in', ['expired', 'locked', 'pending_payment'])
    );
    
    const querySnapshot = await getDocs(schoolsQuery);
    const expired: School[] = [];
    const locked: School[] = [];
    const pendingPayment: School[] = [];
    
    querySnapshot.docs.forEach(doc => {
      const schoolData = doc.data();
      const school: School = {
        id: doc.id,
        ...schoolData,
        trialStartDate: schoolData.trialStartDate.toDate().toISOString(),
        trialEndDate: schoolData.trialEndDate.toDate().toISOString(),
        createdAt: schoolData.createdAt.toDate().toISOString(),
        updatedAt: schoolData.updatedAt.toDate().toISOString(),
        subscriptionStartDate: schoolData.subscriptionStartDate?.toDate().toISOString() || null,
        subscriptionEndDate: schoolData.subscriptionEndDate?.toDate().toISOString() || null,
        nextBillingDate: schoolData.nextBillingDate?.toDate().toISOString() || null,
        lastPaymentDate: schoolData.lastPaymentDate?.toDate().toISOString() || null,
      } as School;
      
      switch (school.subscriptionStatus) {
        case 'expired':
          expired.push(school);
          break;
        case 'locked':
          locked.push(school);
          break;
        case 'pending_payment':
          pendingPayment.push(school);
          break;
      }
    });
    
    return { expired, locked, pendingPayment };
  } catch (error) {
    console.error('Error getting schools needing attention:', error);
    throw new Error('Failed to get schools needing attention');
  }
}

/**
 * Check if school access should be blocked
 */
export function isSchoolAccessBlocked(school: School): boolean {
  return ['locked', 'suspended'].includes(school.subscriptionStatus);
}

/**
 * Get payment instructions for a locked school
 */
export function getPaymentInstructions(school: School): {
  message: string;
  plans: Array<{
    type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
    price: number;
    currency: string;
    savings?: string;
  }>;
} {
  return {
    message: `Your ${school.name} account has been locked because your 14-day trial has expired. Choose a payment plan below to reactivate your account immediately.`,
    plans: [
      {
        type: 'MONTHLY',
        price: 50,
        currency: 'GHS'
      },
      {
        type: 'QUARTERLY', 
        price: 135,
        currency: 'GHS',
        savings: 'Save GHS 15'
      },
      {
        type: 'ANNUAL',
        price: 480,
        currency: 'GHS',
        savings: 'Save GHS 120'
      }
    ]
  };
}