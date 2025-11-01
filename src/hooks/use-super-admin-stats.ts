import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type {
  SystemStats,
  RevenueMetrics,
  SchoolActivity,
} from '@/services/super-admin-stats';

/**
 * A realtime hook that listens to Firestore collections used by the Super Admin
 * dashboard and computes derived metrics. This reduces repeated reads and
 * provides live updates as data changes in Firestore.
 */
export default function useSuperAdminStats() {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [schoolActivities, setSchoolActivities] = useState<SchoolActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDb();

    // Collections we care about
    const schoolsRef = collection(db, 'schools');
    const usersRef = collection(db, 'users');
    const paymentsRef = collection(db, 'payments');
    const subscriptionsRef = collection(db, 'subscriptions');

    let schoolsSnap: QuerySnapshot<DocumentData> | null = null;
    let usersSnap: QuerySnapshot<DocumentData> | null = null;
    let paymentsSnap: QuerySnapshot<DocumentData> | null = null;
    let subscriptionsSnap: QuerySnapshot<DocumentData> | null = null;

    // Helpers to recompute derived metrics from the latest snapshots
    function recompute() {
      if (!schoolsSnap || !usersSnap || !paymentsSnap || !subscriptionsSnap) return;

      try {
        // === System Stats ===
        const totalSchools = schoolsSnap.size;
        let activeSchools = 0;
        let inactiveSchools = 0;
        let suspendedSchools = 0;

        const schoolDataMap = new Map<string, any>();
        schoolsSnap.forEach((s) => {
          const d = s.data();
          schoolDataMap.set(s.id, d);
          if (d.subscriptionStatus === 'active' || d.subscriptionStatus === 'trial') activeSchools++;
          else if (d.subscriptionStatus === 'suspended') suspendedSchools++;
          else inactiveSchools++;
        });

        const totalUsers = usersSnap.size;
        let totalStudents = 0;
        let totalTeachers = 0;
        let totalAdmins = 0;

        // Map users by school to derive school activity
        const usersBySchool = new Map<string, any[]>();
        usersSnap.forEach((u) => {
          const d = u.data();
          if (d.role === 'student') totalStudents++;
          else if (d.role === 'teacher') totalTeachers++;
          else if (d.role === 'school_admin' || d.role === 'organization_owner') totalAdmins++;

          const schoolId = d.schoolId || 'unknown';
          const arr = usersBySchool.get(schoolId) || [];
          arr.push({ id: u.id, ...d });
          usersBySchool.set(schoolId, arr);
        });

        // Payments
        let totalRevenue = 0;
        let monthlyRevenue = 0;
        let pendingPayments = 0;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const bySchoolMap = new Map<string, { schoolName: string; amount: number }>();

        paymentsSnap.forEach((p) => {
          const d = p.data();
          const amount = d.amount || 0;
          const status = d.status;

          if (status === 'approved') {
            totalRevenue += amount;
            const paidAt = d.reviewedAt?.toDate?.() || d.createdAt?.toDate?.();
            if (paidAt && paidAt.getMonth() === currentMonth && paidAt.getFullYear() === currentYear) {
              monthlyRevenue += amount;
            }
          } else if (status === 'pending') {
            pendingPayments++;
          }

          const schoolId = d.schoolId || p.id;
          const schoolName = d.schoolName || schoolDataMap.get(schoolId)?.name || 'Unknown';
          const existing = bySchoolMap.get(schoolId) || { schoolName, amount: 0 };
          existing.amount += amount;
          bySchoolMap.set(schoolId, existing);
        });

        // Active academic sessions
        const activeSessions = subscriptionsSnap.docs.filter(s => s.data()?.subscriptionStatus === 'active').length;

        const computedSystemStats: SystemStats = {
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
          activeAcademicSessions: activeSessions,
        };

        // === Revenue metrics ===
        const nowDate = new Date();
        const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        const quarterAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

        let daily = 0, weekly = 0, monthly = 0, quarterly = 0, yearly = 0;
        bySchoolMap.forEach((v) => {}); // noop to keep map filled

        paymentsSnap.forEach((p) => {
          const d = p.data();
          const amount = d.amount || 0;
          const paymentDate = d.reviewedAt?.toDate?.() || d.createdAt?.toDate?.() || new Date();

          if (paymentDate >= today) daily += amount;
          if (paymentDate >= weekAgo) weekly += amount;
          if (paymentDate >= monthAgo) monthly += amount;
          if (paymentDate >= quarterAgo) quarterly += amount;
          if (paymentDate >= yearAgo) yearly += amount;
        });

        const bySchoolArr = Array.from(bySchoolMap.entries()).map(([schoolId, d]) => ({
          schoolId,
          schoolName: d.schoolName,
          amount: d.amount,
        })).sort((a, b) => b.amount - a.amount);

        const computedRevenue: RevenueMetrics = {
          daily,
          weekly,
          monthly,
          quarterly,
          yearly,
          bySchool: bySchoolArr,
        };

        // === School activities ===
        const activities: SchoolActivity[] = [];
        schoolsSnap.forEach((s) => {
          const sdata = s.data();
          const users = usersBySchool.get(s.id) || [];
          let studentCount = 0;
          let teacherCount = 0;
          let activeUsers = 0;

          users.forEach((u: any) => {
            if (u.role === 'student') studentCount++;
            else if (u.role === 'teacher') teacherCount++;

            const lastLogin = u.lastLoginAt?.toDate?.();
            if (lastLogin) {
              const daysSince = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
              if (daysSince <= 7) activeUsers++;
            }
          });

          const schoolPayments = paymentsSnap!.docs.filter(p => (p.data().schoolId || '') === s.id && p.data().status === 'approved');
          let schoolRevenue = 0;
          schoolPayments.forEach(sp => { schoolRevenue += sp.data().amount || 0; });

          activities.push({
            id: s.id,
            schoolId: s.id,
            name: sdata.name || 'Unknown',
            schoolName: sdata.name || 'Unknown',
            lastActivity: sdata.lastActivityAt?.toDate?.()?.toISOString() || null,
            activeUsers,
            totalUsers: users.length,
            studentCount,
            teacherCount,
            subscriptionStatus: sdata.subscriptionStatus || 'trial',
            subscriptionExpiry: sdata.subscriptionExpiry?.toDate?.()?.toISOString?.() || undefined,
            revenue: schoolRevenue,
            totalRevenue: schoolRevenue,
          });
        });

        activities.sort((a, b) => {
          const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          return bTime - aTime;
        });

        setSystemStats(computedSystemStats);
        setRevenueMetrics(computedRevenue);
        setSchoolActivities(activities);
        setLoading(false);
      } catch (err) {
        console.error('Realtime recompute error:', err);
      }
    }

    // Subscribe
    const unsubSchools = onSnapshot(schoolsRef, (snap) => { schoolsSnap = snap; recompute(); });
    const unsubUsers = onSnapshot(usersRef, (snap) => { usersSnap = snap; recompute(); });
    const unsubPayments = onSnapshot(paymentsRef, (snap) => { paymentsSnap = snap; recompute(); });
    const unsubSubscriptions = onSnapshot(subscriptionsRef, (snap) => { subscriptionsSnap = snap; recompute(); });

    return () => {
      try { unsubSchools(); } catch {}
      try { unsubUsers(); } catch {}
      try { unsubPayments(); } catch {}
      try { unsubSubscriptions(); } catch {}
    };
  }, []);

  return { systemStats, revenueMetrics, schoolActivities, loading };
}
