export type ReportType = 
  | 'student_performance' 
  | 'class_performance'
  | 'attendance_summary'
  | 'financial_summary'
  | 'fee_collection'
  | 'student_report_card'
  | 'term_report';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'term' | 'annual' | 'custom';

export interface ReportFilter {
  startDate?: Date | string;
  endDate?: Date | string;
  classId?: string;
  studentId?: string;
  academicYear?: string;
  term?: string;
}

export interface StudentPerformanceReport {
  studentId: string;
  studentName: string;
  className: string;
  subjects: {
    name: string;
    averageScore: number;
    grade: string;
    position?: number;
    teacher: string;
    comments?: string;
  }[];
  overallAverage: number;
  overallGrade: string;
  classPosition?: number;
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    percentage: number;
  };
  conduct: {
    punctuality: string;
    behavior: string;
    participation: string;
  };
  teacherRemarks?: string;
  headTeacherRemarks?: string;
}

export interface ClassPerformanceReport {
  classId: string;
  className: string;
  academicYear: string;
  term?: string;
  studentCount: number;
  subjects: {
    name: string;
    studentsCount: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number; // percentage
  }[];
  overallAverage: number;
  attendanceRate: number;
  topPerformers: {
    studentId: string;
    studentName: string;
    average: number;
  }[];
}

export interface AttendanceSummaryReport {
  period: string;
  classId?: string;
  className?: string;
  totalStudents: number;
  attendanceData: {
    date: Date | string;
    present: number;
    absent: number;
    late?: number;
    rate: number;
  }[];
  averageAttendanceRate: number;
  studentsWithPoorAttendance: {
    studentId: string;
    studentName: string;
    present: number;
    absent: number;
    rate: number;
  }[];
}

export interface FinancialSummaryReport {
  period: string;
  organizationId: string;
  schoolName: string;
  income: {
    fees: {
      expected: number;
      collected: number;
      pending: number;
      collectionRate: number;
    };
    subscription: {
      upfront: number;
      monthly: number;
      total: number;
    };
    other?: number;
  };
  expenses: {
    salaries?: number;
    utilities?: number;
    supplies?: number;
    maintenance?: number;
    other?: number;
    total: number;
  };
  netIncome: number;
  studentCount: number;
  averageRevenuePerStudent: number;
}

export interface FeeCollectionReport {
  period: string;
  classBreakdown: {
    classId: string;
    className: string;
    totalStudents: number;
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
  }[];
  feeTypeBreakdown: {
    feeType: string;
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
  }[];
  paymentMethodBreakdown: {
    method: string;
    amount: number;
    count: number;
  }[];
  overallSummary: {
    totalStudents: number;
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
  };
  defaulters: {
    studentId: string;
    studentName: string;
    className: string;
    amountDue: number;
    lastPaymentDate?: Date | string;
  }[];
}

export interface ReportMetadata {
  id: string;
  type: ReportType;
  title: string;
  organizationId: string;
  generatedBy: string;
  generatedAt: Date;
  period: ReportPeriod;
  filters: ReportFilter;
  format: 'pdf' | 'excel' | 'json';
}

// Helper function to calculate grade from score
export function calculateGrade(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  if (score >= 40) return 'E';
  return 'F';
}

// Helper function to get grade remark
export function getGradeRemark(grade: string): string {
  const remarks: Record<string, string> = {
    'A': 'Excellent',
    'B': 'Very Good',
    'C': 'Good',
    'D': 'Satisfactory',
    'E': 'Pass',
    'F': 'Fail',
  };
  return remarks[grade] || 'N/A';
}

// Helper function to format date range
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const formatOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`;
}
