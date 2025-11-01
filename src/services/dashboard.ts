import {
  collection,
  query,
  where,
  getDocs,
  collectionGroup,
  QueryConstraint,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalStaff: number;
  totalClasses: number;
  attendanceRate: number;
  fees: {
    collected: number;
    pending: number;
    total: number;
  };
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  graduated: number;
  transferred: number;
  suspended: number;
  byGrade: Record<string, number>;
}

export interface RecentActivity {
  id: string;
  type: 'student_enrolled' | 'staff_added' | 'fee_paid' | 'attendance_marked' | 'grade_submitted';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

/**
 * Get comprehensive dashboard statistics for an organization
 */
export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  try {
    const db = getDb();
    
    // Get students count and status
    const studentsRef = collection(db, 'students');
    const studentsQuery = query(studentsRef, where('organizationId', '==', organizationId));
    const studentDocs = await getDocs(studentsQuery);
    
    const totalStudents = studentDocs.size;
    const activeStudents = studentDocs.docs.filter(
      doc => doc.data().status === 'active'
    ).length;

    // Get staff count
    const staffRef = collection(db, 'staff');
    const staffQuery = query(staffRef, where('organizationId', '==', organizationId));
    const staffDocs = await getDocs(staffQuery);
    const totalStaff = staffDocs.size;

    // Get unique classes
    const classes = new Set<string>();
    studentDocs.docs.forEach(doc => {
      if (doc.data().currentClass) {
        classes.add(doc.data().currentClass);
      }
    });
    const totalClasses = classes.size;

    // Calculate attendance rate (average from recent records)
    const attendanceRef = collection(db, 'attendance');
    const attendanceQuery = query(
      attendanceRef,
      where('organizationId', '==', organizationId)
    );
    const attendanceDocs = await getDocs(attendanceQuery);
    
    let attendanceRate = 0;
    if (attendanceDocs.size > 0) {
      const total = attendanceDocs.docs.reduce((sum, doc) => {
        const status = doc.data().status;
        return sum + (status === 'present' || status === 'present_with_note' ? 1 : 0);
      }, 0);
      attendanceRate = Math.round((total / attendanceDocs.size) * 100);
    }

    // Get fees statistics
    const feesRef = collection(db, 'fees');
    const feesQuery = query(feesRef, where('organizationId', '==', organizationId));
    const feesDocs = await getDocs(feesQuery);
    
    let collected = 0;
    let pending = 0;
    feesDocs.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'paid') {
        collected += data.amount || 0;
      } else if (data.status === 'pending') {
        pending += data.amount || 0;
      }
    });

    return {
      totalStudents,
      activeStudents,
      totalStaff,
      totalClasses,
      attendanceRate,
      fees: {
        collected,
        pending,
        total: collected + pending,
      },
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
}

/**
 * Get detailed student statistics
 */
