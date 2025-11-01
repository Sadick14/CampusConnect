import { getDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  Timestamp,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import {
  StudentFeeRecordInput,
  PaymentRecordInput,
  FeeExemptionInput,
  FeeTypeInput,
  ClassFeeStructureInput,
  StudentFeeRecord,
  PaymentRecord,
  FeeExemption,
  FeeType,
  ClassFeeStructure,
  FeeSummary,
} from '@/schemas/fee';

const COLLECTION_PATHS = {
  fees: 'fees',
  payments: 'payments',
  exemptions: 'exemptions',
  feeTypes: 'fee_types',
  classFeeStructure: 'class_fee_structure',
  reminders: 'payment_reminders',
};

/**
 * FEE RECORD OPERATIONS
 */

/**
 * Create a new fee record for a student
 */
export async function createFeeRecord(
  feeData: StudentFeeRecordInput
): Promise<StudentFeeRecord> {
  const db = getDb();
  const now = Timestamp.now();

  const dataToSave = {
    ...feeData,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION_PATHS.fees), dataToSave);

  return {
    id: docRef.id,
    ...dataToSave,
  } as StudentFeeRecord;
}

/**
 * Get a fee record by ID
 */
export async function getFeeRecord(recordId: string): Promise<StudentFeeRecord | null> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_PATHS.fees, recordId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as StudentFeeRecord;
}

/**
 * Get all fee records for a student
 */
export async function getStudentFeeRecords(schoolId: string, studentId: string): Promise<StudentFeeRecord[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.fees),
    where('schoolId', '==', schoolId),
    where('studentId', '==', studentId),
    orderBy('dueDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StudentFeeRecord[];
}

/**
 * Get all fee records for a class
 */
export async function getClassFeeRecords(schoolId: string, className: string): Promise<StudentFeeRecord[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.fees),
    where('schoolId', '==', schoolId),
    where('className', '==', className),
    orderBy('studentName', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StudentFeeRecord[];
}

/**
 * Get all fee records by status
 */
export async function getFeeRecordsByStatus(
  schoolId: string,
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'exempted'
): Promise<StudentFeeRecord[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.fees),
    where('schoolId', '==', schoolId),
    where('paymentStatus', '==', status),
    orderBy('dueDate', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StudentFeeRecord[];
}

/**
 * Get all fee records for a school
 */
export async function getSchoolFeeRecords(
  schoolId: string,
  filters?: {
    feeType?: string;
    paymentStatus?: string;
    className?: string;
    academicYear?: string;
  }
): Promise<StudentFeeRecord[]> {
  const db = getDb();
  const constraints: QueryConstraint[] = [where('schoolId', '==', schoolId)];

  if (filters?.feeType) constraints.push(where('feeType', '==', filters.feeType));
  if (filters?.paymentStatus) constraints.push(where('paymentStatus', '==', filters.paymentStatus));
  if (filters?.className) constraints.push(where('className', '==', filters.className));
  if (filters?.academicYear) constraints.push(where('academicYear', '==', filters.academicYear));

  constraints.push(orderBy('dueDate', 'desc'));

  const q = query(collection(db, COLLECTION_PATHS.fees), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StudentFeeRecord[];
}

/**
 * Update a fee record
 */
export async function updateFeeRecord(
  recordId: string,
  updates: Partial<StudentFeeRecordInput>
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_PATHS.fees, recordId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a fee record
 */
export async function deleteFeeRecord(recordId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTION_PATHS.fees, recordId));
}

/**
 * PAYMENT OPERATIONS
 */

/**
 * Record a payment
 */
