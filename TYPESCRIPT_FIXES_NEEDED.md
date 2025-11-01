# TypeScript Errors Fix Guide

## Issues Found

The following TypeScript errors need to be fixed:

### 1. Missing Exports in Services

**File:** `src/services/invitation.ts`
- **Error:** `SchoolInvitation` is not exported
- **Fix:** Add `export type { SchoolInvitation }` to the file

**File:** `src/services/subscription.ts`
- **Error:** `PaymentRecord` is not exported  
- **Fix:** Add `export type { PaymentRecord }` to the file

### 2. Missing Service Functions

**File:** `src/services/school.ts`
- **Error:** No exported member `getSchool` (only `getSchools` exists)
- **Fix:** Add function:
```typescript
export async function getSchool(schoolId: string): Promise<School | null> {
  const db = getDb();
  const schoolRef = doc(db, 'schools', schoolId);
  const schoolSnap = await getDoc(schoolRef);
  if (!schoolSnap.exists()) return null;
  return { id: schoolSnap.id, ...schoolSnap.data() } as School;
}
```

**File:** `src/services/student.ts`
- **Error:** No exported member `getSchoolStudents`
- **Fix:** This function should already exist. Verify or add:
```typescript
export async function getSchoolStudents(schoolId: string): Promise<Student[]> {
  // ... existing implementation
}
```

### 3. Schema Mismatches

**File:** `src/schemas/subscription.ts`
- **Issue:** Plans are named TRIAL, MONTHLY, QUARTERLY, ANNUAL
- **Expected:** TRIAL, BASIC, STANDARD, PREMIUM  
- **Resolution Options:**
  1. Update `SUBSCRIPTION_PLANS` to use BASIC, STANDARD, PREMIUM with appropriate pricing
  2. OR: Update new UI components to use existing plan names
  3. OR: Support both naming schemes

**Recommendation:** Keep existing MONTHLY/QUARTERLY/ANNUAL since subscription service is built around them. Update new components to use these names.

**File:** `src/schemas/class.ts`
- **Error:** No exported member `Class`
- **Fix:** Add `export type { Class }` or verify the type name

**File:** `src/schemas/staff.ts`
- **Error:** `StaffMember` missing `status` property
- **Fix:** Add to interface:
```typescript
export interface StaffMember {
  // ... existing fields
  status: 'active' | 'inactive' | 'suspended';
}
```

**File:** `src/schemas/student.ts`  
- **Error:** `Student` missing `studentId` property
- **Fix:** Verify if it's `studentId` or `id`. Add if missing:
```typescript
export interface Student {
  // ... existing fields
  studentId: string; // Unique student identifier
}
```

### 4. School Schema Missing Subscription Fields

**File:** `src/schemas/school.ts`
- **Error:** `School` type missing subscription-related fields
- **Fix:** Add these fields to the School interface:
```typescript
export interface School {
  // ... existing fields
  subscriptionStatus?: string;
  subscriptionType?: string;
  trialStartDate?: Timestamp;
  trialEndDate?: Timestamp;
  isTrialActive?: boolean;
  daysRemaining?: number;
  subscriptionStartDate?: Timestamp | null;
  subscriptionEndDate?: Timestamp | null;
  nextBillingDate?: Timestamp | null;
  lastPaymentDate?: Timestamp | null;
  totalAmountPaid?: number;
  paymentStatus?: string;
}
```

## Quick Fix Priority

1. **HIGH PRIORITY** - Export missing types (SchoolInvitation, PaymentRecord)
2. **HIGH PRIORITY** - Add `getSchool()` function  
3. **HIGH PRIORITY** - Add subscription fields to School schema
4. **MEDIUM PRIORITY** - Add status to StaffMember schema
5. **MEDIUM PRIORITY** - Verify Student schema has studentId
6. **LOW PRIORITY** - Decide on subscription plan naming strategy

## Commands to Run

```bash
# After fixing the above issues, check for errors
npm run build

# Or for type checking only
npx tsc --noEmit
```

## Notes

- The analytics page uses recharts which was already installed
- Navigation has been updated with super_admin routes
- All UI components are built, just need schema/type alignment
- Subscription service is production-ready, just needs type exports
