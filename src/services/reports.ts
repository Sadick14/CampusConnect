import { getDb } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import type {
  StudentPerformanceReport,
  ClassPerformanceReport,
  AttendanceSummaryReport,
  FinancialSummaryReport,
  FeeCollectionReport,
  ReportFilter,
} from '@/schemas/report';
import { calculateGrade } from '@/schemas/report';

/**
 * Generate Student Performance Report
 */
export async function generateStudentPerformanceReport(
  organizationId: string,
  studentId: string,
  filter: ReportFilter
): Promise<StudentPerformanceReport | null> {
  try {
    const db = getDb();
    
    // Fetch student data
    const studentRef = collection(db, 'students');
    const studentQuery = query(
      studentRef,
      where('organizationId', '==', organizationId),
      where('__name__', '==', studentId)
    );
    const studentSnap = await getDocs(studentQuery);
    
    if (studentSnap.empty) {
      return null;
    }
    
    const studentData = studentSnap.docs[0].data();
    
    // Fetch grades
    const gradesRef = collection(db, 'grades');
    let gradesQuery = query(
      gradesRef,
      where('organizationId', '==', organizationId),
      where('studentId', '==', studentId)
    );
    
    if (filter.academicYear) {
      gradesQuery = query(gradesQuery, where('academicYear', '==', filter.academicYear));
    }
    if (filter.term) {
      gradesQuery = query(gradesQuery, where('term', '==', filter.term));
    }
    
    const gradesSnap = await getDocs(gradesQuery);
    
    // Process grades by subject
    const subjectGrades: Record<string, { scores: number[]; teacher: string }> = {};
    gradesSnap.forEach((doc) => {
      const grade = doc.data();
      if (!subjectGrades[grade.subject]) {
        subjectGrades[grade.subject] = { scores: [], teacher: grade.teacherName || 'N/A' };
      }
      subjectGrades[grade.subject].scores.push(grade.score || 0);
    });
    
    // Calculate subject averages
    const subjects = Object.entries(subjectGrades).map(([name, data]) => {
      const average = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
      return {
        name,
        averageScore: Math.round(average * 10) / 10,
        grade: calculateGrade(average),
        teacher: data.teacher,
      };
    });
    
    // Calculate overall average
    const overallAverage = subjects.reduce((sum, subj) => sum + subj.averageScore, 0) / subjects.length || 0;
    
    // Fetch attendance
    const attendanceRef = collection(db, 'attendance');
    let attendanceQuery = query(
      attendanceRef,
      where('organizationId', '==', organizationId),
      where(`students.${studentId}`, 'in', ['present', 'absent', 'late'])
    );
    
    if (filter.startDate && filter.endDate) {
      attendanceQuery = query(
        attendanceQuery,
        where('date', '>=', Timestamp.fromDate(new Date(filter.startDate))),
        where('date', '<=', Timestamp.fromDate(new Date(filter.endDate)))
      );
    }
    
    const attendanceSnap = await getDocs(attendanceQuery);
    let presentCount = 0;
    let absentCount = 0;
    
    attendanceSnap.forEach((doc) => {
      const attendance = doc.data();
      const status = attendance.students?.[studentId];
      if (status === 'present') presentCount++;
      if (status === 'absent') absentCount++;
    });
    
    const totalDays = presentCount + absentCount;
    const attendancePercentage = totalDays > 0 ? (presentCount / totalDays) * 100 : 0;
    
    return {
      studentId,
      studentName: studentData.firstName && studentData.lastName 
        ? `${studentData.firstName} ${studentData.lastName}`
        : 'Unknown Student',
      className: studentData.currentClass || 'N/A',
      subjects,
      overallAverage: Math.round(overallAverage * 10) / 10,
      overallGrade: calculateGrade(overallAverage),
      attendance: {
        totalDays,
        present: presentCount,
        absent: absentCount,
        percentage: Math.round(attendancePercentage * 10) / 10,
      },
      conduct: {
        punctuality: attendancePercentage >= 90 ? 'Excellent' : attendancePercentage >= 75 ? 'Good' : 'Needs Improvement',
        behavior: 'Good', // Placeholder - would need behavior tracking
        participation: 'Active', // Placeholder - would need participation tracking
      },
    };
  } catch (error) {
    console.error('Error generating student performance report:', error);
    throw error;
  }
}

/**
 * Generate Class Performance Report
 */
