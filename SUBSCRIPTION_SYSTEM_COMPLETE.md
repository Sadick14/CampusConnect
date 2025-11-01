# 🎯 Subscription & Payment System - Complete Guide

## 📋 Overview

CampusConnect is now a **full SaaS platform** with a comprehensive subscription and payment management system. Schools start with a **10-day free trial** and must subscribe to continue using the platform after the trial expires.

### 💰 Pricing (Ghana Cedis - GHS)

| Plan | Price | Duration | Savings |
|------|-------|----------|---------|
| **Free Trial** | GHS 0 | 10 days | - |
| **Monthly** | GHS 150 | 30 days | - |
| **Quarterly** | GHS 400 | 90 days | Save GHS 50 (11%) |
| **Annual** | GHS 1,500 | 365 days | Save GHS 300 (17%) |

---

## 🚀 How It Works

### For New Schools

1. **Registration** → Superadmin or new user registers a school
2. **Auto-Trial Start** → 10-day free trial begins automatically
3. **Full Access** → School gets complete access to all features
4. **Trial Expiry Warning** → Banners appear when <3 days remaining
5. **Trial Expires** → Account is locked after 10 days
6. **Payment Required** → School admin must submit payment to unlock

### Trial Timeline

```
Day 1-7:  ✅ Full access, no warnings
Day 8-9:  ⚠️ Warning banners ("Trial expiring soon")
Day 10:   🔴 Last day - urgent warnings
Day 11+:  🔒 Account locked - payment required
```

---

## 🔐 Account States

### 1. **Trial** (Active Trial)
- ✅ Full platform access
- ⏰ Trial countdown visible
- ⚠️ Warnings when <3 days left

### 2. **Active** (Paid Subscription)
- ✅ Full platform access
- 💚 Active subscription badge
- 📅 Next billing date shown

### 3. **Pending Payment**
- ✅ Full platform access (grace period)
- 💙 "Payment under review" banner
- ⏳ Waiting for superadmin approval

### 4. **Locked** (Trial/Subscription Expired)
- 🔒 Dashboard blocked
- ❌ Only payment page accessible
- 📄 Must submit payment to unlock

### 5. **Expired** (Grace Period)
- ⚠️ Limited access
- 🔜 Will be locked soon
- 📢 Renewal prompts

### 6. **Suspended** (Manually by Superadmin)
- 🔒 Completely locked
- 🛑 Superadmin intervention required
- 📞 Contact support

---

## 👥 User Roles & Access

### School Admin
**Can Access:**
- View subscription status
- Submit payment proofs
- View payment history
- See trial/subscription countdown
- Access "Subscription & Billing" page (`/schools/payment`)

**Cannot:**
- Approve own payments
- Bypass subscription checks
- Access locked features after expiry

### Superadmin
**Can Access:**
- View all pending payments (`/admin/payments`)
- Approve/reject payments
- Manually lock/unlock schools
- Register new schools with auto-trial
- Bypass all subscription checks

**Special Privileges:**
- No subscription required
- Access to "Payment Management" dashboard
- Full system control

### Teachers & Students
- Subject to school's subscription status
- Account locked if school subscription expires
- Cannot manage payments (school admin only)

---

## 💳 Payment Flow

### 1. School Admin Submits Payment

**Steps:**
1. Navigate to **Subscription & Billing** (sidebar)
2. Choose a plan (Monthly/Quarterly/Annual)
3. Make payment via:
   - Mobile Money (MTN, Vodafone, AirtelTigo)
   - Bank Transfer
   - Cash
   - Cheque
4. Fill payment form:
   - Payment method
   - Transaction reference
   - Payment proof URL (optional)
   - Notes (optional)
5. Submit for review

**Payment Details Provided:**
- **Bank Transfer:** Ecobank Ghana, Account: 0123456789
- **Mobile Money:** MTN (024-123-4567), Vodafone (020-123-4567)

