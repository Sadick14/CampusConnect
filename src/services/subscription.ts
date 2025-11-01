import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { 
  Subscription, 
  PaymentRecord,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanType,
  calculateTrialExpiry,
  calculateNextBillingDate,
  calculateMonthlyFee,
  getPlanPricing,
  getDaysRemaining,
  isExpired,
  SubscriptionStatus
} from '@/schemas/subscription';

// Export types for use in components
export type { Subscription, PaymentRecord };

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const PAYMENTS_COLLECTION = 'payments';
const SCHOOLS_COLLECTION = 'schools';

const db = getDb();

/**
 * Initialize trial subscription for a new school
 */
export async function initializeTrialSubscription(schoolId: string, schoolName: string): Promise<void> {
  try {
    const now = new Date();
    const trialEndDate = calculateTrialExpiry(now);
    
    const subscriptionData: Partial<Subscription> = {
      schoolId,
      schoolName,
      
      // Trial Information
      trialStartDate: now.toISOString(),
      trialEndDate: trialEndDate.toISOString(),
      isTrialActive: true,
      trialDaysRemaining: SUBSCRIPTION_PLANS.TRIAL.duration,
      
      // Subscription Information
      subscriptionType: 'TRIAL',
      subscriptionStatus: 'trial',
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      
      // Student Count
      currentStudentCount: 0,
      lastStudentCountUpdate: null,
      
      // Billing Information
      upfrontFeePaid: false,
      upfrontFeeAmount: 0,
      upfrontFeePaidAt: null,
      nextBillingDate: null,
      lastPaymentDate: null,
      totalAmountPaid: 0,
      monthlyFeeAmount: 0,
      
      // Current Payment
      currentPaymentStatus: 'none',
      currentPaymentAmount: null,
      currentPaymentMethod: null,
      currentPaymentReference: null,
      currentPaymentProof: null,
      currentPaymentSubmittedAt: null,
      currentPaymentNotes: null,
      
      // Approval Information
      approvedBy: null,
      approvedAt: null,
      approvalNotes: null,
      rejectionReason: null,
      
      // Auto-lock settings
      autoLockEnabled: true,
      gracePeriodDays: 0,
      
      // Timestamps
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    
    // Save to subscriptions collection
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, schoolId);
    await setDoc(subscriptionRef, subscriptionData);
    
    // Update school document with subscription fields
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    await updateDoc(schoolRef, {
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
      updatedAt: Timestamp.now(),
    });
    
    console.log(`Trial subscription initialized for school: ${schoolId}`);
  } catch (error) {
    console.error('Error initializing trial subscription:', error);
    throw new Error('Failed to initialize trial subscription');
  }
}

/**
 * Get subscription details for a school
 */
export async function getSubscription(schoolId: string): Promise<Subscription | null> {
  try {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, schoolId);
    const subscriptionSnap = await getDoc(subscriptionRef);
    
    if (!subscriptionSnap.exists()) {
      return null;
    }
    
    const data = subscriptionSnap.data();
    return {
      id: subscriptionSnap.id,
      ...data,
    } as Subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw new Error('Failed to get subscription');
  }
}

/**
 * Update subscription status (check expiry and lock if needed)
 */
export async function updateSubscriptionStatus(schoolId: string): Promise<void> {
  try {
    const subscription = await getSubscription(schoolId);
    
    if (!subscription) {
      console.warn(`No subscription found for school: ${schoolId}`);
      return;
    }
    
    const now = new Date();
    let newStatus = subscription.subscriptionStatus;
    let daysRemaining = 0;
    
    // Check trial status
    if (subscription.isTrialActive) {
      const trialEnd = new Date(subscription.trialEndDate);
      daysRemaining = getDaysRemaining(trialEnd);
      
      if (isExpired(trialEnd)) {
        newStatus = subscription.autoLockEnabled ? 'locked' : 'expired';
        daysRemaining = 0;
      }
    }
    
    // Check paid subscription status
    if (subscription.subscriptionStatus === 'active' && subscription.subscriptionEndDate) {
      const subEnd = new Date(subscription.subscriptionEndDate);
      daysRemaining = getDaysRemaining(subEnd);
      
      if (isExpired(subEnd)) {
        newStatus = subscription.autoLockEnabled ? 'locked' : 'expired';
        daysRemaining = 0;
      }
    }
    
    // Update if status changed
    if (newStatus !== subscription.subscriptionStatus) {
      const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, schoolId);
      await updateDoc(subscriptionRef, {
        subscriptionStatus: newStatus,
        trialDaysRemaining: daysRemaining,
        updatedAt: now.toISOString(),
      });
      
      // Update school document
      const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
      await updateDoc(schoolRef, {
        subscriptionStatus: newStatus,
        daysRemaining,
        updatedAt: Timestamp.now(),
      });
      
      console.log(`Subscription status updated for school ${schoolId}: ${newStatus}`);
    }
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw new Error('Failed to update subscription status');
  }
}