export async function generateClassPerformanceReport(
  organizationId: string,
  classId: string,
  filter: ReportFilter
): Promise<ClassPerformanceReport | null> {
  try {
    const db = getDb();
    
    // Fetch class data
    const classRef = collection(db, 'classes');
    const classQuery = query(
      classRef,
      where('organizationId', '==', organizationId),
      where('__name__', '==', classId)
    );
    const classSnap = await getDocs(classQuery);
    
    if (classSnap.empty) {
      return null;
    }
    
    const classData = classSnap.docs[0].data();
    
    // Fetch students in class
    const studentsRef = collection(db, 'students');
    const studentsQuery = query(
      studentsRef,
      where('organizationId', '==', organizationId),
      where('currentClass', '==', classId)
    );
    const studentsSnap = await getDocs(studentsQuery);
    const studentCount = studentsSnap.size;
    
    // Fetch all grades for this class
    const gradesRef = collection(db, 'grades');
    let gradesQuery = query(
      gradesRef,
      where('organizationId', '==', organizationId),
      where('classId', '==', classId)
    );
    
    if (filter.academicYear) {
      gradesQuery = query(gradesQuery, where('academicYear', '==', filter.academicYear));
    }
    if (filter.term) {
      gradesQuery = query(gradesQuery, where('term', '==', filter.term));
    }
    
    const gradesSnap = await getDocs(gradesQuery);
    
    // Group by subject
    const subjectData: Record<string, number[]> = {};
    gradesSnap.forEach((doc) => {
      const grade = doc.data();
      if (!subjectData[grade.subject]) {
        subjectData[grade.subject] = [];
      }
      subjectData[grade.subject].push(grade.score || 0);
    });
    
    // Calculate subject statistics
    const subjects = Object.entries(subjectData).map(([name, scores]) => {
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const passCount = scores.filter(score => score >= 50).length;
      return {
        name,
        studentsCount: scores.length,
        averageScore: Math.round(average * 10) / 10,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        passRate: Math.round((passCount / scores.length) * 100),
      };
    });
    
    const overallAverage = subjects.reduce((sum, subj) => sum + subj.averageScore, 0) / subjects.length || 0;
    
    return {
      classId,
      className: classData.name || 'Unknown Class',
      academicYear: filter.academicYear || 'N/A',
      term: filter.term,
      studentCount,
      subjects,
      overallAverage: Math.round(overallAverage * 10) / 10,
      attendanceRate: 85, // Placeholder - would calculate from attendance data
      topPerformers: [], // Would calculate from student averages
    };
  } catch (error) {
    console.error('Error generating class performance report:', error);
    throw error;
  }
}

/**
 * Generate Fee Collection Report
 */
export async function generateFeeCollectionReport(
  organizationId: string,
  filter: ReportFilter
): Promise<FeeCollectionReport> {
  try {
    const db = getDb();
    
    // Fetch all fees
    const feesRef = collection(db, 'fees');
    let feesQuery = query(
      feesRef,
      where('organizationId', '==', organizationId)
    );
    
    if (filter.startDate && filter.endDate) {
      feesQuery = query(
        feesQuery,
        where('dueDate', '>=', Timestamp.fromDate(new Date(filter.startDate))),
        where('dueDate', '<=', Timestamp.fromDate(new Date(filter.endDate)))
      );
    }
    
    const feesSnap = await getDocs(feesQuery);
    
    let totalExpected = 0;
    let totalCollected = 0;
    const classBreakdownMap: Record<string, any> = {};
    const feeTypeBreakdownMap: Record<string, any> = {};
    const defaultersList: any[] = [];
    
    feesSnap.forEach((doc) => {
      const fee = doc.data();
      const expected = fee.amount || 0;
      const collected = fee.paidAmount || 0;
      const pending = expected - collected;
      
      totalExpected += expected;
      totalCollected += collected;
      
      // Class breakdown
      const classId = fee.className || 'Unknown';
      if (!classBreakdownMap[classId]) {
        classBreakdownMap[classId] = {
          classId,
          className: classId,
          totalStudents: 0,
          totalExpected: 0,
          totalCollected: 0,
          totalPending: 0,
        };
      }
      classBreakdownMap[classId].totalStudents += 1;
      classBreakdownMap[classId].totalExpected += expected;
      classBreakdownMap[classId].totalCollected += collected;
      classBreakdownMap[classId].totalPending += pending;
      
      // Fee type breakdown
      const feeType = fee.feeType || 'General';
      if (!feeTypeBreakdownMap[feeType]) {
        feeTypeBreakdownMap[feeType] = {
          feeType,
          totalExpected: 0,
          totalCollected: 0,
          totalPending: 0,
        };
      }
      feeTypeBreakdownMap[feeType].totalExpected += expected;
      feeTypeBreakdownMap[feeType].totalCollected += collected;
      feeTypeBreakdownMap[feeType].totalPending += pending;
      
      // Track defaulters
      if (pending > 0 && fee.paymentStatus !== 'paid') {
        defaultersList.push({
          studentId: fee.studentId || '',
          studentName: fee.studentName || 'Unknown',
          className: classId,
          amountDue: pending,
        });
      }
    });
    
    // Calculate collection rates
    const classBreakdown = Object.values(classBreakdownMap).map((item: any) => ({
      ...item,
      collectionRate: item.totalExpected > 0 
        ? Math.round((item.totalCollected / item.totalExpected) * 100) 
        : 0,
    }));
    
    const feeTypeBreakdown = Object.values(feeTypeBreakdownMap).map((item: any) => ({
      ...item,
      collectionRate: item.totalExpected > 0 
        ? Math.round((item.totalCollected / item.totalExpected) * 100) 
        : 0,
    }));
    
    return {
      period: filter.startDate && filter.endDate 
        ? `${new Date(filter.startDate).toLocaleDateString()} - ${new Date(filter.endDate).toLocaleDateString()}`
        : 'All Time',
      classBreakdown,
      feeTypeBreakdown,
      paymentMethodBreakdown: [], // Would fetch from payment records
      overallSummary: {
        totalStudents: feesSnap.size,
        totalExpected,
        totalCollected,
        totalPending: totalExpected - totalCollected,
        collectionRate: totalExpected > 0 
          ? Math.round((totalCollected / totalExpected) * 100) 
          : 0,
      },
      defaulters: defaultersList.slice(0, 20), // Top 20 defaulters
    };
  } catch (error) {
    console.error('Error generating fee collection report:', error);
    throw error;
  }
}
