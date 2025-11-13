'use server';
/**
 * @fileOverview Service for generating academic report cards.
 */

import { getStudentGrades, type Grade } from './grade';
import { getStudent } from './student';
import { getStudentAttendance, type Attendance } from './attendance';
import { getClass } from './class';
import { getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase-server';

/**
 * Subject grade information for report card.
 */
export interface SubjectGrade {
  subject: string;
  assessments: {
    type: string;
    name: string;
    score: number;
    maxScore: number;
    percentage: number;
    letterGrade: string;
    date: string;
    comments?: string;
  }[];
  averageScore: number;
  averagePercentage: number;
  letterGrade: string;
  position?: number; // Position in class for this subject
  classAverage?: number;
  remarks: string;
}

/**
 * Attendance summary for report card.
 */
export interface AttendanceSummary {
  totalDays: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  daysExcused: number;
  attendancePercentage: number;
}

/**
 * Overall performance summary.
 */
export interface PerformanceSummary {
  totalSubjects: number;
  averageScore: number;
  averagePercentage: number;
  overallGrade: string;
  classPosition?: number;
  totalStudents?: number;
  subjectsAbove80: number;
  subjectsAbove60: number;
  subjectsBelow40: number;
}

/**
 * Teacher/Class teacher remarks.
 */
export interface TeacherRemarks {
  classTeacher?: string;
  classTeacherComment?: string;
  headTeacherComment?: string;
  conduct?: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
  effort?: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
}

/**
 * Complete report card data.
 */
export interface ReportCard {
  // Student information
  studentId: string;
  studentName: string;
  studentNumber?: string;
  class: string;
  
  // Academic period
  term: string;
  academicYear: string;
  
  // School information
  schoolName: string;
  schoolLogoUrl?: string;
  
  // Academic performance
  subjects: SubjectGrade[];
  performance: PerformanceSummary;
  
  // Attendance
  attendance: AttendanceSummary;
  
  // Remarks and conduct
  remarks: TeacherRemarks;
  
  // Dates
  generatedDate: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Calculate letter grade from percentage.
 */
function calculateLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * Get grade remarks based on performance.
 */
function getGradeRemarks(percentage: number, letterGrade: string): string {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Very Good';
  if (percentage >= 70) return 'Good';
  if (percentage >= 60) return 'Satisfactory';
  if (percentage >= 50) return 'Fair';
  return 'Needs Improvement';
}

/**
 * Calculate attendance for a student within a date range.
 */
async function calculateAttendance(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceSummary> {
  const attendanceRecords = await getStudentAttendance(studentId, startDate, endDate);
  
  let daysPresent = 0;
  let daysAbsent = 0;
  let daysLate = 0;
  let daysExcused = 0;
  
  attendanceRecords.forEach(record => {
    if (record.present) {
      daysPresent++;
    } else {
      if (record.absenceReason === 'Late') {
        daysLate++;
      } else if (record.absenceReason === 'Excused') {
        daysExcused++;
      } else {
        daysAbsent++;
      }
    }
  });
  
  const totalDays = attendanceRecords.length;
  const attendancePercentage = totalDays > 0 ? (daysPresent / totalDays) * 100 : 0;
  
  return {
    totalDays,
    daysPresent,
    daysAbsent,
    daysLate,
    daysExcused,
    attendancePercentage
  };
}

/**
 * Group grades by subject and calculate subject averages.
 */
function groupGradesBySubject(grades: Grade[]): SubjectGrade[] {
  const subjectMap = new Map<string, Grade[]>();
  
  // Group grades by subject
  grades.forEach(grade => {
    const subject = grade.subject;
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, []);
    }
    subjectMap.get(subject)!.push(grade);
  });
  
  // Calculate subject averages and create subject grade objects
  const subjectGrades: SubjectGrade[] = [];
  
  subjectMap.forEach((subjectGrades_raw, subject) => {
    const assessments = subjectGrades_raw.map(grade => {
      const maxScore = grade.maxGrade || 100;
      const percentage = (grade.grade / maxScore) * 100;
      
      return {
        type: grade.assessmentType || 'other',
        name: grade.assessmentName || 'Assessment',
        score: grade.grade,
        maxScore,
        percentage,
        letterGrade: grade.letterGrade || calculateLetterGrade(percentage),
        date: grade.date || '',
        comments: grade.comments || undefined
      };
    });
    
    // Calculate average
    const totalPercentage = assessments.reduce((sum, a) => sum + a.percentage, 0);
    const averagePercentage = assessments.length > 0 ? totalPercentage / assessments.length : 0;
    const averageScore = averagePercentage; // For display
    const letterGrade = calculateLetterGrade(averagePercentage);
    const remarks = getGradeRemarks(averagePercentage, letterGrade);
    
    subjectGrades.push({
      subject,
      assessments,
      averageScore,
      averagePercentage,
      letterGrade,
      remarks
    });
  });
  
  // Sort subjects alphabetically
  subjectGrades.sort((a, b) => a.subject.localeCompare(b.subject));
  
  return subjectGrades;
}

/**
 * Calculate overall performance summary.
 */
function calculatePerformance(subjectGrades: SubjectGrade[]): PerformanceSummary {
  if (subjectGrades.length === 0) {
    return {
      totalSubjects: 0,
      averageScore: 0,
      averagePercentage: 0,
      overallGrade: 'N/A',
      subjectsAbove80: 0,
      subjectsAbove60: 0,
      subjectsBelow40: 0
    };
  }
  
  const totalPercentage = subjectGrades.reduce((sum, sg) => sum + sg.averagePercentage, 0);
  const averagePercentage = totalPercentage / subjectGrades.length;
  const averageScore = averagePercentage;
  const overallGrade = calculateLetterGrade(averagePercentage);
  
  const subjectsAbove80 = subjectGrades.filter(sg => sg.averagePercentage >= 80).length;
  const subjectsAbove60 = subjectGrades.filter(sg => sg.averagePercentage >= 60 && sg.averagePercentage < 80).length;
  const subjectsBelow40 = subjectGrades.filter(sg => sg.averagePercentage < 40).length;
  
  return {
    totalSubjects: subjectGrades.length,
    averageScore,
    averagePercentage,
    overallGrade,
    subjectsAbove80,
    subjectsAbove60,
    subjectsBelow40
  };
}

/**
 * Generate a report card for a student.
 *
 * @param studentId The student ID.
 * @param term The academic term.
 * @param academicYear The academic year.
 * @param startDate Optional start date for filtering.
 * @param endDate Optional end date for filtering.
 * @returns A promise that resolves to a ReportCard object.
 */
export async function generateReportCard(
  studentId: string,
  term: string,
  academicYear: string,
  startDate?: string,
  endDate?: string
): Promise<ReportCard> {
  // Fetch student information
  const student = await getStudent(studentId);
  if (!student) {
    throw new Error('Student not found');
  }
  
  // Fetch school information
  const db = getDb();
  const schoolRef = doc(db, 'schools', student.organizationId);
  const schoolSnap = await getDoc(schoolRef);
  const schoolData = schoolSnap.exists() ? schoolSnap.data() : null;
  
  // Fetch class information
  let className = student.currentClass || 'N/A';
  if (student.currentClass) {
    const classInfo = await getClass(student.currentClass);
    if (classInfo) {
      className = (classInfo as any).name || classInfo.id;
    }
  }
  
  // Fetch grades for the term
  const allGrades = await getStudentGrades(studentId, undefined, term);
  
  // Filter by academic year if provided
  const grades = academicYear 
    ? allGrades.filter(g => g.academicYear === academicYear)
    : allGrades;
  
  // Filter by date range if provided
  const filteredGrades = grades.filter(grade => {
    if (!grade.date) return true;
    if (startDate && grade.date < startDate) return false;
    if (endDate && grade.date > endDate) return false;
    return true;
  });
  
  // Group grades by subject
  const subjects = groupGradesBySubject(filteredGrades);
  
  // Calculate performance
  const performance = calculatePerformance(subjects);
  
  // Calculate attendance
  const attendance = await calculateAttendance(studentId, startDate, endDate);
  
  // Default remarks (can be customized later)
  const remarks: TeacherRemarks = {
    conduct: attendance.attendancePercentage >= 90 && performance.averagePercentage >= 80 ? 'Excellent' :
             attendance.attendancePercentage >= 80 && performance.averagePercentage >= 70 ? 'Very Good' :
             attendance.attendancePercentage >= 70 && performance.averagePercentage >= 60 ? 'Good' :
             attendance.attendancePercentage >= 60 ? 'Fair' : 'Poor',
    effort: performance.averagePercentage >= 80 ? 'Excellent' :
            performance.averagePercentage >= 70 ? 'Very Good' :
            performance.averagePercentage >= 60 ? 'Good' :
            performance.averagePercentage >= 50 ? 'Fair' : 'Poor'
  };
  
  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    studentNumber: student.studentIdNumber,
    class: className,
    term,
    academicYear,
    schoolName: schoolData?.name || 'School',
    schoolLogoUrl: schoolData?.logoUrl,
    subjects,
    performance,
    attendance,
    remarks,
    generatedDate: new Date().toISOString(),
    startDate,
    endDate
  };
}

