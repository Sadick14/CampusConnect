import { getDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
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
export async function getStudentFeeRecords(organizationId: string, studentId: string): Promise<StudentFeeRecord[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.fees),
    where('organizationId', '==', organizationId),
    where('studentId', '==', studentId)
  );

  const snapshot = await getDocs(q);
  let records = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StudentFeeRecord[];
  
  // Sort client-side by dueDate descending
  records.sort((a, b) => {
    const dateA = a.dueDate ? (a.dueDate as any).toDate ? (a.dueDate as any).toDate().getTime() : new Date(a.dueDate as any).getTime() : 0;
    const dateB = b.dueDate ? (b.dueDate as any).toDate ? (b.dueDate as any).toDate().getTime() : new Date(b.dueDate as any).getTime() : 0;
    return dateB - dateA;
  });
  
  return records;
}

/**
 * Get all fee records for a class
 */
export async function getClassFeeRecords(organizationId: string, className: string): Promise<StudentFeeRecord[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.fees),
    where('organizationId', '==', organizationId),
    where('className', '==', className)
  );

  const snapshot = await getDocs(q);
  let records = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StudentFeeRecord[];
  
  // Sort client-side by studentName ascending
  records.sort((a, b) => {
    const nameA = a.studentName || '';
    const nameB = b.studentName || '';
    return nameA.localeCompare(nameB);
  });
  
  return records;
}

/**
 * Get all fee records by status
 */
export async function getFeeRecordsByStatus(
  organizationId: string,
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'exempted'
): Promise<StudentFeeRecord[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.fees),
    where('organizationId', '==', organizationId),
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
  organizationId: string,
  filters?: {
    feeType?: string;
    paymentStatus?: string;
    className?: string;
    academicYear?: string;
  }
): Promise<StudentFeeRecord[]> {
  const db = getDb();
  const constraints: QueryConstraint[] = [where('organizationId', '==', organizationId)];

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
export async function getStudentPayments(organizationId: string, studentId: string): Promise<PaymentRecord[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.payments),
    where('organizationId', '==', organizationId),
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
  organizationId: string,
  filters?: {
    paymentMethod?: string;
    status?: 'pending' | 'confirmed' | 'rejected';
    startDate?: Timestamp;
    endDate?: Timestamp;
  }
): Promise<PaymentRecord[]> {
  const db = getDb();
  const constraints: QueryConstraint[] = [where('organizationId', '==', organizationId)];

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
  const orgId = (exemptionData as any).organizationId || exemptionData.schoolId;
  const feeRecords = await getStudentFeeRecords(orgId, exemptionData.studentId);
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
export async function getStudentExemptions(organizationId: string, studentId: string): Promise<FeeExemption[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.exemptions),
    where('organizationId', '==', organizationId),
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
export async function getSchoolExemptions(organizationId: string): Promise<FeeExemption[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.exemptions),
    where('organizationId', '==', organizationId),
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
export async function deleteExemption(exemptionId: string, organizationId: string, studentId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTION_PATHS.exemptions, exemptionId));

  // Reset exempted fees back to pending
  const feeRecords = await getStudentFeeRecords(organizationId, studentId);
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
export async function getSchoolFeeTypes(organizationId: string): Promise<FeeType[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.feeTypes),
    where('organizationId', '==', organizationId),
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
  })) as unknown as ClassFeeStructure[];
}

/**
 * ANALYTICS & REPORTING
 */

/**
 * Calculate fee collection summary for a school
 */