### 2. Superadmin Reviews Payment

**Steps:**
1. Go to **Payment Management** (`/admin/payments`)
2. View pending payments list
3. Review payment details:
   - School name
   - Amount paid
   - Payment method
   - Transaction reference
   - Payment proof (if uploaded)
   - Billing period
4. **Approve** or **Reject**

#### If Approved:
- ✅ School subscription activated
- 🔓 Account unlocked immediately
- 📅 Billing dates calculated
- 💰 Payment recorded in history
- 🔔 School notified (future: email)

#### If Rejected:
- ❌ Payment marked as rejected
- 🔒 Account remains locked
- 📝 Rejection reason shown to school
- 🔁 School must resubmit payment

---

## 📊 User Interface Components

### 1. Trial Expiry Banner
**Location:** Top of dashboard (all authenticated pages)

**Shows:**
- Days remaining in trial/subscription
- Warning when <3 days left (orange)
- Expiry notice when expired (red)
- Payment pending status (blue)
- Payment rejected alert (red)
- Success message after approval (green)

**Auto-hides when:**
- Superadmin user
- Active subscription with >7 days left
- More than 3 days after payment approval

### 2. Subscription Guard
**Location:** Wraps all authenticated routes

**Functions:**
- Checks subscription status on page load
- Redirects locked accounts to payment page
- Allows access to payment page when locked
- Shows blocking screen for locked/expired accounts
- Bypasses checks for superadmin

**Accessible Routes When Locked:**
- `/schools/payment` (payment submission)
- `/settings` (account settings)
- `/logout` (sign out)

### 3. Payment Submission Page
**Location:** `/schools/payment`

**Tabs:**
1. **Subscription Plans**
   - All 3 plans with pricing
   - Features list for each plan
   - Savings indicators
   - "Select Plan" buttons
   - Payment instructions (bank/mobile money)

2. **Submit Payment**
   - Plan selection (radio buttons)
   - Payment method selection (visual cards)
   - Transaction reference field
   - Payment proof URL (optional)
   - Notes textarea
   - Submit button

3. **Payment History**
   - All submitted payments
   - Status badges (pending/approved/rejected)
   - Submission dates
   - Review dates & reviewer names
   - Rejection reasons (if applicable)
   - Approval notes (if applicable)

### 4. Payment Management (Superadmin)
**Location:** `/admin/payments`

**Features:**
- Pending payments count badge
- List of all pending payments
- Payment details cards:
  - School name & ID
  - Amount & plan type
  - Payment method & reference
  - Submission timestamp
  - Billing period
  - Payment proof link
  - Additional notes
- **Approve Dialog:**
  - Confirmation message
  - Action summary
  - Optional approval notes
  - Confirm/Cancel buttons
- **Reject Dialog:**
  - Warning message
  - Required rejection reason
  - Consequences list
  - Confirm/Cancel buttons

---

## 🗄️ Database Schema

### Schools Collection
```typescript
{
  id: string
  name: string
  // ... other fields
  
  // Subscription Fields
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'locked' | 'pending_payment' | 'suspended'
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  trialStartDate: Timestamp
  trialEndDate: Timestamp
  isTrialActive: boolean
  daysRemaining: number
  subscriptionStartDate: Timestamp | null
  subscriptionEndDate: Timestamp | null
  nextBillingDate: Timestamp | null
  lastPaymentDate: Timestamp | null
  totalAmountPaid: number
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'none'
}
```