export async function recordPayment(
  paymentData: PaymentRecordInput
): Promise<PaymentRecord> {
  const db = getDb();
  const now = Timestamp.now();

  const dataToSave = {
    ...paymentData,
    recordedDate: now,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION_PATHS.payments), dataToSave);

  // Update fee record with payment
  const feeRecord = await getFeeRecord(paymentData.feeRecordId);
  if (feeRecord) {
    const newPaidAmount = feeRecord.paidAmount + paymentData.amount;
    const newPendingAmount = feeRecord.amount - newPaidAmount;
    const newStatus =
      newPendingAmount <= 0
        ? 'paid'
        : newPaidAmount > 0
          ? 'partial'
          : 'pending';

    await updateFeeRecord(paymentData.feeRecordId, {
      paidAmount: newPaidAmount,
      pendingAmount: Math.max(0, newPendingAmount),
      paymentStatus: newStatus,
    });
  }

  return {
    id: docRef.id,
    ...dataToSave,
  } as PaymentRecord;
}

/**
 * Get payment by ID
 */
export async function getPayment(paymentId: string): Promise<PaymentRecord | null> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_PATHS.payments, paymentId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as PaymentRecord;
}

/**
 * Get all payments for a student
 */
export async function getStudentPayments(schoolId: string, studentId: string): Promise<PaymentRecord[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.payments),
    where('schoolId', '==', schoolId),
    where('studentId', '==', studentId),
    orderBy('paymentDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PaymentRecord[];
}

/**
 * Get all payments for a school with optional filters
 */
export async function getSchoolPayments(
  schoolId: string,
  filters?: {
    paymentMethod?: string;
    status?: 'pending' | 'confirmed' | 'rejected';
    startDate?: Timestamp;
    endDate?: Timestamp;
  }
): Promise<PaymentRecord[]> {
  const db = getDb();
  const constraints: QueryConstraint[] = [where('schoolId', '==', schoolId)];

  if (filters?.paymentMethod) constraints.push(where('paymentMethod', '==', filters.paymentMethod));
  if (filters?.status) constraints.push(where('status', '==', filters.status));

  constraints.push(orderBy('paymentDate', 'desc'));

  const q = query(collection(db, COLLECTION_PATHS.payments), ...constraints);
  let snapshot = await getDocs(q);
  let payments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PaymentRecord[];

  // Filter by date range if provided (since Firestore doesn't support multiple range queries)
  if (filters?.startDate || filters?.endDate) {
    payments = payments.filter(p => {
      const paymentTime = (p.paymentDate as Timestamp).toMillis?.() || 0;
      const startTime = filters.startDate?.toMillis?.() || 0;
      const endTime = filters.endDate?.toMillis?.() || Date.now();
      return paymentTime >= startTime && paymentTime <= endTime;
    });
  }

  return payments;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: 'pending' | 'confirmed' | 'rejected',
  approvedBy?: string
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_PATHS.payments, paymentId);

  const updateData: any = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (approvedBy) {
    updateData.approvedBy = approvedBy;
    updateData.approvalDate = Timestamp.now();
  }

  await updateDoc(docRef, updateData);
}

/**
 * Delete payment
 */
export async function deletePayment(paymentId: string): Promise<void> {
  const db = getDb();
  const payment = await getPayment(paymentId);

  if (payment) {
    // Reverse the payment from fee record
    const feeRecord = await getFeeRecord(payment.feeRecordId);
    if (feeRecord) {
      const newPaidAmount = Math.max(0, feeRecord.paidAmount - payment.amount);
      const newPendingAmount = feeRecord.amount - newPaidAmount;
      const newStatus =
        newPendingAmount >= feeRecord.amount
          ? 'pending'
          : newPaidAmount > 0
            ? 'partial'
            : 'paid';

      await updateFeeRecord(payment.feeRecordId, {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        paymentStatus: newStatus,
      });
    }
  }

  await deleteDoc(doc(db, COLLECTION_PATHS.payments, paymentId));
}

/**
 * EXEMPTION OPERATIONS
 */

/**
 * Create fee exemption
 */
export async function createFeeExemption(
  exemptionData: FeeExemptionInput
): Promise<FeeExemption> {
  const db = getDb();
  const now = Timestamp.now();

  const dataToSave = {
    ...exemptionData,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION_PATHS.exemptions), dataToSave);

  // Update fee record status
  const feeRecords = await getStudentFeeRecords(exemptionData.schoolId, exemptionData.studentId);
  const relevantFees = feeRecords.filter(f => f.feeType === exemptionData.feeType);

  const batch = writeBatch(db);
  for (const fee of relevantFees) {
    batch.update(doc(db, COLLECTION_PATHS.fees, fee.id!), {
      paymentStatus: 'exempted',
      updatedAt: now,
    });
  }
  await batch.commit();

  return {
    id: docRef.id,
    ...dataToSave,
  } as FeeExemption;
}

