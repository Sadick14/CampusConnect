/**
 * @fileOverview Comprehensive service functions for managing student data in Firestore.
 * Supports full student lifecycle including registration, management, and queries.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp,
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { 
  Student, 
  StudentFirestoreDoc,
  StudentRegistrationData,
  Guardian,
  MedicalInfo,
  AcademicInfo,
  StudentAddress
} from '@/schemas/student';

// Use client-side Firestore
const getDb = () => getFirestore(app);

/**
 * Retrieves a single student by ID with all detailed information
 */
export async function getStudent(id: string): Promise<Student | null> {
  try {
    const db = getDb();
    const studentRef = doc(db, 'students', id);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      console.warn(`Student not found: ${id}`);
      return null;
    }

    return convertFirestoreDocToStudent(studentSnap.id, studentSnap.data() as StudentFirestoreDoc);
  } catch (error: any) {
    console.error(`Error fetching student ${id}:`, error);
    throw new Error(`Failed to fetch student: ${error.message}`);
  }
}

/**
 * Retrieves all students for a specific organization with optional filtering
 */
export async function getStudentsByOrganization(
  organizationId: string,
  options?: {
    classFilter?: string;
    statusFilter?: string;
    limit?: number;
  }
): Promise<Student[]> {
  try {
    const db = getDb();
    const studentsRef = collection(db, 'students');
    
    // Simple query - just filter by organizationId
    const q = query(studentsRef, where('organizationId', '==', organizationId));
    const querySnapshot = await getDocs(q);
    
    let students: Student[] = [];
    querySnapshot.forEach((doc) => {
      const student = convertFirestoreDocToStudent(doc.id, doc.data() as StudentFirestoreDoc);
      students.push(student);
    });

    // Filter client-side if options provided
    if (options?.classFilter) {
      students = students.filter(s => s.currentClass === options.classFilter);
    }

    if (options?.statusFilter) {
      students = students.filter(s => s.status === options.statusFilter);
    }

    // Sort client-side by firstName
    students.sort((a, b) => {
      const nameA = a.firstName || '';
      const nameB = b.firstName || '';
      return nameA.localeCompare(nameB);
    });

    // Apply limit client-side if specified
    if (options?.limit) {
      students = students.slice(0, options.limit);
    }

    return students;
  } catch (error: any) {
    console.error(`Error fetching students for organization ${organizationId}:`, error);
    throw new Error(`Failed to fetch students: ${error.message}`);
  }
}

/**
 * Search students by name or student ID
 */
export async function searchStudents(
  organizationId: string,
  searchTerm: string
): Promise<Student[]> {
  try {
    const db = getDb();
    const studentsRef = collection(db, 'students');
    
    // Simple query - just filter by organizationId, then search client-side
    const q = query(
      studentsRef,
      where('organizationId', '==', organizationId)
    );
    
    const querySnapshot = await getDocs(q);
    const students: Student[] = [];
    
    const searchLower = searchTerm.toLowerCase();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as StudentFirestoreDoc;
      const fullName = `${data.firstName} ${data.lastName}`.toLowerCase();
      const studentId = data.studentIdNumber.toLowerCase();
      const admissionNumber = data.admissionNumber.toLowerCase();
      
      if (
        fullName.includes(searchLower) ||
        studentId.includes(searchLower) ||
        admissionNumber.includes(searchLower)
      ) {
        students.push(convertFirestoreDocToStudent(doc.id, data));
      }
    });

    // Sort client-side by firstName
    students.sort((a, b) => {
      const nameA = a.firstName || '';
      const nameB = b.firstName || '';
      return nameA.localeCompare(nameB);
    });

    return students;
  } catch (error: any) {
    console.error(`Error searching students:`, error);
    throw new Error(`Failed to search students: ${error.message}`);
  }
}

/**
 * Check if student ID number already exists in school
 */
