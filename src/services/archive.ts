import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

/**
 * Archive Service
 * Handles archiving of academic year data for historical access
 */

const ARCHIVE_COLLECTION = 'archives';

export interface ArchiveMetadata {
  id: string;
  organizationId: string;
  academicYearId: string;
  academicYearName: string;
  archiveType: 'academic_year' | 'term' | 'manual';
  archivedAt: string;
  archivedBy: string;
  dataCollections: string[]; // List of collections archived
  recordCounts: Record<string, number>; // Count of records per collection
  description?: string;
}

export interface ArchivedData {
  metadata: ArchiveMetadata;
  students: any[];
  classes: any[];
  attendance: any[];
  grades: any[];
  fees: any[];
  payments: any[];
  staff: any[];
}

/**
 * Archive academic year data
 */
export async function archiveAcademicYear(
  organizationId: string,
  academicYearId: string,
  academicYearName: string,
  userId: string
): Promise<string> {
  const db = getDb();
  const now = new Date();
  const archiveId = `${organizationId}_${academicYearId}_${now.getTime()}`;

  console.log(`[Archive] Starting archive for academic year: ${academicYearName}`);

  try {
    // Collections to archive
    const collectionsToArchive = [
      'students',
      'classes',
      'attendance',
      'grades',
      'fees',
      'payments',
      'staff',
    ];

    const archivedData: any = {};
    const recordCounts: Record<string, number> = {};

    // Archive each collection
    for (const collectionName of collectionsToArchive) {
      const q = query(
        collection(db, collectionName),
        where('organizationId', '==', organizationId),
        where('academicYear', '==', academicYearId)
      );

      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      archivedData[collectionName] = records;
      recordCounts[collectionName] = records.length;

      console.log(`[Archive] Archived ${records.length} ${collectionName}`);
    }

    // Create archive metadata
    const metadata: ArchiveMetadata = {
      id: archiveId,
      organizationId,
      academicYearId,
      academicYearName,
      archiveType: 'academic_year',
      archivedAt: now.toISOString(),
      archivedBy: userId,
      dataCollections: collectionsToArchive,
      recordCounts,
      description: `Archive of ${academicYearName} academic year`,
    };

    // Save archive
    const archiveRef = doc(db, ARCHIVE_COLLECTION, archiveId);
    await setDoc(archiveRef, {
      metadata,
      data: archivedData,
      createdAt: Timestamp.fromDate(now),
    });

    console.log(`[Archive] Successfully archived academic year: ${academicYearName}`);
    console.log(`[Archive] Archive ID: ${archiveId}`);
    console.log('[Archive] Record counts:', recordCounts);

    return archiveId;
  } catch (error) {
    console.error('[Archive] Error archiving academic year:', error);
    throw new Error('Failed to archive academic year data');
  }
}

/**
 * Get all archives for an organization
 */
export async function getOrganizationArchives(
  organizationId: string
): Promise<ArchiveMetadata[]> {
  const db = getDb();

  try {
    const q = query(
      collection(db, ARCHIVE_COLLECTION),
      where('metadata.organizationId', '==', organizationId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return data.metadata as ArchiveMetadata;
    });
  } catch (error) {
    console.error('[Archive] Error fetching archives:', error);
    throw new Error('Failed to fetch archives');
  }
}

/**
 * Get archived data by archive ID
 */
export async function getArchivedData(archiveId: string): Promise<ArchivedData | null> {
  const db = getDb();

  try {
    const archiveRef = doc(db, ARCHIVE_COLLECTION, archiveId);
    const archiveSnap = await (await import('firebase/firestore')).getDoc(archiveRef);

    if (!archiveSnap.exists()) {
      return null;
    }

    const archiveData = archiveSnap.data();
    return {
      metadata: archiveData.metadata,
      ...archiveData.data,
    } as ArchivedData;
  } catch (error) {
    console.error('[Archive] Error fetching archived data:', error);
    throw new Error('Failed to fetch archived data');
  }
}

/**
 * Get archives for a specific academic year
 */
export async function getAcademicYearArchives(
  organizationId: string,
  academicYearId: string
): Promise<ArchiveMetadata[]> {
  const db = getDb();

  try {
    const q = query(
      collection(db, ARCHIVE_COLLECTION),
      where('metadata.organizationId', '==', organizationId),
      where('metadata.academicYearId', '==', academicYearId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return data.metadata as ArchiveMetadata;
    });
  } catch (error) {
    console.error('[Archive] Error fetching academic year archives:', error);
    throw new Error('Failed to fetch academic year archives');
  }
}

/**
 * Export archive data as JSON
 */
export function exportArchiveAsJSON(archivedData: ArchivedData): void {
  const dataStr = JSON.stringify(archivedData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `archive_${archivedData.metadata.academicYearName}_${new Date().getTime()}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Export archive data as CSV (for a specific collection)
 */
export function exportArchiveAsCSV(
  data: any[],
  collectionName: string,
  academicYearName: string
): void {
  if (data.length === 0) return;

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle values that might contain commas
      return typeof value === 'string' && value.includes(',')
        ? `"${value}"`
        : value;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${collectionName}_${academicYearName}_${new Date().getTime()}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