export async function getStudentStats(organizationId: string): Promise<StudentStats> {
  try {
    const db = getDb();
    const studentsRef = collection(db, 'students');
    const studentsQuery = query(studentsRef, where('organizationId', '==', organizationId));
    const studentDocs = await getDocs(studentsQuery);

    const stats: StudentStats = {
      total: studentDocs.size,
      active: 0,
      inactive: 0,
      graduated: 0,
      transferred: 0,
      suspended: 0,
      byGrade: {},
    };

    studentDocs.docs.forEach(doc => {
      const data = doc.data();
      
      // Count by status
      switch (data.status) {
        case 'active':
          stats.active++;
          break;
        case 'inactive':
          stats.inactive++;
          break;
        case 'graduated':
          stats.graduated++;
          break;
        case 'transferred':
          stats.transferred++;
          break;
        case 'suspended':
          stats.suspended++;
          break;
      }

      // Count by grade/class
      if (data.currentClass) {
        stats.byGrade[data.currentClass] = (stats.byGrade[data.currentClass] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting student stats:', error);
    throw error;
  }
}

/**
 * Get recent activities for dashboard
 */
export async function getRecentActivities(
  organizationId: string,
  limit: number = 10
): Promise<RecentActivity[]> {
  try {
    const db = getDb();
    const activities: RecentActivity[] = [];

    // Get recent student enrollments
    const studentsRef = collection(db, 'students');
    const studentsQuery = query(
      studentsRef,
      where('organizationId', '==', organizationId)
    );
    const studentDocs = await getDocs(studentsQuery);
    
    studentDocs.docs.slice(0, 5).forEach(doc => {
      const data = doc.data();
      activities.push({
        id: `student_${doc.id}`,
        type: 'student_enrolled',
        title: 'Student Enrolled',
        description: `${data.firstName} ${data.lastName} enrolled in ${data.currentClass}`,
        timestamp: data.enrollmentDate,
        icon: '👤',
      });
    });

    // Get recent staff additions
    const staffRef = collection(db, 'staff');
    const staffQuery = query(staffRef, where('organizationId', '==', organizationId));
    const staffDocs = await getDocs(staffQuery);
    
    staffDocs.docs.slice(0, 3).forEach(doc => {
      const data = doc.data();
      activities.push({
        id: `staff_${doc.id}`,
        type: 'staff_added',
        title: 'Staff Member Added',
        description: `${data.name} joined as ${data.designation}`,
        timestamp: data.joinDate || new Date().toISOString(),
        icon: '👨‍💼',
      });
    });

    // Sort by timestamp and return limited results
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return activities.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    throw error;
  }
}

/**
 * Get attendance statistics for the current month
 */
export async function getAttendanceStats(organizationId: string) {
  try {
    const db = getDb();
    const attendanceRef = collection(db, 'attendance');
    const attendanceQuery = query(
      attendanceRef,
      where('organizationId', '==', organizationId)
    );
    const attendanceDocs = await getDocs(attendanceQuery);

    const stats = {
      present: 0,
      absent: 0,
      leave: 0,
      late: 0,
    };

    attendanceDocs.docs.forEach(doc => {
      const status = doc.data().status;
      if (status === 'present' || status === 'present_with_note') {
        stats.present++;
      } else if (status === 'absent') {
        stats.absent++;
      } else if (status === 'leave' || status === 'on_leave') {
        stats.leave++;
      } else if (status === 'late') {
        stats.late++;
      }
    });

    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    const presentPercentage = total > 0 ? Math.round((stats.present / total) * 100) : 0;

    return {
      ...stats,
      total,
      presentPercentage,
    };
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    throw error;
  }
}

/**
 * Get fee collection statistics
 */
export async function getFeeStats(organizationId: string) {
  try {
    const db = getDb();
    const feesRef = collection(db, 'fees');
    const feesQuery = query(feesRef, where('organizationId', '==', organizationId));
    const feesDocs = await getDocs(feesQuery);

    let paid = 0;
    let pending = 0;
    let partial = 0;

    feesDocs.docs.forEach(doc => {
      const data = doc.data();
      const amount = data.amount || 0;
      
      if (data.status === 'paid') {
        paid += amount;
      } else if (data.status === 'pending') {
        pending += amount;
      } else if (data.status === 'partial') {
        partial += amount;
      }
    });

    const total = paid + pending + partial;
    const collectionRate = total > 0 ? Math.round((paid / total) * 100) : 0;

    return {
      paid,
      pending,
      partial,
      total,
      collectionRate,
      recordsCount: feesDocs.size,
    };
  } catch (error) {
    console.error('Error getting fee stats:', error);
    throw error;
  }
}

/**
 * Get grade/class distribution
 */
export async function getGradeDistribution(organizationId: string) {
  try {
    const db = getDb();
    const studentsRef = collection(db, 'students');
    const studentsQuery = query(studentsRef, where('organizationId', '==', organizationId));
    const studentDocs = await getDocs(studentsQuery);

    const distribution: Record<string, number> = {};

    studentDocs.docs.forEach(doc => {
      const currentClass = doc.data().currentClass;
      if (currentClass) {
        distribution[currentClass] = (distribution[currentClass] || 0) + 1;
      }
    });

    return Object.entries(distribution)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => {
        // Try to sort naturally (Grade 1, Grade 2, etc.)
        const numA = parseInt(a.grade.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.grade.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
  } catch (error) {
    console.error('Error getting grade distribution:', error);
    throw error;
  }
}