export async function checkStudentIdExists(
  organizationId: string,
  studentId: string,
  excludeDocId?: string
): Promise<boolean> {
  try {
    const db = getDb();
    const studentsRef = collection(db, 'students');
    
    const q = query(
      studentsRef,
      where('organizationId', '==', organizationId),
      where('studentIdNumber', '==', studentId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }

    // If excluding a specific document (during update), check if any other has the same ID
    if (excludeDocId) {
      return querySnapshot.docs.some(doc => doc.id !== excludeDocId);
    }

    return true;
  } catch (error: any) {
    console.error(`Error checking student ID:`, error);
    throw new Error(`Failed to check student ID: ${error.message}`);
  }
}

/**
 * Create a new student with comprehensive information
 */
export async function createStudent(
  organizationId: string,
  data: StudentRegistrationData,
  createdBy?: string,
  isDraft: boolean = false
): Promise<Student> {
  try {
    console.log('[CreateStudent] Starting with organizationId:', organizationId);
    console.log('[CreateStudent] isDraft:', isDraft);
    console.log('[CreateStudent] Student name:', data.firstName, data.lastName);
    
    // Check if student ID already exists
    const exists = await checkStudentIdExists(organizationId, data.admissionNumber);
    if (exists) {
      throw new Error(`Student ID ${data.admissionNumber} already exists in this organization`);
    }

    const db = getDb();
    const studentsRef = collection(db, 'students');

    // Build primary guardian
    const primaryGuardian: Guardian = {
      name: data.guardianName,
      relationship: data.guardianRelationship,
      email: data.guardianEmail,
      phone: data.guardianPhone,
      occupation: data.guardianOccupation || null,
      isEmergencyContact: true,
    };

    // Build secondary guardian if provided
    const guardians: Guardian[] = [primaryGuardian];
    if (
      data.secondaryGuardianName &&
      data.secondaryGuardianEmail &&
      data.secondaryGuardianPhone
    ) {
      guardians.push({
        name: data.secondaryGuardianName,
        relationship: data.secondaryGuardianRelationship || 'guardian',
        email: data.secondaryGuardianEmail,
        phone: data.secondaryGuardianPhone,
        isEmergencyContact: false,
      });
    }

    // Build address
    const address: StudentAddress = {
      street: data.street,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      homePhone: data.homePhone || null,
    };

    // Build medical info
    const medicalInfo: MedicalInfo = {
      bloodGroup: data.bloodGroup || null,
      allergies: data.allergies || null,
      chronicConditions: data.chronicConditions || null,
      medicationsRequired: data.medicationsRequired || null,
    };

    // Build academic info
    const academicHistory: AcademicInfo = {
      admissionDate: data.admissionDate,
      admissionNumber: data.admissionNumber,
      previousSchool: data.previousSchool || null,
      previousClass: data.previousClass || null,
    };

    const studentData: StudentFirestoreDoc = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      email: data.email || null,
      phone: data.phone || null,
      currentClass: data.currentClass,
      section: data.section || null,
      rollNumber: data.rollNumber || null,
      admissionNumber: data.admissionNumber,
      studentIdNumber: data.admissionNumber,
      address,
      guardians,
      medicalInfo,
      academicHistory: {
        admissionDate: data.admissionDate,
        admissionNumber: data.admissionNumber,
        previousSchool: data.previousSchool || null,
        previousClass: data.previousClass || null,
      },
      status: isDraft ? 'draft' : (data.feePayments && data.feePayments.length > 0 ? 'active' : 'inactive'),
      enrollmentDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: createdBy || null,
      notes: data.notes || null,
      organizationId,
      // Initial fee payments (collected during registration)
      initialFeePayments: data.feePayments && data.feePayments.length > 0
        ? data.feePayments.map(payment => ({
            feeType: payment.feeType,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId,
            paymentDate: new Date().toISOString(),
            notes: payment.notes,
          }))
        : null,
      // Legacy fields for backward compatibility
      admissionFeePaid: data.feePayments?.some(p => p.feeType === 'admission') || false,
      admissionFeeAmount: data.feePayments?.find(p => p.feeType === 'admission')?.amount || null,
      admissionFeePaymentDate: data.feePayments?.find(p => p.feeType === 'admission') ? new Date().toISOString() : null,
      admissionFeePaymentMethod: data.feePayments?.find(p => p.feeType === 'admission')?.paymentMethod || null,
      admissionFeeTransactionId: data.feePayments?.find(p => p.feeType === 'admission')?.transactionId || null,
    };

    console.log('[CreateStudent] About to save student with organizationId:', studentData.organizationId);
    
    const docRef = await addDoc(studentsRef, studentData);
    console.log(`[CreateStudent] Student created successfully with ID: ${docRef.id}, organizationId: ${studentData.organizationId}`);

    const createdStudent = await getStudent(docRef.id);
    if (!createdStudent) {
      throw new Error('Failed to retrieve created student');
    }

    return createdStudent;
  } catch (error: any) {
    console.error('Error creating student:', error);
    throw new Error(`Failed to create student: ${error.message}`);
  }
}

