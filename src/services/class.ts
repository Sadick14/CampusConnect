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
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  SchoolClass,
  Subject,
  TeacherAssignment,
  TimetableEntry,
  SchoolClassInput,
  SubjectInput,
  TeacherAssignmentInput,
  TimetableEntryInput,
} from '@/schemas/class';

const COLLECTION_PATHS = {
  classes: 'classes',
  subjects: 'subjects',
  teacherAssignments: 'teacher_assignments',
  timetables: 'timetables',
};

/**
 * CLASS OPERATIONS
 */

export async function createClass(classData: SchoolClassInput): Promise<SchoolClass> {
  const db = getDb();
  const now = Timestamp.now();
  const dataToSave = { ...classData, createdAt: now, updatedAt: now };
  const docRef = await addDoc(collection(db, COLLECTION_PATHS.classes), dataToSave);
  return { id: docRef.id, ...dataToSave } as SchoolClass;
}

export async function getClass(classId: string): Promise<SchoolClass | null> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_PATHS.classes, classId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as SchoolClass;
}

export async function getSchoolClasses(
  organizationId: string,
  academicYear?: string
): Promise<SchoolClass[]> {
  const db = getDb();
  const constraints: any[] = [where('organizationId', '==', organizationId)];
  if (academicYear) constraints.push(where('academicYear', '==', academicYear));
  constraints.push(orderBy('gradeLevel', 'asc'), orderBy('section', 'asc'));
  const q = query(collection(db, COLLECTION_PATHS.classes), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SchoolClass[];
}

export async function updateClass(
  classId: string,
  updates: Partial<SchoolClassInput>
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_PATHS.classes, classId);
  await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
}

export async function deleteClass(classId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTION_PATHS.classes, classId));
}

/**
 * SUBJECT OPERATIONS
 */

export async function createSubject(subjectData: SubjectInput): Promise<Subject> {
  const db = getDb();
  const now = Timestamp.now();
  const dataToSave = { ...subjectData, createdAt: now, updatedAt: now };
  const docRef = await addDoc(collection(db, COLLECTION_PATHS.subjects), dataToSave);
  return { id: docRef.id, ...dataToSave } as Subject;
}

export async function getSchoolSubjects(organizationId: string): Promise<Subject[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION_PATHS.subjects),
    where('organizationId', '==', organizationId),
    orderBy('name', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
}

export async function updateSubject(
  subjectId: string,
  updates: Partial<SubjectInput>
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_PATHS.subjects, subjectId);
  await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
}

export async function deleteSubject(subjectId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTION_PATHS.subjects, subjectId));
}

/**
 * TEACHER ASSIGNMENT OPERATIONS
 */

export async function assignTeacherToClass(
  assignmentData: TeacherAssignmentInput
): Promise<TeacherAssignment> {
  const db = getDb();
  const now = Timestamp.now();
  const dataToSave = { ...assignmentData, assignedAt: now };
  const docRef = await addDoc(collection(db, COLLECTION_PATHS.teacherAssignments), dataToSave);
  return { id: docRef.id, ...dataToSave } as TeacherAssignment;
}

export async function getClassTeacherAssignments(
  organizationId: string,
  classId: string,
  academicYear?: string
): Promise<TeacherAssignment[]> {
  const db = getDb();
  const constraints: any[] = [
    where('organizationId', '==', organizationId),
    where('classId', '==', classId),
  ];
  if (academicYear) constraints.push(where('academicYear', '==', academicYear));
  constraints.push(orderBy('subjectName', 'asc'));
  const q = query(collection(db, COLLECTION_PATHS.teacherAssignments), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherAssignment[];
}

export async function getTeacherAssignments(
  organizationId: string,
  teacherId: string,
  academicYear?: string
): Promise<TeacherAssignment[]> {
  const db = getDb();
  const constraints: any[] = [
    where('organizationId', '==', organizationId),
    where('teacherId', '==', teacherId),
  ];
  if (academicYear) constraints.push(where('academicYear', '==', academicYear));
  constraints.push(orderBy('className', 'asc'));
  const q = query(collection(db, COLLECTION_PATHS.teacherAssignments), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherAssignment[];
}

export async function updateTeacherAssignment(
  assignmentId: string,
  updates: Partial<TeacherAssignmentInput>
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_PATHS.teacherAssignments, assignmentId);
  await updateDoc(docRef, updates);
}

export async function removeTeacherAssignment(assignmentId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTION_PATHS.teacherAssignments, assignmentId));
}