export async function calculateFeeSummary(
  organizationId: string,
  academicYear: string
): Promise<FeeSummary> {
  const db = getDb();
  const allFees = await getSchoolFeeRecords(organizationId, { academicYear });

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
    schoolId: organizationId,
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
export async function getOverdueFees(organizationId: string, daysOverdue: number = 0): Promise<StudentFeeRecord[]> {
  const db = getDb();
  const overdueFees = await getFeeRecordsByStatus(organizationId, 'overdue');

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
  organizationId: string,
  academicYear: string
): Promise<Record<string, { total: number; collected: number; percentage: number }>> {
  const classRecords = await getSchoolFeeRecords(organizationId, { academicYear });

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
  organizationId: string,
  studentId: string
): Promise<number> {
  const fees = await getStudentFeeRecords(organizationId, studentId);
  return fees.reduce((total, fee) => total + fee.pendingAmount, 0);
}

/**
 * Get total fees collected today
 */
export async function getTodayCollections(organizationId: string): Promise<number> {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const payments = await getSchoolPayments(organizationId, {
    startDate: Timestamp.fromDate(today),
    endDate: Timestamp.fromDate(tomorrow),
  });

  return payments.reduce((total, payment) => (payment.status === 'confirmed' ? total + payment.amount : total), 0);
}

/**
 * Record bulk feeding fees (daily/weekly collection)
 */
export async function recordBulkFeedingFees(data: {
  organizationId: string;
  classId: string;
  date: string;
  type: 'daily' | 'weekly';
  amount: number;
  students: Array<{ studentId: string; studentName: string }>;
}): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  const paymentsRef = collection(db, COLLECTION_PATHS.payments);

  for (const student of data.students) {
    const paymentRef = doc(paymentsRef);
    batch.set(paymentRef, {
      organizationId: data.organizationId,
      studentId: student.studentId,
      studentName: student.studentName,
      feeType: 'feeding_fees',
      amount: data.amount,
      paymentDate: Timestamp.fromDate(new Date(data.date)),
      paymentMethod: 'cash',
      status: 'confirmed',
      collectionType: data.type,
      notes: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} feeding fee`,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  await batch.commit();
}

/**
 * Record installment payment for any fee type
 */
export async function recordInstallmentPayment(data: {
  organizationId: string;
  studentId: string;
  studentName: string;
  feeType: string;
  amount: number;
  paymentDate: string;
  notes?: string;
}): Promise<void> {
  const db = getDb();
  const paymentRef = doc(collection(db, COLLECTION_PATHS.payments));

  await setDoc(paymentRef, {
    organizationId: data.organizationId,
    studentId: data.studentId,
    studentName: data.studentName,
    feeType: data.feeType,
    amount: data.amount,
    paymentDate: Timestamp.fromDate(new Date(data.paymentDate)),
    paymentMethod: 'cash',
    status: 'confirmed',
    isInstallment: true,
    notes: data.notes || 'Installment payment',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get student's fee balance for a specific fee type
 */
export async function getStudentFeeBalance(
  organizationId: string,
  studentId: string,
  feeType: string
): Promise<number> {
  const db = getDb();

  // Get total fees charged
  const feesQuery = query(
    collection(db, COLLECTION_PATHS.fees),
    where('organizationId', '==', organizationId),
    where('studentId', '==', studentId),
    where('feeType', '==', feeType)
  );
  const feesSnapshot = await getDocs(feesQuery);
  const totalCharged = feesSnapshot.docs.reduce((sum, doc) => {
    const data = doc.data();
    return sum + (data.amount || 0);
  }, 0);

  // Get total payments made
  const paymentsQuery = query(
    collection(db, COLLECTION_PATHS.payments),
    where('organizationId', '==', organizationId),
    where('studentId', '==', studentId),
    where('feeType', '==', feeType),
    where('status', '==', 'confirmed')
  );
  const paymentsSnapshot = await getDocs(paymentsQuery);
  const totalPaid = paymentsSnapshot.docs.reduce((sum, doc) => {
    const data = doc.data();
    return sum + (data.amount || 0);
  }, 0);

  return totalCharged - totalPaid;
}

/**
 * Create installment plan for a student
 */
export async function createInstallmentPlan(data: {
  organizationId: string;
  studentId: string;
  studentName: string;
  feeType: string;
  totalAmount: number;
  numberOfInstallments: number;
  startDate: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
}): Promise<void> {
  const db = getDb();
  const planRef = doc(collection(db, 'installment_plans'));

  const installmentAmount = data.totalAmount / data.numberOfInstallments;
  const installments = [];
  const startDate = new Date(data.startDate);

  for (let i = 0; i < data.numberOfInstallments; i++) {
    const dueDate = new Date(startDate);
    
    if (data.frequency === 'weekly') {
      dueDate.setDate(dueDate.getDate() + (i * 7));
    } else if (data.frequency === 'biweekly') {
      dueDate.setDate(dueDate.getDate() + (i * 14));
    } else {
      dueDate.setMonth(dueDate.getMonth() + i);
    }

    installments.push({
      number: i + 1,
      amount: installmentAmount,
      dueDate: Timestamp.fromDate(dueDate),
      isPaid: false,
    });
  }

  await setDoc(planRef, {
    organizationId: data.organizationId,
    studentId: data.studentId,
    studentName: data.studentName,
    feeType: data.feeType,
    totalAmount: data.totalAmount,
    amountPaid: 0,
    installments,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