### Subscriptions Collection
```typescript
{
  id: string (same as schoolId)
  schoolId: string
  schoolName: string
  
  // Trial
  trialStartDate: string (ISO)
  trialEndDate: string (ISO)
  isTrialActive: boolean
  trialDaysRemaining: number
  
  // Subscription
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'locked' | 'pending_payment' | 'suspended'
  subscriptionStartDate: string | null
  subscriptionEndDate: string | null
  
  // Billing
  nextBillingDate: string | null
  lastPaymentDate: string | null
  totalAmountPaid: number
  
  // Current Payment
  currentPaymentStatus: 'pending' | 'approved' | 'rejected' | 'none'
  currentPaymentAmount: number | null
  currentPaymentMethod: string | null
  currentPaymentReference: string | null
  currentPaymentProof: string | null
  currentPaymentSubmittedAt: string | null
  currentPaymentNotes: string | null
  
  // Approval
  approvedBy: string | null
  approvedAt: string | null
  approvalNotes: string | null
  rejectionReason: string | null
  
  // Settings
  autoLockEnabled: boolean
  gracePeriodDays: number
  
  createdAt: string
  updatedAt: string
}
```

### Payments Collection
```typescript
{
  id: string (auto-generated)
  schoolId: string
  schoolName: string
  
  // Payment Details
  amount: number
  subscriptionType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  paymentMethod: 'mobile_money' | 'bank_transfer' | 'cash' | 'cheque' | 'other'
  paymentReference: string
  paymentProof: string | null
  notes: string | null
  
  // Status
  status: 'pending' | 'approved' | 'rejected'
  
  // Review
  reviewedBy: string | null
  reviewedByName: string | null
  reviewedAt: string | null
  reviewNotes: string | null
  rejectionReason: string | null
  
  // Billing Period
  billingStartDate: string
  billingEndDate: string
  
  submittedAt: string
  createdAt: string
  updatedAt: string
}
```

---

## 🔧 Key Functions

### Subscription Service (`src/services/subscription.ts`)

#### Trial Management
- `initializeTrialSubscription(schoolId, schoolName)` - Start 10-day trial for new school
- `updateSubscriptionStatus(schoolId)` - Check expiry and update status
- `hasActiveSubscription(schoolId)` - Check if school has access

#### Payment Submission
- `submitPayment(schoolId, schoolName, planType, method, reference, proof, notes)` - Submit payment for review

#### Payment Approval (Superadmin)
- `approvePayment(paymentId, approvedBy, approvedByName, notes)` - Approve payment & activate subscription
- `rejectPayment(paymentId, rejectedBy, rejectedByName, reason)` - Reject payment & lock account

#### Payment Queries
- `getPendingPayments()` - Get all pending payments (superadmin)
- `getSchoolPayments(schoolId)` - Get payment history for school
- `getSubscription(schoolId)` - Get subscription details

#### Account Management
- `lockSchoolAccount(schoolId)` - Manually lock school (superadmin)
- `unlockSchoolAccount(schoolId)` - Manually unlock school (superadmin)

---

## 📝 Implementation Checklist

### ✅ Completed

- [x] **Subscription Schema** - Plans, pricing, status types
- [x] **School Schema Update** - Added subscription fields
- [x] **Subscription Service** - All core functions
- [x] **SubscriptionGuard Component** - Route protection
- [x] **TrialExpiryBanner** - Dynamic warnings
- [x] **School Registration Update** - Auto-trial initialization
- [x] **Payment Submission Page** - `/schools/payment` (3 tabs)
- [x] **Payment Management** - `/admin/payments` (superadmin)
- [x] **Sidebar Navigation** - Added subscription links
- [x] **App Layout Update** - Integrated guards & banners

### 🔜 Future Enhancements

- [ ] Email notifications (payment approved/rejected)
- [ ] SMS notifications for trial expiry
- [ ] Automated payment verification (Paystack/Flutterwave)
- [ ] Invoice generation (PDF)
- [ ] Payment receipts
- [ ] Subscription analytics dashboard
- [ ] Bulk payment approval
- [ ] Payment reminders (cron job)
- [ ] Discount codes/coupons
- [ ] Free tier for small schools
- [ ] Custom pricing negotiations

---

## 🚦 Testing Guide

### Test Scenario 1: New School Registration