/**
 * TIMETABLE OPERATIONS
 */

export async function createTimetableEntry(
  entryData: TimetableEntryInput
): Promise<TimetableEntry> {
  const db = getDb();
  const now = Timestamp.now();
  const dataToSave = { ...entryData, createdAt: now, updatedAt: now };
  const docRef = await addDoc(collection(db, COLLECTION_PATHS.timetables), dataToSave);
  return { id: docRef.id, ...dataToSave } as TimetableEntry;
}

export async function getClassTimetable(
  organizationId: string,
  classId: string,
  academicYear?: string
): Promise<TimetableEntry[]> {
  const db = getDb();
  const constraints: any[] = [
    where('organizationId', '==', organizationId),
    where('classId', '==', classId),
  ];
  if (academicYear) constraints.push(where('academicYear', '==', academicYear));
  constraints.push(orderBy('dayOfWeek', 'asc'), orderBy('period', 'asc'));
  const q = query(collection(db, COLLECTION_PATHS.timetables), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TimetableEntry[];
}

export async function getTeacherTimetable(
  organizationId: string,
  teacherId: string,
  academicYear?: string
): Promise<TimetableEntry[]> {
  const db = getDb();
  const constraints: any[] = [
    where('organizationId', '==', organizationId),
    where('teacherId', '==', teacherId),
  ];
  if (academicYear) constraints.push(where('academicYear', '==', academicYear));
  constraints.push(orderBy('dayOfWeek', 'asc'), orderBy('period', 'asc'));
  const q = query(collection(db, COLLECTION_PATHS.timetables), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TimetableEntry[];
}

export async function getSchoolTimetables(
  organizationId: string,
  filters?: { classId?: string; dayOfWeek?: string; academicYear?: string }
): Promise<TimetableEntry[]> {
  const db = getDb();
  const constraints: any[] = [where('organizationId', '==', organizationId)];
  if (filters?.classId && filters.classId !== 'all') constraints.push(where('classId', '==', filters.classId));
  if (filters?.dayOfWeek && filters.dayOfWeek !== 'all') constraints.push(where('dayOfWeek', '==', filters.dayOfWeek));
  if (filters?.academicYear) constraints.push(where('academicYear', '==', filters.academicYear));
  constraints.push(orderBy('dayOfWeek', 'asc'), orderBy('period', 'asc'));
  const q = query(collection(db, COLLECTION_PATHS.timetables), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as TimetableEntry[];
}

export async function updateTimetableEntry(
  entryId: string,
  updates: Partial<TimetableEntryInput>
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_PATHS.timetables, entryId);
  await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
}

export async function deleteTimetableEntry(entryId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTION_PATHS.timetables, entryId));
}

/**
 * UTILITY FUNCTIONS
 */

export async function getAvailableTeachers(
  organizationId: string,
  subjectId: string,
  academicYear: string
): Promise<any[]> {
  return [];
}

export async function checkTimetableConflicts(
  organizationId: string,
  classId: string,
  teacherId: string,
  dayOfWeek: string,
  period: number,
  academicYear: string,
  excludeEntryId?: string
): Promise<boolean> {
  const db = getDb();
  const classQuery = query(
    collection(db, COLLECTION_PATHS.timetables),
    where('organizationId', '==', organizationId),
    where('classId', '==', classId),
    where('dayOfWeek', '==', dayOfWeek),
    where('period', '==', period),
    where('academicYear', '==', academicYear)
  );
  const teacherQuery = query(
    collection(db, COLLECTION_PATHS.timetables),
    where('organizationId', '==', organizationId),
    where('teacherId', '==', teacherId),
    where('dayOfWeek', '==', dayOfWeek),
    where('period', '==', period),
    where('academicYear', '==', academicYear)
  );
  const [classSnapshot, teacherSnapshot] = await Promise.all([
    getDocs(classQuery),
    getDocs(teacherQuery),
  ]);
  const classConflicts = classSnapshot.docs.filter(doc => doc.id !== excludeEntryId);
  const teacherConflicts = teacherSnapshot.docs.filter(doc => doc.id !== excludeEntryId);
  return classConflicts.length > 0 || teacherConflicts.length > 0;
}
