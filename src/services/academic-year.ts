import { getDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  AcademicYear,
  AcademicYearInput,
  AcademicTerm,
  AcademicTermInput,
} from '@/schemas/organization';

const COLLECTION = 'academic_years';

/**
 * Create a new academic year
 */
export async function createAcademicYear(data: AcademicYearInput): Promise<AcademicYear> {
  const db = getDb();
  const now = Timestamp.now();

  // If this is marked as current, unset any other current year for this school
  if (data.isCurrent) {
    await unsetCurrentAcademicYear(data.schoolId);
  }

  const yearData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION), yearData);

  return {
    id: docRef.id,
    ...yearData,
  } as AcademicYear;
}

/**
 * Get academic year by ID
 */
export async function getAcademicYear(id: string): Promise<AcademicYear | null> {
  const db = getDb();
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as AcademicYear;
}

/**
 * Get all academic years for a school
 */
export async function getSchoolAcademicYears(schoolId: string): Promise<AcademicYear[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where('schoolId', '==', schoolId),
    orderBy('startDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as AcademicYear[];
}

/**
 * Get current academic year for a school
 */
export async function getCurrentAcademicYear(schoolId: string): Promise<AcademicYear | null> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where('schoolId', '==', schoolId),
    where('isCurrent', '==', true)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as AcademicYear;
}

/**
 * Get current term for a school
 */
export async function getCurrentTerm(schoolId: string): Promise<AcademicTerm | null> {
  const currentYear = await getCurrentAcademicYear(schoolId);
  if (!currentYear || !currentYear.terms) return null;

  return currentYear.terms.find(term => term.isCurrent) || null;
}

/**
 * Update academic year
 */
export async function updateAcademicYear(
  id: string,
  updates: Partial<AcademicYearInput>
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION, id);

  // If setting as current, unset others
  if (updates.isCurrent) {
    const year = await getAcademicYear(id);
    if (year) {
      await unsetCurrentAcademicYear(year.schoolId);
    }
  }

  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Unset current academic year for a school
 */
async function unsetCurrentAcademicYear(schoolId: string): Promise<void> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where('schoolId', '==', schoolId),
    where('isCurrent', '==', true)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { isCurrent: false });
  });

  await batch.commit();
}

/**
 * Set current term within an academic year
 */
export async function setCurrentTerm(
  academicYearId: string,
  termNumber: number
): Promise<void> {
  const db = getDb();
  const year = await getAcademicYear(academicYearId);
  
  if (!year) {
    throw new Error('Academic year not found');
  }

  const updatedTerms = year.terms.map(term => ({
    ...term,
    isCurrent: term.termNumber === termNumber,
  }));

  await updateDoc(doc(db, COLLECTION, academicYearId), {
    terms: updatedTerms,
    updatedAt: Timestamp.now(),
  });
}

/**
 * End academic year and prepare for next year
 * This is a critical operation that:
 * 1. Marks current year as inactive
 * 2. Archives data (placeholder)
 * 3. Promotes students (to be implemented)
 * 4. Carries over unpaid fees
 */
export async function endAcademicYear(
  academicYearId: string,
  options?: {
    promoteStudents?: boolean;
    carryOverFees?: boolean;
    archiveData?: boolean;
  }
): Promise<void> {
  const db = getDb();
  const year = await getAcademicYear(academicYearId);
  
  if (!year) {
    throw new Error('Academic year not found');
  }

  // Mark as inactive and not current
  await updateDoc(doc(db, COLLECTION, academicYearId), {
    isCurrent: false,
    isActive: false,
    updatedAt: Timestamp.now(),
  });

  // TODO: Implement these operations
  if (options?.promoteStudents) {
    // await promoteStudentsToNextClass(year.schoolId);
    console.log('📚 Student promotion would happen here');
  }

  if (options?.carryOverFees) {
    // await carryOverUnpaidFees(year.schoolId, year.name);
    console.log('💰 Fee carryover would happen here');
  }

  if (options?.archiveData) {
    // await archiveAcademicYearData(year.schoolId, year.name);
    console.log('📦 Data archival would happen here');
  }
}

/**
 * Add a new term to an academic year
 */
export async function addTermToAcademicYear(
  academicYearId: string,
  termData: AcademicTermInput
): Promise<void> {
  const db = getDb();
  const year = await getAcademicYear(academicYearId);
  
  if (!year) {
    throw new Error('Academic year not found');
  }

  const updatedTerms = [...year.terms, termData];

  await updateDoc(doc(db, COLLECTION, academicYearId), {
    terms: updatedTerms,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update a specific term in an academic year
 */
export async function updateTerm(
  academicYearId: string,
  termNumber: number,
  updates: Partial<AcademicTermInput>
): Promise<void> {
  const db = getDb();
  const year = await getAcademicYear(academicYearId);
  
  if (!year) {
    throw new Error('Academic year not found');
  }

  const updatedTerms = year.terms.map(term =>
    term.termNumber === termNumber ? { ...term, ...updates } : term
  );

  await updateDoc(doc(db, COLLECTION, academicYearId), {
    terms: updatedTerms,
    updatedAt: Timestamp.now(),
  });
}