/**
 * Get exemptions for a student
 */
export async function getStudentExemptions(schoolId: string, studentId: string): Promise<FeeExemption[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.exemptions),
    where('schoolId', '==', schoolId),
    where('studentId', '==', studentId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as FeeExemption[];
}

/**
 * Get all exemptions for a school
 */
export async function getSchoolExemptions(schoolId: string): Promise<FeeExemption[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.exemptions),
    where('schoolId', '==', schoolId),
    orderBy('startDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as FeeExemption[];
}

/**
 * Delete exemption
 */
export async function deleteExemption(exemptionId: string, schoolId: string, studentId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTION_PATHS.exemptions, exemptionId));

  // Reset exempted fees back to pending
  const feeRecords = await getStudentFeeRecords(schoolId, studentId);
  const batch = writeBatch(db);
  for (const fee of feeRecords.filter(f => f.paymentStatus === 'exempted')) {
    batch.update(doc(db, COLLECTION_PATHS.fees, fee.id!), {
      paymentStatus: 'pending',
      updatedAt: Timestamp.now(),
    });
  }
  await batch.commit();
}

/**
 * FEE TYPE OPERATIONS
 */

/**
 * Create a fee type
 */
export async function createFeeType(feeTypeData: FeeTypeInput): Promise<FeeType> {
  const db = getDb();
  const now = Timestamp.now();

  const dataToSave = {
    ...feeTypeData,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION_PATHS.feeTypes), dataToSave);

  return {
    id: docRef.id,
    ...dataToSave,
  } as FeeType;
}

/**
 * Get all fee types for a school
 */
export async function getSchoolFeeTypes(schoolId: string): Promise<FeeType[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.feeTypes),
    where('schoolId', '==', schoolId),
    orderBy('displayName', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as FeeType[];
}

/**
 * CLASS FEE STRUCTURE OPERATIONS
 */

/**
 * Create or update class fee structure
 */
export async function upsertClassFeeStructure(
  data: ClassFeeStructureInput
): Promise<ClassFeeStructure> {
  const db = getDb();
  const now = Timestamp.now();

  // Check if exists
  const q = query(
    collection(db, COLLECTION_PATHS.classFeeStructure),
    where('classId', '==', data.classId),
    where('feeType', '==', data.feeType)
  );

  const snapshot = await getDocs(q);

  if (snapshot.docs.length > 0) {
    const docRef = doc(db, COLLECTION_PATHS.classFeeStructure, snapshot.docs[0].id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: now,
    });

    return {
      id: snapshot.docs[0].id,
      ...data,
      updatedAt: now,
    } as ClassFeeStructure;
  } else {
    const dataToSave = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_PATHS.classFeeStructure), dataToSave);

    return {
      id: docRef.id,
      ...dataToSave,
    } as ClassFeeStructure;
  }
}

/**
 * Get fee structure for a class
 */
export async function getClassFeeStructure(classId: string): Promise<ClassFeeStructure[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.classFeeStructure),
    where('classId', '==', classId),
    where('isActive', '==', true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ClassFeeStructure[];
}

/**
 * ANALYTICS & REPORTING
 */

/**
 * Calculate fee collection summary for a school
 */
