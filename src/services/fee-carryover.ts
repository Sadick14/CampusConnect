import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

/**
 * Fee Carryover Service
 * Handles carrying over unpaid fees from one academic year to the next
 */

export interface CarryoverResult {
  totalStudents: number;
  studentsWithBalance: number;
  feesCarriedOver: number;
  totalAmountCarriedOver: number;
  errors: string[];
  carriedOverFees: Array<{
    studentId: string;
    studentName: string;
    originalAmount: number;
    paidAmount: number;
    balance: number;
    feeTypes: string[];
  }>;
}

export interface FeeBalance {
  studentId: string;
  studentName: string;
  feeType: string;
  className: string;
  originalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate?: string;
  description?: string;
}

/**
 * Get all unpaid fee balances for an organization in a specific academic year
 */
async function getUnpaidFeeBalances(
  organizationId: string,
  academicYearId: string
): Promise<FeeBalance[]> {
  const db = getDb();
  const balances: FeeBalance[] = [];

  try {
    // Get all fees for the academic year
    const feesQuery = query(
      collection(db, 'fees'),
      where('organizationId', '==', organizationId),
      where('academicYear', '==', academicYearId)
    );

    const feesSnapshot = await getDocs(feesQuery);

    for (const feeDoc of feesSnapshot.docs) {
      const fee = { id: feeDoc.id, ...feeDoc.data() };

      // Calculate balance
      const paidAmount = fee.paidAmount || 0;
      const totalAmount = fee.amount || 0;
      const balance = totalAmount - paidAmount;

      // Only include if there's an outstanding balance
      if (balance > 0) {
        balances.push({
          studentId: fee.studentId,
          studentName: fee.studentName || 'Unknown',
          feeType: fee.feeType || 'general',
          className: fee.className || 'Unknown',
          originalAmount: totalAmount,
          paidAmount: paidAmount,
          balance: balance,
          dueDate: fee.dueDate,
          description: fee.description,
        });
      }
    }

    console.log(`[Fee Carryover] Found ${balances.length} unpaid fee records`);
    return balances;
  } catch (error) {
    console.error('[Fee Carryover] Error fetching unpaid balances:', error);
    throw new Error('Failed to fetch unpaid fee balances');
  }
}

/**
 * Carry over unpaid fees to the next academic year
 */