/**
 * Check if school has active subscription (not locked/expired)
 */
export async function hasActiveSubscription(schoolId: string): Promise<boolean> {
  try {
    await updateSubscriptionStatus(schoolId); // Update status first
    
    const subscription = await getSubscription(schoolId);
    
    if (!subscription) {
      return false;
    }
    
    return ['trial', 'active', 'pending_payment'].includes(subscription.subscriptionStatus);
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Submit payment for subscription (upfront or monthly)
 */
export async function submitPayment(
  schoolId: string,
  schoolName: string,
  planType: Exclude<SubscriptionPlanType, 'TRIAL'>,
  paymentType: 'upfront' | 'monthly',
  studentCount: number,
  paymentMethod: string,
  paymentReference: string,
  paymentProof?: string,
  notes?: string
): Promise<string> {
  try {
    const now = new Date();
    const plan = SUBSCRIPTION_PLANS[planType];
    
    // Calculate amount based on payment type
    let amount: number;
    if (paymentType === 'upfront') {
      amount = plan.upfrontFee;
    } else {
      amount = calculateMonthlyFee(studentCount, planType);
    }
    
    // Create payment record
    const paymentData: Partial<PaymentRecord> = {
      schoolId,
      schoolName,
      amount,
      paymentType,
      subscriptionType: planType,
      studentCount: paymentType === 'monthly' ? studentCount : undefined,
      paymentMethod: paymentMethod as any,
      paymentReference,
      paymentProof: paymentProof || null,
      notes: notes || null,
      status: 'pending',
      reviewedBy: null,
      reviewedByName: null,
      reviewedAt: null,
      reviewNotes: null,
      rejectionReason: null,
      billingStartDate: now.toISOString(),
      billingEndDate: calculateNextBillingDate(now).toISOString(),
      submittedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    
    const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
    await setDoc(paymentRef, paymentData);
    
    // Update subscription with pending payment
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, schoolId);
    await updateDoc(subscriptionRef, {
      subscriptionStatus: 'pending_payment',
      currentPaymentStatus: 'pending',
      currentPaymentAmount: amount,
      currentPaymentMethod: paymentMethod,
      currentPaymentReference: paymentReference,
      currentPaymentProof: paymentProof || null,
      currentPaymentSubmittedAt: now.toISOString(),
      currentPaymentNotes: notes || null,
      currentStudentCount: studentCount,
      monthlyFeeAmount: paymentType === 'monthly' ? amount : 0,
      updatedAt: now.toISOString(),
    });
    
    // Update school document
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    await updateDoc(schoolRef, {
      subscriptionStatus: 'pending_payment',
      paymentStatus: 'pending',
      updatedAt: Timestamp.now(),
    });
    
    console.log(`Payment submitted for school ${schoolId}: ${paymentRef.id}`);
    return paymentRef.id;
  } catch (error) {
    console.error('Error submitting payment:', error);
    throw new Error('Failed to submit payment');
  }
}

/**
 * Approve payment (Superadmin only)
 */
export async function approvePayment(
  paymentId: string,
  approvedBy: string,
  approvedByName: string,
  notes?: string
): Promise<void> {
  try {
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    const paymentSnap = await getDoc(paymentRef);
    
    if (!paymentSnap.exists()) {
      throw new Error('Payment not found');
    }
    
    const payment = paymentSnap.data() as PaymentRecord;
    const now = new Date();
    
    // Update payment record
    await updateDoc(paymentRef, {
      status: 'approved',
      reviewedBy: approvedBy,
      reviewedByName: approvedByName,
      reviewedAt: now.toISOString(),
      reviewNotes: notes || null,
      updatedAt: now.toISOString(),
    });
    
    // Calculate subscription dates
    const billingStart = new Date(payment.billingStartDate);
    const billingEnd = new Date(payment.billingEndDate);
    
    // Get current subscription
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, payment.schoolId);
    const subscription = await getSubscription(payment.schoolId);
    
    // Build update object based on payment type
    const updateData: any = {
      subscriptionStatus: 'active',
      subscriptionType: payment.subscriptionType,
      isTrialActive: false,
      currentPaymentStatus: 'approved',
      approvedBy,
      approvedAt: now.toISOString(),
      approvalNotes: notes || null,
      updatedAt: now.toISOString(),
    };
    
    if (payment.paymentType === 'upfront') {
      // Upfront fee payment
      updateData.upfrontFeePaid = true;
      updateData.upfrontFeeAmount = payment.amount;
      updateData.upfrontFeePaidAt = now.toISOString();
      updateData.subscriptionStartDate = billingStart.toISOString();
      updateData.nextBillingDate = billingEnd.toISOString();
      updateData.totalAmountPaid = (subscription?.totalAmountPaid || 0) + payment.amount;
    } else {
      // Monthly payment
      updateData.lastPaymentDate = now.toISOString();
      updateData.currentStudentCount = payment.studentCount || 0;
      updateData.monthlyFeeAmount = payment.amount;
      updateData.nextBillingDate = billingEnd.toISOString();
      updateData.totalAmountPaid = (subscription?.totalAmountPaid || 0) + payment.amount;
      updateData.lastStudentCountUpdate = now.toISOString();
    }
    
    await updateDoc(subscriptionRef, updateData);
    
    // Update school document
    const schoolRef = doc(db, SCHOOLS_COLLECTION, payment.schoolId);
    await updateDoc(schoolRef, {
      subscriptionStatus: 'active',
      subscriptionType: payment.subscriptionType,
      isTrialActive: false,
      subscriptionStartDate: payment.paymentType === 'upfront' ? Timestamp.fromDate(billingStart) : undefined,
      nextBillingDate: Timestamp.fromDate(billingEnd),
      lastPaymentDate: Timestamp.fromDate(now),
      totalAmountPaid: (subscription?.totalAmountPaid || 0) + payment.amount,
      paymentStatus: 'approved',
      daysRemaining: getDaysRemaining(billingEnd),
      updatedAt: Timestamp.now(),
    });
    
    console.log(`Payment approved for school ${payment.schoolId} (${payment.paymentType})`);
  } catch (error) {
    console.error('Error approving payment:', error);
    throw new Error('Failed to approve payment');
  }
}

/**
 * Reject payment (Superadmin only)
 */
export async function rejectPayment(
  paymentId: string,
  rejectedBy: string,
  rejectedByName: string,
  reason: string
): Promise<void> {
  try {
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    const paymentSnap = await getDoc(paymentRef);
    
    if (!paymentSnap.exists()) {
      throw new Error('Payment not found');
    }
    
    const payment = paymentSnap.data() as PaymentRecord;
    const now = new Date();
    
    // Update payment record
    await updateDoc(paymentRef, {
      status: 'rejected',
      reviewedBy: rejectedBy,
      reviewedByName: rejectedByName,
      reviewedAt: now.toISOString(),
      rejectionReason: reason,
      updatedAt: now.toISOString(),
    });
    
    // Update subscription
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, payment.schoolId);
    await updateDoc(subscriptionRef, {
      subscriptionStatus: 'locked',
      currentPaymentStatus: 'rejected',
      rejectionReason: reason,
      updatedAt: now.toISOString(),
    });
    
    // Update school document
    const schoolRef = doc(db, SCHOOLS_COLLECTION, payment.schoolId);
    await updateDoc(schoolRef, {
      subscriptionStatus: 'locked',
      paymentStatus: 'rejected',
      updatedAt: Timestamp.now(),
    });
    
    console.log(`Payment rejected for school ${payment.schoolId}`);
  } catch (error) {
    console.error('Error rejecting payment:', error);
    throw new Error('Failed to reject payment');
  }
}