1. **Superadmin:** Register new school via `/admin/register-school`
2. **Verify:** School created with trial status
3. **Check Firestore:**
   - `schools/{schoolId}` - subscription fields populated
   - `subscriptions/{schoolId}` - trial document created
4. **Login as School Admin**
5. **Verify:** See "Trial" badge, days remaining, no warnings (if day 1-7)

### Test Scenario 2: Trial Expiry Warning

1. **Manually update Firestore:** Set `trialEndDate` to 2 days from now
2. **Refresh dashboard**
3. **Verify:** Orange warning banner appears
4. **Check banner text:** "Trial Expiring Soon! ... ends in 2 days"

### Test Scenario 3: Trial Expired & Account Locked

1. **Manually update Firestore:** Set `trialEndDate` to yesterday
2. **Trigger status update:** Call `updateSubscriptionStatus(schoolId)`
3. **Verify Firestore:** `subscriptionStatus` changed to `locked`
4. **Login as School Admin**
5. **Verify:** Blocked screen with "Account Locked" message
6. **Click "Make Payment"** → Redirects to `/schools/payment`

### Test Scenario 4: Payment Submission

1. **School Admin:** Go to `/schools/payment`
2. **Select Plan:** Click "Select Plan" on Quarterly (GHS 400)
3. **Go to "Submit Payment" tab**
4. **Fill form:**
   - Plan: Quarterly (auto-selected)
   - Method: Mobile Money
   - Reference: MTN-12345678
   - Proof: https://example.com/receipt.jpg
   - Notes: "Paid via MTN on 2025-10-28"
5. **Submit**
6. **Verify Toast:** "Payment Submitted Successfully!"
7. **Check Firestore:**
   - `payments` collection - new document created
   - `subscriptions/{schoolId}` - `currentPaymentStatus: 'pending'`
   - `schools/{schoolId}` - `subscriptionStatus: 'pending_payment'`
8. **Verify Banner:** Blue "Payment Pending" banner appears

### Test Scenario 5: Payment Approval (Superadmin)

1. **Superadmin:** Go to `/admin/payments`
2. **Verify:** See pending payment in list
3. **Review details:** School name, amount, method, reference
4. **Click "Approve Payment"**
5. **Add notes:** "Payment verified via MTN transaction log"
6. **Confirm approval**
7. **Verify Toast:** "Payment Approved"
8. **Check Firestore:**
   - `payments/{paymentId}` - `status: 'approved'`, reviewer info added
   - `subscriptions/{schoolId}` - status changed to `active`, dates calculated
   - `schools/{schoolId}` - subscription activated
9. **Login as School Admin**
10. **Verify:** 
    - Green success banner
    - "Active" subscription badge
    - Days remaining shows 90 days

### Test Scenario 6: Payment Rejection

1. **Repeat Test 4** (submit another payment)
2. **Superadmin:** Go to `/admin/payments`
3. **Click "Reject Payment"**
4. **Enter reason:** "Invalid receipt - amount mismatch"
5. **Confirm rejection**
6. **Verify Firestore:**
   - `payments/{paymentId}` - `status: 'rejected'`, reason saved
   - `subscriptions/{schoolId}` - `currentPaymentStatus: 'rejected'`, reason saved
   - `schools/{schoolId}` - `subscriptionStatus: 'locked'`
7. **Login as School Admin**
8. **Verify:** Red alert showing rejection reason

### Test Scenario 7: Subscription Renewal

1. **Manually update:** Set `subscriptionEndDate` to 5 days from now
2. **Login as School Admin**
3. **Verify:** Yellow warning banner "Subscription Expiring: ... 5 days"
4. **Submit new payment** (repeat Test 4)
5. **Superadmin approves** (repeat Test 5)
6. **Verify:** Subscription extended by 90 days from today

---

## 🛡️ Security Considerations

