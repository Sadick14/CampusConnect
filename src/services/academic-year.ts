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
  }
): Promise<void> {
  const db = getDb();
  const year = await getAcademicYear(academicYearId);
  if (!year) throw new Error('Academic year not found');
  await updateDoc(doc(db, COLLECTION, academicYearId), {
    isCurrent: false,
    isActive: false,
    updatedAt: Timestamp.now(),
  });
  if (options?.promoteStudents) console.log('📚 Student promotion would happen here');
  if (options?.carryOverFees) console.log('💰 Fee carryover would happen here');
  if (options?.archiveData) console.log('📦 Data archival would happen here');
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