/**
 * Generate report cards for all students in a class.
 *
 * @param classId The class ID.
 * @param organizationId The organization ID.
 * @param term The academic term.
 * @param academicYear The academic year.
 * @param startDate Optional start date.
 * @param endDate Optional end date.
 * @returns A promise that resolves to an array of ReportCard objects.
 */
export async function generateClassReportCards(
  classId: string,
  organizationId: string,
  term: string,
  academicYear: string,
  startDate?: string,
  endDate?: string
): Promise<ReportCard[]> {
  const { getStudentsByOrganization } = await import('./student');
  
  const students = await getStudentsByOrganization(organizationId, { classFilter: classId });
  
  const reportCards: ReportCard[] = [];
  
  for (const student of students) {
    try {
      const reportCard = await generateReportCard(
        student.id,
        term,
        academicYear,
        startDate,
        endDate
      );
      reportCards.push(reportCard);
    } catch (error) {
      console.error(`Error generating report card for student ${student.id}:`, error);
    }
  }
  
  // Sort by student name
  reportCards.sort((a, b) => a.studentName.localeCompare(b.studentName));
  
  return reportCards;
}

/**
 * Update teacher remarks on a report card.
 */
export async function updateReportCardRemarks(
  studentId: string,
  term: string,
  academicYear: string,
  remarks: Partial<TeacherRemarks>
): Promise<void> {
  const db = getDb();
  const { doc: firestoreDoc, setDoc } = await import('firebase/firestore');
  
  const reportCardRef = firestoreDoc(
    db,
    'reportCards',
    `${studentId}_${term}_${academicYear}`
  );
  
  await setDoc(reportCardRef, { remarks }, { merge: true });
}