### 1. Role-Based Access Control
- ✅ Only superadmin can approve/reject payments
- ✅ Only school_admin can submit payments for their school
- ✅ Teachers/students cannot access payment pages
- ✅ Firestore rules enforce schoolId matching

### 2. Subscription Checks
- ✅ Run on every page load (SubscriptionGuard)
- ✅ Update status before checking (prevent stale data)
- ✅ Server-side verification (Firestore rules)
- ✅ Cannot bypass via client manipulation

### 3. Payment Verification
- ✅ Manual review by superadmin (prevents fraud)
- ✅ Payment proof optional but recommended
- ✅ Transaction reference required
- ✅ All payments logged in Firestore

### 4. Account Locking
- ✅ Automatic locking on expiry
- ✅ Manual override by superadmin
- ✅ Grace period configurable
- ✅ Cannot bypass locked status

---

## 📞 Support Information

### For School Admins

**Payment Issues:**
- Email: support@campusconnect.com
- Phone: +233 (0) 24-123-4567

**Payment Methods:**
- **Mobile Money:** MTN, Vodafone, AirtelTigo
- **Bank Transfer:** Ecobank Ghana, Account: 0123456789
- **Cash:** Visit our office in Accra

**Response Time:**
- Payment verification: Within 24 hours
- Urgent requests: Same day (if submitted before 2 PM)

### For Superadmins

**Admin Tasks:**
1. Review pending payments daily
2. Verify transaction references
3. Provide clear rejection reasons
4. Monitor subscription renewals
5. Handle special cases (discounts, extensions)

---

## 🎉 Success Metrics

### Key Performance Indicators (KPIs)

1. **Trial Conversion Rate** = (Paid Subscriptions / Total Trials) × 100
2. **Payment Approval Time** = Average hours from submission to approval
3. **Renewal Rate** = (Renewals / Expiring Subscriptions) × 100
4. **Revenue per School** = Total amount paid / Number of active schools

### Target Metrics

- Trial Conversion: >60%
- Payment Approval: <12 hours
- Renewal Rate: >80%
- Monthly Recurring Revenue (MRR): Track growth

---

## 📚 Code Files Reference

### Core Files
- `src/schemas/subscription.ts` - Types, constants, helpers
- `src/services/subscription.ts` - Business logic
- `src/components/auth/subscription-guard.tsx` - Route protection
- `src/components/subscription/trial-expiry-banner.tsx` - Warning banners
- `src/app/(app)/schools/payment/page.tsx` - Payment submission UI
- `src/app/(app)/admin/payments/page.tsx` - Payment management UI
- `src/components/admin/admin-registration-form.tsx` - Trial initialization
- `src/app/(app)/layout.tsx` - Guard integration

### Updated Files
- `src/schemas/school.ts` - Added subscription fields
- `src/components/layout/sidebar-nav.tsx` - Added payment links

---

## 🎓 Training Materials

### For School Admins

**Video Tutorial Topics:**
1. Understanding your trial period
2. How to submit payment
3. Reading your subscription status
4. Renewing your subscription
5. Troubleshooting payment issues

**Quick Start Guide:**
1. Login to your school account
2. Click "Subscription & Billing" in sidebar
3. Choose a plan (we recommend Quarterly - best value!)
4. Make payment via your preferred method
5. Submit payment details with reference number
6. Wait for approval (usually <24 hours)
7. Enjoy uninterrupted access!

### For Superadmins

**Training Checklist:**
- [ ] How to access Payment Management
- [ ] Verifying payment proofs
- [ ] Approving payments efficiently
- [ ] Writing clear rejection reasons
- [ ] Handling special requests
- [ ] Monthly reporting procedures

---

## 📖 End User Documentation

See **SUBSCRIPTION_USER_GUIDE.md** for simplified instructions for school administrators.

---

*Last Updated: October 28, 2025*  
*Version: 1.0.0*  
*Developed by: CampusConnect Team*