/**
 * Get all pending payments (Superadmin only)
 */
export async function getPendingPayments(): Promise<PaymentRecord[]> {
  try {
    console.log('Fetching pending payments from collection:', PAYMENTS_COLLECTION);
    
    const paymentsQuery = query(
      collection(db, PAYMENTS_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc')
    );
    
    console.log('Executing payments query...');
    const querySnapshot = await getDocs(paymentsQuery);
    console.log('Query successful. Documents found:', querySnapshot.size);
    
    const payments: PaymentRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data(),
      } as PaymentRecord);
    });
    
    console.log('Processed payments:', payments.length);
    return payments;
  } catch (error: any) {
    console.error('Error getting pending payments:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied: Unable to access pending payments. Please check your super admin privileges.');
    }
    
    throw new Error(`Failed to get pending payments: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Get payment history for a school
 */
export async function getSchoolPayments(schoolId: string): Promise<PaymentRecord[]> {
  try {
    const paymentsQuery = query(
      collection(db, PAYMENTS_COLLECTION),
      where('schoolId', '==', schoolId),
      orderBy('submittedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(paymentsQuery);
    const payments: PaymentRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data(),
      } as PaymentRecord);
    });
    
    return payments;
  } catch (error) {
    console.error('Error getting school payments:', error);
    throw new Error('Failed to get school payments');
  }
}

/**
 * Manually lock a school account (Superadmin only)
 */
export async function lockSchoolAccount(schoolId: string): Promise<void> {
  try {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, schoolId);
    await updateDoc(subscriptionRef, {
      subscriptionStatus: 'locked',
      updatedAt: new Date().toISOString(),
    });
    
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    await updateDoc(schoolRef, {
      subscriptionStatus: 'locked',
      updatedAt: Timestamp.now(),
    });
    
    console.log(`School account locked: ${schoolId}`);
  } catch (error) {
    console.error('Error locking school account:', error);
    throw new Error('Failed to lock school account');
  }
}

/**
 * Manually unlock a school account (Superadmin only)
 */
export async function unlockSchoolAccount(schoolId: string): Promise<void> {
  try {
    const subscription = await getSubscription(schoolId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    // Determine appropriate status based on subscription state
    let newStatus: string = 'active';
    
    if (subscription.isTrialActive) {
      const trialEnd = new Date(subscription.trialEndDate);
      newStatus = isExpired(trialEnd) ? 'expired' : 'trial';
    } else if (subscription.subscriptionEndDate) {
      const subEnd = new Date(subscription.subscriptionEndDate);
      newStatus = isExpired(subEnd) ? 'expired' : 'active';
    }
    
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, schoolId);
    await updateDoc(subscriptionRef, {
      subscriptionStatus: newStatus,
      updatedAt: new Date().toISOString(),
    });
    
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    await updateDoc(schoolRef, {
      subscriptionStatus: newStatus,
      updatedAt: Timestamp.now(),
    });
    
    console.log(`School account unlocked: ${schoolId}`);
  } catch (error) {
    console.error('Error unlocking school account:', error);
    throw new Error('Failed to unlock school account');
  }
}

/**
 * Update student count and recalculate monthly fee
 */
export async function updateStudentCount(schoolId: string, studentCount: number): Promise<void> {
  try {
    const subscription = await getSubscription(schoolId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    if (subscription.subscriptionType === 'TRIAL') {
      // Don't update billing for trial
      return;
    }
    
    const monthlyFee = calculateMonthlyFee(studentCount, subscription.subscriptionType as Exclude<SubscriptionPlanType, 'TRIAL'>);
    
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, schoolId);
    await updateDoc(subscriptionRef, {
      currentStudentCount: studentCount,
      monthlyFeeAmount: monthlyFee,
      lastStudentCountUpdate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    console.log(`Student count updated for school ${schoolId}: ${studentCount} students, GHS ${monthlyFee}/month`);
  } catch (error) {
    console.error('Error updating student count:', error);
    throw new Error('Failed to update student count');
  }
}

/**
 * Get current pricing for a school
 */
export async function getSchoolPricing(schoolId: string): Promise<{
  planType: SubscriptionPlanType;
  studentCount: number;
  upfrontFee: number;
  monthlyFee: number;
  perStudentFee: number;
  upfrontFeePaid: boolean;
  nextBillingAmount: number;
  nextBillingDate: string | null;
}> {
  const subscription = await getSubscription(schoolId);
  
  if (!subscription) {
    throw new Error('Subscription not found');
  }
  
  const pricing = getPlanPricing(subscription.subscriptionType, subscription.currentStudentCount);
  
  return {
    planType: subscription.subscriptionType,
    studentCount: subscription.currentStudentCount,
    upfrontFee: pricing.upfrontFee,
    monthlyFee: pricing.monthlyFee,
    perStudentFee: pricing.perStudent,
    upfrontFeePaid: subscription.upfrontFeePaid || false,
    nextBillingAmount: subscription.monthlyFeeAmount,
    nextBillingDate: subscription.nextBillingDate 
      ? (typeof subscription.nextBillingDate === 'string' ? subscription.nextBillingDate : subscription.nextBillingDate.toISOString())
      : null,
  };
}