/**
 * Update an existing student
 */
export async function updateStudent(
  id: string,
  updates: Partial<StudentRegistrationData>
): Promise<Student> {
  try {
    const db = getDb();
    const studentRef = doc(db, 'students', id);

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    // Map update fields
    if (updates.firstName) updateData.firstName = updates.firstName;
    if (updates.lastName) updateData.lastName = updates.lastName;
    if (updates.dateOfBirth) updateData.dateOfBirth = updates.dateOfBirth;
    if (updates.gender) updateData.gender = updates.gender;
    if (updates.email !== undefined) updateData.email = updates.email || null;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.currentClass) updateData.currentClass = updates.currentClass;
    if (updates.section !== undefined) updateData.section = updates.section || null;
    if (updates.rollNumber !== undefined) updateData.rollNumber = updates.rollNumber || null;

    // Update address if provided
    if (updates.street || updates.city || updates.state) {
      const currentStudent = await getStudent(id);
      if (currentStudent) {
        updateData.address = {
          ...currentStudent.address,
          street: updates.street || currentStudent.address.street,
          city: updates.city || currentStudent.address.city,
          state: updates.state || currentStudent.address.state,
          postalCode: updates.postalCode || currentStudent.address.postalCode,
          country: updates.country || currentStudent.address.country,
          homePhone: updates.homePhone ?? currentStudent.address.homePhone,
        };
      }
    }

    await updateDoc(studentRef, updateData);
    console.log(`Student ${id} updated successfully`);

    const updatedStudent = await getStudent(id);
    if (!updatedStudent) {
      throw new Error('Failed to retrieve updated student');
    }

    return updatedStudent;
  } catch (error: any) {
    console.error(`Error updating student ${id}:`, error);
    throw new Error(`Failed to update student: ${error.message}`);
  }
}

/**
 * Update student status (active, inactive, graduated, etc.)
 */
export async function updateStudentStatus(
  id: string,
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended',
  reason?: string
): Promise<Student> {
  try {
    const db = getDb();
    const studentRef = doc(db, 'students', id);

    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (status === 'transferred' || status === 'graduated') {
      updateData.withdrawalDate = Timestamp.now();
      if (reason) {
        updateData.withdrawalReason = reason;
      }
    }

    await updateDoc(studentRef, updateData);
    console.log(`Student ${id} status updated to ${status}`);

    const updatedStudent = await getStudent(id);
    if (!updatedStudent) {
      throw new Error('Failed to retrieve updated student');
    }

    return updatedStudent;
  } catch (error: any) {
    console.error(`Error updating student status:`, error);
    throw new Error(`Failed to update student status: ${error.message}`);
  }
}

/**
 * Delete a student record
 */
export async function deleteStudent(id: string): Promise<void> {
  try {
    const db = getDb();
    const studentRef = doc(db, 'students', id);
    
    await deleteDoc(studentRef);
    console.log(`Student ${id} deleted successfully`);
  } catch (error: any) {
    console.error(`Error deleting student ${id}:`, error);
    throw new Error(`Failed to delete student: ${error.message}`);
  }
}

/**
 * Get students by class
 */
export async function getStudentsByClass(
  organizationId: string,
  currentClass: string,
  section?: string
): Promise<Student[]> {
  try {
    return await getStudentsByOrganization(organizationId, {
      classFilter: currentClass,
      statusFilter: 'active',
    });
  } catch (error: any) {
    console.error(`Error fetching students for class:`, error);
    throw new Error(`Failed to fetch students: ${error.message}`);
  }
}

