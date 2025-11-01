# CampusConnect Revenue Model

## Pricing Structure

CampusConnect uses a **two-part revenue model**:

### 1. One-Time Upfront Activation Fee
A one-time fee paid when activating a subscription plan (after trial ends):

| Plan | Upfront Fee | Student Limit |
|------|-------------|---------------|
| **Basic** | GHS 300 | Up to 200 students |
| **Standard** | GHS 500 | Up to 500 students |
| **Premium** | GHS 1,000 | Unlimited students |

### 2. Monthly Per-Student Fee
**GHS 20 per student per month** across all paid plans.

#### Billing Examples:

**School with 50 students on Basic Plan:**
- Upfront: GHS 300 (one-time)
- Monthly: 50 × GHS 20 = **GHS 1,000/month**

**School with 100 students on Standard Plan:**
- Upfront: GHS 500 (one-time)
- Monthly: 100 × GHS 20 = **GHS 2,000/month**

**School with 500 students on Premium Plan:**
- Upfront: GHS 1,000 (one-time)
- Monthly: 500 × GHS 20 = **GHS 10,000/month**

## Trial Period

- **Duration**: 30 days
- **Student Limit**: 50 students
- **Cost**: FREE
- **Features**: Full access to all features

## Payment Workflow

### For New Schools:

1. **Sign up** → Automatic 30-day trial starts
2. **Trial ends** → School must activate a paid plan
3. **Choose plan** → Basic, Standard, or Premium
4. **Pay upfront fee** → GHS 300/500/1,000 (one-time)
5. **Submit monthly payments** → GHS 20 × student count

### Monthly Billing:

1. School submits payment for current student count
2. Payment reference submitted through system
3. Super Admin approves payment
4. Subscription activated for next 30 days
5. Process repeats monthly

## Subscription States

| Status | Description |
|--------|-------------|
| **Trial** | 30-day free trial active |
| **Active** | Upfront fee paid, monthly payments up to date |
| **Pending Payment** | Payment submitted, awaiting approval |
| **Expired** | Subscription period ended, needs renewal |
| **Locked** | Account locked due to non-payment |

## Revenue Projections

### Conservative Estimate:
- Average school size: 150 students
- Average upfront: GHS 400
- Monthly recurring: 150 × GHS 20 = GHS 3,000/month

**Per School Annual Revenue:**
- Year 1: GHS 400 (upfront) + (GHS 3,000 × 12) = **GHS 36,400**
- Year 2+: GHS 3,000 × 12 = **GHS 36,000/year**

### With 50 Schools:
- Year 1: GHS 20,000 (upfront) + GHS 1,800,000 (monthly) = **GHS 1,820,000**
- Year 2+: **GHS 1,800,000/year**

### With 100 Schools:
- Year 1: GHS 40,000 (upfront) + GHS 3,600,000 (monthly) = **GHS 3,640,000**
- Year 2+: **GHS 3,600,000/year**

## Plan Features

### Basic Plan (GHS 300 + GHS 20/student)
- Up to 200 students
- Full feature access
- Email support
- Basic reporting

### Standard Plan (GHS 500 + GHS 20/student)
- Up to 500 students
- Full feature access
- Priority support
- Advanced reporting
- SMS notifications

### Premium Plan (GHS 1,000 + GHS 20/student)
- Unlimited students
- All features
- 24/7 Priority support
- Advanced analytics
- Bulk SMS
- Custom branding
- API access
- Dedicated account manager

## Auto-Billing Updates

The system automatically:
1. Tracks active student count
2. Calculates monthly fees (studentCount × GHS 20)
3. Updates billing amount when students are added/removed
4. Sends billing reminders before due date
5. Locks account if payment overdue

## Super Admin Controls

Super admins can:
- View pending upfront and monthly payments
- Approve/reject payment submissions
- Lock/unlock school accounts
- View revenue analytics by plan
- Track payment history per school
- Override billing amounts (if needed)
- Grant grace periods

## Payment Methods Supported

- Mobile Money (MTN, Vodafone, AirtelTigo)
- Bank Transfer
- Cash
- Cheque

All payments require:
- Payment reference number
- Optional proof of payment (screenshot/receipt)
- Super Admin approval before activation

## Revenue Tracking

The system tracks:
- Total revenue (all-time)
- Monthly revenue
- Revenue by plan type (Basic/Standard/Premium)
- Revenue per school
- Average revenue per student
- Conversion rate (trial → paid)
- Churn rate

## Implementation Notes

- Student count synced from active students in system
- Monthly billing calculated automatically
- Upfront fee is one-time per plan activation
- Schools can upgrade plans (pay difference in upfront fee)
- Grace period: 7 days before auto-lock
- Payment approval required within 48 hours

## Database Fields

### Subscription Collection:
```
- subscriptionType: 'TRIAL' | 'BASIC' | 'STANDARD' | 'PREMIUM'
- currentStudentCount: number
- upfrontFeePaid: boolean
- upfrontFeeAmount: number
- monthlyFeeAmount: number (studentCount × 20)
- nextBillingDate: date
- lastPaymentDate: date
- totalAmountPaid: number
```

### Payment Collection:
```
- paymentType: 'upfront' | 'monthly'
- amount: number
- studentCount: number (for monthly payments)
- status: 'pending' | 'approved' | 'rejected'
```

---

**Revenue Model Benefits:**
✅ Predictable recurring revenue
✅ Scales with school growth
✅ Low barrier to entry (affordable upfront)
✅ Aligned incentives (we grow when schools grow)
✅ Transparent pricing
✅ Flexible for schools of all sizes
