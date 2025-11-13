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
  
  // Simple query - just filter by organizationId, no ordering in Firebase
  const q = query(
    collection(db, COLLECTION_PATHS.classes),
    where('organizationId', '==', organizationId)
  );
  
  const snapshot = await getDocs(q);
  let classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SchoolClass[];
  
  // Filter by academicYear client-side if provided
  if (academicYear) {
    classes = classes.filter(c => c.academicYear === academicYear);
  }
  
  // Sort client-side by gradeLevel and section
  classes.sort((a, b) => {
    // First sort by grade level
    const gradeA = a.gradeLevel || '';
    const gradeB = b.gradeLevel || '';
    const gradeCompare = gradeA.localeCompare(gradeB);
    
    if (gradeCompare !== 0) return gradeCompare;
    
    // Then sort by section
    const sectionA = a.section || '';
    const sectionB = b.section || '';
    return sectionA.localeCompare(sectionB);
  });
  
  return classes;
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
  
  // Simple query - just filter by organizationId, no ordering in Firebase
  const q = query(
    collection(db, COLLECTION_PATHS.subjects),
    where('organizationId', '==', organizationId)
  );
  
  const snapshot = await getDocs(q);
  const subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
  
  // Sort client-side by name
  subjects.sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB);
  });
  
  return subjects;
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
  
  // Simple query - just filter by organizationId and classId
  const q = query(
    collection(db, COLLECTION_PATHS.teacherAssignments),
    where('organizationId', '==', organizationId),
    where('classId', '==', classId)
  );
  
  const snapshot = await getDocs(q);
  let assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherAssignment[];
  
  // Filter by academicYear client-side if provided
  if (academicYear) {
    assignments = assignments.filter(a => a.academicYear === academicYear);
  }
  
  // Sort client-side by subjectName
  assignments.sort((a, b) => {
    const nameA = a.subjectName || '';
    const nameB = b.subjectName || '';
    return nameA.localeCompare(nameB);
  });
  
  return assignments;
}

export async function getTeacherAssignments(
  organizationId: string,
  teacherId: string,
  academicYear?: string
): Promise<TeacherAssignment[]> {
  const db = getDb();
  
  // Simple query - just filter by organizationId and teacherId
  const q = query(
    collection(db, COLLECTION_PATHS.teacherAssignments),
    where('organizationId', '==', organizationId),
    where('teacherId', '==', teacherId)
  );
  
  const snapshot = await getDocs(q);
  let assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherAssignment[];
  
  // Filter by academicYear client-side if provided
  if (academicYear) {
    assignments = assignments.filter(a => a.academicYear === academicYear);
  }
  
  // Sort client-side by className
  assignments.sort((a, b) => {
    const nameA = a.className || '';
    const nameB = b.className || '';
    return nameA.localeCompare(nameB);
  });
  
  return assignments;
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
  
  // Simple query - just filter by organizationId and classId
  const q = query(
    collection(db, COLLECTION_PATHS.timetables),
    where('organizationId', '==', organizationId),
    where('classId', '==', classId)
  );
  
  const snapshot = await getDocs(q);
  let entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TimetableEntry[];
  
  // Filter by academicYear client-side if provided
  if (academicYear) {
    entries = entries.filter(e => e.academicYear === academicYear);
  }
  
  // Sort client-side by dayOfWeek and period
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  entries.sort((a, b) => {
    const dayA = dayOrder.indexOf(a.dayOfWeek || '');
    const dayB = dayOrder.indexOf(b.dayOfWeek || '');
    const dayCompare = dayA - dayB;
    if (dayCompare !== 0) return dayCompare;
    return (a.period || 0) - (b.period || 0);
  });
  
  return entries;
}

export async function getTeacherTimetable(
  organizationId: string,
  teacherId: string,
  academicYear?: string
): Promise<TimetableEntry[]> {
  const db = getDb();
  
  // Simple query - just filter by organizationId and teacherId
  const q = query(
    collection(db, COLLECTION_PATHS.timetables),
    where('organizationId', '==', organizationId),
    where('teacherId', '==', teacherId)
  );
  
  const snapshot = await getDocs(q);
  let entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TimetableEntry[];
  
  // Filter by academicYear client-side if provided
  if (academicYear) {
    entries = entries.filter(e => e.academicYear === academicYear);
  }
  
  // Sort client-side by dayOfWeek and period
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  entries.sort((a, b) => {
    const dayA = dayOrder.indexOf(a.dayOfWeek || '');
    const dayB = dayOrder.indexOf(b.dayOfWeek || '');
    const dayCompare = dayA - dayB;
    if (dayCompare !== 0) return dayCompare;
    return (a.period || 0) - (b.period || 0);
  });
  
  return entries;
}

export async function getSchoolTimetables(
  organizationId: string,
  filters?: { classId?: string; dayOfWeek?: string; academicYear?: string }
): Promise<TimetableEntry[]> {
  const db = getDb();
  
  // Simple query - just filter by organizationId
  const q = query(
    collection(db, COLLECTION_PATHS.timetables),
    where('organizationId', '==', organizationId)
  );
  
  const snapshot = await getDocs(q);
  let entries = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as TimetableEntry[];
  
  // Filter client-side based on provided filters
  if (filters?.classId && filters.classId !== 'all') {
    entries = entries.filter(e => e.classId === filters.classId);
  }
  if (filters?.dayOfWeek && filters.dayOfWeek !== 'all') {
    entries = entries.filter(e => e.dayOfWeek === filters.dayOfWeek);
  }
  if (filters?.academicYear) {
    entries = entries.filter(e => e.academicYear === filters.academicYear);
  }
  
  // Sort client-side by dayOfWeek and period
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  entries.sort((a, b) => {
    const dayA = dayOrder.indexOf(a.dayOfWeek || '');
    const dayB = dayOrder.indexOf(b.dayOfWeek || '');
    const dayCompare = dayA - dayB;
    if (dayCompare !== 0) return dayCompare;
    return (a.period || 0) - (b.period || 0);
  });
  
  return entries;
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
