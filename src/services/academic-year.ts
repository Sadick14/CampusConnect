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

export async function createAcademicYear(data: AcademicYearInput): Promise<AcademicYear> {
  const db = getDb();
  const now = Timestamp.now();
  if (data.isCurrent) {
    await unsetCurrentAcademicYear(data.organizationId);
  }
  const yearData = { ...data, createdAt: now, updatedAt: now };
  const docRef = await addDoc(collection(db, COLLECTION), yearData);
  return { id: docRef.id, ...yearData } as AcademicYear;
}

export async function getAcademicYear(id: string): Promise<AcademicYear | null> {
  const db = getDb();
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as AcademicYear;
}

export async function getSchoolAcademicYears(organizationId: string): Promise<AcademicYear[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where('organizationId', '==', organizationId),
    orderBy('startDate', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AcademicYear[];
}

export async function getCurrentAcademicYear(organizationId: string): Promise<AcademicYear | null> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where('organizationId', '==', organizationId),
    where('isCurrent', '==', true)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as AcademicYear;
}

export async function getCurrentTerm(organizationId: string): Promise<AcademicTerm | null> {
  const currentYear = await getCurrentAcademicYear(organizationId);
  if (!currentYear || !currentYear.terms) return null;
  return currentYear.terms.find(term => term.isCurrent) || null;
}

export async function updateAcademicYear(
  id: string,
  updates: Partial<AcademicYearInput>
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION, id);
  if (updates.isCurrent) {
    const year = await getAcademicYear(id);
    if (year) {
      await unsetCurrentAcademicYear(year.organizationId);
    }
  }
  await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
}

async function unsetCurrentAcademicYear(organizationId: string): Promise<void> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where('organizationId', '==', organizationId),
    where('isCurrent', '==', true)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { isCurrent: false });
  });
  await batch.commit();
}

export async function setCurrentTerm(
  academicYearId: string,
  termNumber: number
): Promise<void> {
  const db = getDb();
  const year = await getAcademicYear(academicYearId);
  if (!year) throw new Error('Academic year not found');
  const updatedTerms = year.terms.map(term => ({
    ...term,
    isCurrent: term.termNumber === termNumber,
  }));
  await updateDoc(doc(db, COLLECTION, academicYearId), {
    terms: updatedTerms,
    updatedAt: Timestamp.now(),
  });
}

export async function endAcademicYear(
  academicYearId: string,
  options?: {
    promoteStudents?: boolean;
    carryOverFees?: boolean;
    archiveData?: boolean;
    newAcademicYearId?: string;
    newAcademicYearName?: string;
  }
): Promise<{
  promotionResult?: any;
  carryoverResult?: any;
  archiveId?: string;
}> {
  const db = getDb();
  const year = await getAcademicYear(academicYearId);
  if (!year) throw new Error('Academic year not found');

  const results: any = {};

  // Promote students if requested
  if (options?.promoteStudents) {
    try {
      const { promoteAllStudents } = await import('./promotion');
      console.log('📚 Promoting students to next grade...');
      const promotionResult = await promoteAllStudents(year.organizationId, academicYearId);
      results.promotionResult = promotionResult;
      console.log(`✅ Promoted ${promotionResult.promoted} students, Graduated ${promotionResult.graduated} students`);
    } catch (error) {
      console.error('Error promoting students:', error);
      throw new Error('Failed to promote students');
    }
  }

  // Carry over fees if requested
  if (options?.carryOverFees && options?.newAcademicYearId && options?.newAcademicYearName) {
    try {
      const { carryOverUnpaidFees } = await import('./fee-carryover');
      console.log('💰 Carrying over unpaid fees...');
      const carryoverResult = await carryOverUnpaidFees(
        year.organizationId,
        academicYearId,
        options.newAcademicYearId,
        options.newAcademicYearName
      );
      results.carryoverResult = carryoverResult;
      console.log(`✅ Carried over ${carryoverResult.feesCarriedOver} fee records (GH₵${carryoverResult.totalAmountCarriedOver.toFixed(2)})`);
    } catch (error) {
      console.error('Error carrying over fees:', error);
      throw new Error('Failed to carry over fees');
    }
  }

  // Archive data if requested
  if (options?.archiveData) {
    try {
      const { archiveAcademicYear } = await import('./archive');
      console.log('📦 Archiving academic year data...');
      // Archive will be created in the component that has access to currentUser
      // Return a flag to indicate archiving was requested
      results.archiveRequested = true;
    } catch (error) {
      console.error('Error archiving data:', error);
      // Continue even if archiving fails
    }
  }

  // Update academic year status
  await updateDoc(doc(db, COLLECTION, academicYearId), {
    isCurrent: false,
    isActive: false,
    endedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log(`✅ Academic year ${year.name} ended successfully`);

  return results;
}

export async function addTermToAcademicYear(
  academicYearId: string,
  termData: AcademicTermInput
): Promise<void> {
  const db = getDb();
  const year = await getAcademicYear(academicYearId);
  if (!year) throw new Error('Academic year not found');
  const updatedTerms = [...year.terms, termData];
  await updateDoc(doc(db, COLLECTION, academicYearId), {
    terms: updatedTerms,
    updatedAt: Timestamp.now(),
  });
}

export async function updateTerm(
  academicYearId: string,
  termNumber: number,
  updates: Partial<AcademicTermInput>
): Promise<void> {
  const db = getDb();
  const year = await getAcademicYear(academicYearId);
  if (!year) throw new Error('Academic year not found');
  const updatedTerms = year.terms.map(term =>
    term.termNumber === termNumber ? { ...term, ...updates } : term
  );
  await updateDoc(doc(db, COLLECTION, academicYearId), {
    terms: updatedTerms,
    updatedAt: Timestamp.now(),
  });
}