export async function calculateFeeSummary(
  schoolId: string,
  academicYear: string
): Promise<FeeSummary> {
  const db = getDb();
  const allFees = await getSchoolFeeRecords(schoolId, { academicYear });

  let totalExpected = 0;
  let totalPaid = 0;
  let totalOverdue = 0;

  const feeTypeMap = new Map<string, any>();
  const classMap = new Map<string, any>();

  const now = new Date();

  for (const fee of allFees) {
    const dueTime = (fee.dueDate as Timestamp).toDate();
    const isOverdue = now > dueTime && fee.paymentStatus !== 'paid';

    totalExpected += fee.amount;
    totalPaid += fee.paidAmount;
    if (isOverdue) totalOverdue += fee.pendingAmount;

    // Fee type breakdown
    if (!feeTypeMap.has(fee.feeType)) {
      feeTypeMap.set(fee.feeType, { expected: 0, paid: 0, pending: 0 });
    }
    const feeTypeData = feeTypeMap.get(fee.feeType);
    feeTypeData.expected += fee.amount;
    feeTypeData.paid += fee.paidAmount;
    feeTypeData.pending += fee.pendingAmount;

    // Class breakdown
    if (!classMap.has(fee.className)) {
      classMap.set(fee.className, { expected: 0, paid: 0, pending: 0 });
    }
    const classData = classMap.get(fee.className);
    classData.expected += fee.amount;
    classData.paid += fee.paidAmount;
    classData.pending += fee.pendingAmount;
  }

  const feeTypeBreakdown = Array.from(feeTypeMap.entries()).map(([feeType, data]) => ({
    feeType,
    expected: data.expected,
    paid: data.paid,
    pending: data.pending,
    collectionRate: data.expected > 0 ? Math.round((data.paid / data.expected) * 100) : 0,
  }));

  const classBreakdown = Array.from(classMap.entries()).map(([className, data]) => ({
    className,
    expected: data.expected,
    paid: data.paid,
    pending: data.pending,
    collectionRate: data.expected > 0 ? Math.round((data.paid / data.expected) * 100) : 0,
  }));

  return {
    schoolId,
    academicYear,
    totalFeesExpected: totalExpected,
    totalFeesPaid: totalPaid,
    totalFeesOverdue: totalOverdue,
    collectionRate: totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0,
    feeTypeBreakdown,
    classBreakdown,
    generatedDate: Timestamp.now(),
  };
}

/**
 * Get overdue fees for a school
 */
export async function getOverdueFees(schoolId: string, daysOverdue: number = 0): Promise<StudentFeeRecord[]> {
  const db = getDb();
  const overdueFees = await getFeeRecordsByStatus(schoolId, 'overdue');

  const now = new Date();
  const cutoffDate = new Date(now.getTime() - daysOverdue * 24 * 60 * 60 * 1000);

  return overdueFees.filter(fee => {
    const dueDate = (fee.dueDate as Timestamp).toDate();
    return dueDate <= cutoffDate;
  });
}

/**
 * Get fee collection statistics by class
 */
export async function getFeeCollectionByClass(
  schoolId: string,
  academicYear: string
): Promise<Record<string, { total: number; collected: number; percentage: number }>> {
  const classRecords = await getSchoolFeeRecords(schoolId, { academicYear });

  const classStats: Record<string, { total: number; collected: number }> = {};

  for (const record of classRecords) {
    if (!classStats[record.className]) {
      classStats[record.className] = { total: 0, collected: 0 };
    }
    classStats[record.className].total += record.amount;
    classStats[record.className].collected += record.paidAmount;
  }

  const result: Record<string, { total: number; collected: number; percentage: number }> = {};
  for (const [className, stats] of Object.entries(classStats)) {
    result[className] = {
      total: stats.total,
      collected: stats.collected,
      percentage: stats.total > 0 ? Math.round((stats.collected / stats.total) * 100) : 0,
    };
  }

  return result;
}

/**
 * Get student's outstanding balance
 */
export async function getStudentOutstandingBalance(
  schoolId: string,
  studentId: string
): Promise<number> {
  const fees = await getStudentFeeRecords(schoolId, studentId);
  return fees.reduce((total, fee) => total + fee.pendingAmount, 0);
}

/**
 * Get total fees collected today
 */
export async function getTodayCollections(schoolId: string): Promise<number> {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const payments = await getSchoolPayments(schoolId, {
    startDate: Timestamp.fromDate(today),
    endDate: Timestamp.fromDate(tomorrow),
  });

  return payments.reduce((total, payment) => (payment.status === 'confirmed' ? total + payment.amount : total), 0);
}