/**
 * Get count of students in organization
 */
export async function getStudentCount(organizationId: string): Promise<number> {
  try {
    const students = await getStudentsByOrganization(organizationId);
    return students.length;
  } catch (error: any) {
    console.error(`Error counting students:`, error);
    throw new Error(`Failed to count students: ${error.message}`);
  }
}

/**
 * Bulk import students from CSV data
 */
export async function bulkImportStudents(
  organizationId: string,
  csvData: Array<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    email?: string;
    phone?: string;
    currentClass: string; // Class ID
    rollNumber?: string;
    admissionNumber: string;
    admissionDate?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
  }>,
  createdBy: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const db = getDb();
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    try {
      // Validate required fields
      if (!row.firstName || !row.lastName || !row.dateOfBirth || !row.currentClass || !row.admissionNumber) {
        throw new Error(`Missing required fields`);
      }

      // Create student data
      const studentData: Partial<StudentFirestoreDoc> = {
        organizationId,
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        dateOfBirth: row.dateOfBirth,
        gender: row.gender || 'male',
        email: row.email || null,
        phone: row.phone || null,
        currentClass: row.currentClass,
        section: null, // No longer using section field
        rollNumber: row.rollNumber || null,
        admissionNumber: row.admissionNumber.trim(),
        studentIdNumber: row.admissionNumber.trim(), // Use admission number as student ID
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          homePhone: null,
        },
        guardians: row.guardianName ? [{
          name: row.guardianName,
          relationship: 'parent',
          email: row.guardianEmail || '',
          phone: row.guardianPhone || '',
          occupation: '',
          isEmergencyContact: true,
        }] : [],
        medicalInfo: {
          bloodGroup: null,
          allergies: null,
          chronicConditions: null,
          medicationsRequired: null,
          doctorName: null,
          doctorPhone: null,
          insuranceProvider: null,
          insurancePolicyNumber: null,
        },
        academicHistory: {
          admissionDate: row.admissionDate || new Date().toISOString().split('T')[0],
          admissionNumber: row.admissionNumber.trim(),
          previousSchool: null,
          previousClass: null,
        },
        profilePhotoUrl: null,
        admissionFormUrl: null,
        birthCertificateUrl: null,
        transferCertificateUrl: null,
        status: 'active',
        enrollmentDate: row.admissionDate ? Timestamp.fromDate(new Date(row.admissionDate)) : Timestamp.now(),
        withdrawalDate: null,
        withdrawalReason: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy,
        notes: null,
      };

      // Create student document
      await addDoc(collection(db, 'students'), studentData);
      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Row ${i + 2}: ${error.message}`); // Row number (accounting for header)
    }
  }

  return results;
}

/**
 * Convert Firestore document to Student interface
 */
function convertFirestoreDocToStudent(id: string, data: StudentFirestoreDoc): Student {
  return {
    id,
    organizationId: data.organizationId || data.organizationId || '', // Support both for migration
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    studentIdNumber: data.studentIdNumber,
    email: data.email,
    phone: data.phone,
    currentClass: data.currentClass,
    section: data.section,
    rollNumber: data.rollNumber,
    admissionNumber: data.admissionNumber,
    address: data.address,
    guardians: data.guardians,
    medicalInfo: data.medicalInfo,
    academicHistory: data.academicHistory,
    profilePhotoUrl: data.profilePhotoUrl,
    admissionFormUrl: data.admissionFormUrl,
    birthCertificateUrl: data.birthCertificateUrl,
    transferCertificateUrl: data.transferCertificateUrl,
    status: data.status,
    enrollmentDate: data.enrollmentDate.toDate().toISOString(),
    withdrawalDate: data.withdrawalDate?.toDate()?.toISOString() || null,
    withdrawalReason: data.withdrawalReason || null,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
    createdBy: data.createdBy,
    notes: data.notes,
  };
}

// Re-export types
export type { Student, StudentRegistrationData };
