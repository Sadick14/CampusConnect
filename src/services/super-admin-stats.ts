/**
 * Super Admin Statistics Service
 * Provides system-wide analytics and metrics for the super admin dashboard
 */

import { collection, query, where, getDocs, getDoc, doc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface SystemStats {
  totalSchools: number;
  activeSchools: number;
  inactiveSchools: number;
  suspendedSchools: number;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  activeAcademicSessions: number;
}

export interface SchoolActivity {
  id: string;
  schoolId: string;
  name: string;
  schoolName: string;
  lastActivity: string | null;
  activeUsers: number;
  totalUsers: number;
  studentCount: number;
  teacherCount: number;
  subscriptionStatus: 'active' | 'trial' | 'expired' | 'suspended';
  subscriptionExpiry?: string;
  revenue: number;
  totalRevenue: number;
}

export interface RevenueMetrics {
  daily: number;
  weekly: number;
  monthly: number;
  quarterly: number;
  yearly: number;
  bySchool: Array<{
    schoolId: string;
    schoolName: string;
    amount: number;
  }>;
}

export interface UserGrowth {
  date: string;
  students: number;
  teachers: number;
  admins: number;
  total: number;
}

export interface SystemHealth {
  uptime: number;
  activeConnections: number;
  averageResponseTime: number;
  errorRate: number;
  databaseSize: number;
  storageUsed: number;
  apiCallsToday: number;
}

/**
 * Get comprehensive system statistics
 */
export async function getSystemStats(): Promise<SystemStats> {
  const db = getDb();
  
  try {
    // Fetch all schools
    const schoolsRef = collection(db, 'schools');
    const schoolsSnap = await getDocs(schoolsRef);
    
    const totalSchools = schoolsSnap.size;
    let activeSchools = 0;
    let inactiveSchools = 0;
    let suspendedSchools = 0;
    
    schoolsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.subscriptionStatus === 'active' || data.subscriptionStatus === 'trial') activeSchools++;
      else if (data.subscriptionStatus === 'suspended') suspendedSchools++;
      else inactiveSchools++;
    });
    
    // Fetch all users
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    
    let totalStudents = 0;
    let totalTeachers = 0;
    let totalAdmins = 0;
    
    usersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.role === 'student') totalStudents++;
      else if (data.role === 'teacher') totalTeachers++;
      else if (data.role === 'school_admin' || data.role === 'organization_owner') totalAdmins++;
    });
    
    const totalUsers = usersSnap.size;
    
    // Fetch payment data
    const paymentsRef = collection(db, 'payments');
    const paymentsSnap = await getDocs(paymentsRef);
    
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let pendingPayments = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    paymentsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'approved') {
        totalRevenue += data.amount || 0;
        
        const paymentDate = data.paidAt?.toDate?.() || data.createdAt?.toDate?.();
        if (paymentDate && 
            paymentDate.getMonth() === currentMonth && 
            paymentDate.getFullYear() === currentYear) {
          monthlyRevenue += data.amount || 0;
        }
      } else if (data.status === 'pending') {
        pendingPayments++;
      }
    });
    
    // Count active academic sessions
    const subscriptionsRef = collection(db, 'subscriptions');
    const activeSessionsQuery = query(subscriptionsRef, where('subscriptionStatus', '==', 'active'));
    const activeSessionsSnap = await getDocs(activeSessionsQuery);
    
    return {
      totalSchools,
      activeSchools,
      inactiveSchools,
      suspendedSchools,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalRevenue,
      monthlyRevenue,
      pendingPayments,
      activeAcademicSessions: activeSessionsSnap.size,
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
}

/**
 * Get school activity data
 */