export async function carryOverUnpaidFees(
  organizationId: string,
  fromAcademicYearId: string,
  toAcademicYearId: string,
  toAcademicYearName: string,
  options?: {
    discountPercentage?: number; // Apply discount to carried over fees
    dryRun?: boolean; // Preview without creating records
  }
): Promise<CarryoverResult> {
  const db = getDb();
  const result: CarryoverResult = {
    totalStudents: 0,
    studentsWithBalance: 0,
    feesCarriedOver: 0,
    totalAmountCarriedOver: 0,
    errors: [],
    carriedOverFees: [],
  };

  try {
    console.log(`[Fee Carryover] Starting carryover from year ${fromAcademicYearId} to ${toAcademicYearId}`);

    // Get all unpaid balances
    const unpaidBalances = await getUnpaidFeeBalances(organizationId, fromAcademicYearId);

    if (unpaidBalances.length === 0) {
      console.log('[Fee Carryover] No unpaid balances to carry over');
      return result;
    }

    // Group by student
    const balancesByStudent = new Map<string, FeeBalance[]>();
    for (const balance of unpaidBalances) {
      if (!balancesByStudent.has(balance.studentId)) {
        balancesByStudent.set(balance.studentId, []);
      }
      balancesByStudent.get(balance.studentId)!.push(balance);
    }

    result.totalStudents = balancesByStudent.size;
    result.studentsWithBalance = balancesByStudent.size;

    console.log(`[Fee Carryover] ${result.totalStudents} students have unpaid balances`);

    // Create batch for new fee records
    const batch = writeBatch(db);
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500;
    const now = new Date();

    // Process each student's balances
    for (const [studentId, balances] of balancesByStudent.entries()) {
      const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);
      const studentName = balances[0].studentName;
      const feeTypes = [...new Set(balances.map(b => b.feeType))];

      // Apply discount if specified
      const discountMultiplier = options?.discountPercentage 
        ? (100 - options.discountPercentage) / 100 
        : 1;

      // Create a consolidated carryover fee for each student
      const carryoverFee = {
        organizationId,
        studentId,
        studentName,
        academicYear: toAcademicYearId,
        academicYearName: toAcademicYearName,
        feeType: 'carryover',
        className: balances[0].className, // Use first class (may need updating after promotion)
        description: `Carried over from previous year (${balances.length} fee(s))`,
        amount: totalBalance * discountMultiplier,
        paidAmount: 0,
        status: 'pending',
        dueDate: new Date(now.setMonth(now.getMonth() + 3)).toISOString(), // 3 months from now
        previousYearFees: balances.map(b => ({
          feeType: b.feeType,
          originalAmount: b.originalAmount,
          paidAmount: b.paidAmount,
          balance: b.balance,
        })),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (!options?.dryRun) {
        // Add to Firestore
        const feeRef = doc(collection(db, 'fees'));
        batch.set(feeRef, carryoverFee);
        batchCount++;

        // Commit batch if reaching limit
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`[Fee Carryover] Committed batch of ${batchCount} fee records`);
          batchCount = 0;
        }
      }

      result.feesCarriedOver++;
      result.totalAmountCarriedOver += totalBalance * discountMultiplier;
      result.carriedOverFees.push({
        studentId,
        studentName,
        originalAmount: totalBalance,
        paidAmount: 0,
        balance: totalBalance * discountMultiplier,
        feeTypes,
      });

      console.log(`[Fee Carryover] Carried over GH₵${(totalBalance * discountMultiplier).toFixed(2)} for ${studentName}`);
    }

    // Commit remaining records
    if (batchCount > 0 && !options?.dryRun) {
      await batch.commit();
      console.log(`[Fee Carryover] Committed final batch of ${batchCount} fee records`);
    }

    console.log('[Fee Carryover] Summary:');
    console.log(`  Total Students: ${result.totalStudents}`);
    console.log(`  Students with Balance: ${result.studentsWithBalance}`);
    console.log(`  Fees Carried Over: ${result.feesCarriedOver}`);
    console.log(`  Total Amount: GH₵${result.totalAmountCarriedOver.toFixed(2)}`);

    return result;
  } catch (error) {
    console.error('[Fee Carryover] Error carrying over fees:', error);
    throw new Error('Failed to carry over unpaid fees');
  }
}

/**
 * Preview fee carryover without creating records
 */
export async function previewFeeCarryover(
  organizationId: string,
  fromAcademicYearId: string,
  toAcademicYearId: string,
  toAcademicYearName: string
): Promise<CarryoverResult> {
  return carryOverUnpaidFees(
    organizationId,
    fromAcademicYearId,
    toAcademicYearId,
    toAcademicYearName,
    { dryRun: true }
  );
}

/**
 * Get summary of unpaid fees for an academic year
 */
export async function getUnpaidFeesSummary(
  organizationId: string,
  academicYearId: string
): Promise<{
  totalStudents: number;
  totalUnpaidAmount: number;
  feesByType: Record<string, { count: number; amount: number }>;
}> {
  const balances = await getUnpaidFeeBalances(organizationId, academicYearId);
  
  const summary = {
    totalStudents: new Set(balances.map(b => b.studentId)).size,
    totalUnpaidAmount: balances.reduce((sum, b) => sum + b.balance, 0),
    feesByType: {} as Record<string, { count: number; amount: number }>,
  };

  // Group by fee type
  for (const balance of balances) {
    if (!summary.feesByType[balance.feeType]) {
      summary.feesByType[balance.feeType] = { count: 0, amount: 0 };
    }
    summary.feesByType[balance.feeType].count++;
    summary.feesByType[balance.feeType].amount += balance.balance;
  }

  return summary;
}
