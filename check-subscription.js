const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function checkSubscription() {
  try {
    const orgId = '6uxRp8N6NWAgrRWPYUHU';
    
    console.log('Checking subscription for organization:', orgId);
    
    const subDoc = await db.collection('subscriptions').doc(orgId).get();
    
    if (!subDoc.exists) {
      console.log('❌ NO SUBSCRIPTION FOUND!');
      console.log('\nCreating trial subscription...');
      
      // Get org name from organizations collection
      const orgDoc = await db.collection('organizations').doc(orgId).get();
      const orgName = orgDoc.exists ? orgDoc.data().name : 'Unknown School';
      
      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + 30);
      
      const subscriptionData = {
        organizationId: orgId,
        schoolName: orgName,
        
        // Trial Information
        trialStartDate: now.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        isTrialActive: true,
        trialDaysRemaining: 30,
        
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
      
      await db.collection('subscriptions').doc(orgId).set(subscriptionData);
      console.log('✅ Trial subscription created!');
      console.log('Trial expires:', trialEndDate.toISOString());
    } else {
      console.log('✅ Subscription found!');
      const data = subDoc.data();
      console.log('\nSubscription Details:');
      console.log('Status:', data.subscriptionStatus);
      console.log('Type:', data.subscriptionType);
      console.log('Trial Active:', data.isTrialActive);
      console.log('Trial Days Remaining:', data.trialDaysRemaining);
      console.log('Trial End Date:', data.trialEndDate);
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkSubscription();