export async function getSchoolActivities(): Promise<SchoolActivity[]> {
  const db = getDb();
  
  try {
    const schoolsRef = collection(db, 'schools');
    const schoolsSnap = await getDocs(schoolsRef);
    
    const activities: SchoolActivity[] = [];
    
    for (const schoolDoc of schoolsSnap.docs) {
      const schoolData = schoolDoc.data();
      
      // Get user counts for this school
      const usersRef = collection(db, 'users');
      const schoolUsersQuery = query(usersRef, where('schoolId', '==', schoolDoc.id));
      const schoolUsersSnap = await getDocs(schoolUsersQuery);
      
      let studentCount = 0;
      let teacherCount = 0;
      let activeUsers = 0;
      
      schoolUsersSnap.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.role === 'student') studentCount++;
        else if (userData.role === 'teacher') teacherCount++;
        
        // Count users active in last 7 days
        const lastLogin = userData.lastLoginAt?.toDate?.();
        if (lastLogin) {
          const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLogin <= 7) activeUsers++;
        }
      });
      
      // Get subscription info
      const subscriptionRef = doc(db, 'subscriptions', schoolDoc.id);
      const subscriptionSnap = await getDoc(subscriptionRef);
      const subscriptionData = subscriptionSnap.data();
      
      // Get revenue for this school
      const paymentsRef = collection(db, 'payments');
      const schoolPaymentsQuery = query(paymentsRef, where('schoolId', '==', schoolDoc.id), where('status', '==', 'approved'));
      const schoolPaymentsSnap = await getDocs(schoolPaymentsQuery);
      
      let totalRevenue = 0;
      schoolPaymentsSnap.forEach((doc) => {
        totalRevenue += doc.data().amount || 0;
      });
      
      activities.push({
        id: schoolDoc.id,
        schoolId: schoolDoc.id,
        name: schoolData.name || 'Unknown School',
        schoolName: schoolData.name || 'Unknown School',
        lastActivity: schoolData.lastActivityAt?.toDate?.()?.toISOString() || null,
        activeUsers,
        totalUsers: schoolUsersSnap.size,
        studentCount,
        teacherCount,
        subscriptionStatus: subscriptionData?.subscriptionStatus || 'trial',
        subscriptionExpiry: subscriptionData?.subscriptionEndDate?.toDate?.()?.toISOString(),
        revenue: totalRevenue,
        totalRevenue,
      });
    }
    
    return activities.sort((a, b) => {
      const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error fetching school activities:', error);
    throw error;
  }
}

/**
 * Get revenue metrics
 */
export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const db = getDb();
  
  try {
    const paymentsRef = collection(db, 'payments');
    const approvedPaymentsQuery = query(paymentsRef, where('status', '==', 'approved'));
    const paymentsSnap = await getDocs(approvedPaymentsQuery);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const quarterAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    let daily = 0;
    let weekly = 0;
    let monthly = 0;
    let quarterly = 0;
    let yearly = 0;
    
    const bySchoolMap: Map<string, { name: string; amount: number }> = new Map();
    
    paymentsSnap.forEach((doc) => {
      const data = doc.data();
      const amount = data.amount || 0;
      const paymentDate = data.reviewedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date();
      
      // Daily
      if (paymentDate >= today) daily += amount;
      
      // Weekly
      if (paymentDate >= weekAgo) weekly += amount;
      
      // Monthly
      if (paymentDate >= monthAgo) monthly += amount;
      
      // Quarterly
      if (paymentDate >= quarterAgo) quarterly += amount;
      
      // Yearly
      if (paymentDate >= yearAgo) yearly += amount;
      
      // By school
      const schoolId = data.schoolId;
      const schoolName = data.schoolName || 'Unknown';
      if (schoolId) {
        const existing = bySchoolMap.get(schoolId);
        if (existing) {
          existing.amount += amount;
        } else {
          bySchoolMap.set(schoolId, { name: schoolName, amount });
        }
      }
    });
    
    const bySchool = Array.from(bySchoolMap.entries()).map(([schoolId, data]) => ({
      schoolId,
      schoolName: data.name,
      amount: data.amount,
    })).sort((a, b) => b.amount - a.amount);
    
    return {
      daily,
      weekly,
      monthly,
      quarterly,
      yearly,
      bySchool,
    };
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    throw error;
  }
}

/**
 * Get user growth data for charts
 */
export async function getUserGrowthData(days: number = 30): Promise<UserGrowth[]> {
  const db = getDb();
  
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    
    const growthMap: Map<string, { students: number; teachers: number; admins: number }> = new Map();
    const today = new Date();
    
    usersSnap.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date();
      const dateKey = createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const existing = growthMap.get(dateKey) || { students: 0, teachers: 0, admins: 0 };
      
      if (data.role === 'student') existing.students++;
      else if (data.role === 'teacher') existing.teachers++;
      else if (data.role === 'school_admin' || data.role === 'organization_owner') existing.admins++;
      
      growthMap.set(dateKey, existing);
    });
    
    // Create array for last N days
    const growth: UserGrowth[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const data = growthMap.get(dateKey) || { students: 0, teachers: 0, admins: 0 };
      growth.push({
        date: dateKey,
        students: data.students,
        teachers: data.teachers,
        admins: data.admins,
        total: data.students + data.teachers + data.admins,
      });
    }
    
    return growth;
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    throw error;
  }
}

/**
 * Get system health metrics
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  // Note: Some of these metrics would typically come from a monitoring service
  // For now, we'll return mock/placeholder data
  return {
    uptime: 99.9,
    activeConnections: 42,
    averageResponseTime: 145, // ms
    errorRate: 0.02, // 0.02%
    databaseSize: 2.4, // GB
    storageUsed: 1.8, // GB
    apiCallsToday: 1547,
  };
}
