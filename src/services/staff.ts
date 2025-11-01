import { getDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { StaffMember, StaffMemberInput } from '@/schemas/staff';

const COLLECTION = 'staff';

export async function getStaff(id: string): Promise<StaffMember | null> {
  const db = getDb();
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as StaffMember;
}

export async function getSchoolStaff(
  organizationId: string,
  opts?: { role?: StaffMember['role']; onlyActive?: boolean }
): Promise<StaffMember[]> {
  const db = getDb();
  const col = collection(db, COLLECTION);
  const constraints: any[] = [where('organizationId', '==', organizationId)];
  if (opts?.role) constraints.push(where('role', '==', opts.role));
  if (opts?.onlyActive) constraints.push(where('isActive', '==', true));
  constraints.push(orderBy('name', 'asc'));
  const q = query(col, ...constraints);
  const snaps = await getDocs(q);
  return snaps.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as StaffMember[];
}

export async function createStaff(data: StaffMemberInput): Promise<StaffMember> {
  const db = getDb();
  const now = Timestamp.now();
  const toSave = {
    organizationId: data.organizationId,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    role: data.role,
    department: data.department ?? null,
    subjects: data.subjects ?? [],
    qualification: data.qualification ?? null,
    experience: data.experience ?? null,
    salary: data.salary ?? null,
    isActive: data.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, COLLECTION), toSave);
  return { id: docRef.id, ...toSave } as StaffMember;
}

export async function updateStaff(id: string, updates: Partial<StaffMemberInput>): Promise<void> {
  const db = getDb();
  const ref = doc(db, COLLECTION, id);
  const toUpdate: any = { ...updates, updatedAt: Timestamp.now() };
  await updateDoc(ref, toUpdate);
}

export async function deleteStaff(id: string): Promise<void> {
  const db = getDb();
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

export async function getTeachers(organizationId: string): Promise<StaffMember[]> {
  return getSchoolStaff(organizationId, { role: 'teacher', onlyActive: true });
}
