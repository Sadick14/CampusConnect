'use server';
/**
 * @fileOverview Service functions for managing school expenditures in Firestore.
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
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase-server';

/**
 * Expenditure categories.
 */
export type ExpenditureCategory = 
  | 'Salaries'
  | 'Utilities'
  | 'Supplies'
  | 'Maintenance'
  | 'Transport'
  | 'Food'
  | 'Technology'
  | 'Events'
  | 'Other';

/**
 * Payment methods for expenditures.
 */
export type PaymentMethod = 'Cash' | 'Cheque' | 'Bank Transfer' | 'Mobile Money' | 'Other';

/**
 * Represents an expenditure.
 */
export interface Expenditure {
  /**
   * The unique identifier of the expenditure.
   */
  id: string;
  /**
   * The description of the expenditure.
   */
  description: string;
  /**
   * The amount of the expenditure.
   */
  amount: number;
  /**
   * The category of the expenditure.
   */
  category: ExpenditureCategory;
  /**
   * The date of the expenditure (ISO string).
   */
  date: string;
  /**
   * The school ID of the expenditure.
   */
  organizationId: string;
  /**
   * The payment method used.
   */
  paymentMethod?: PaymentMethod;
  /**
   * The recipient/vendor name.
   */
  recipient?: string;
  /**
   * Reference number (receipt, invoice, etc.).
   */
  referenceNumber?: string;
  /**
   * Additional notes.
   */
  notes?: string | null;
  /**
   * Who recorded this expenditure.
   */
  recordedBy?: string;
  /**
   * Creation timestamp.
   */
  createdAt?: string;
  /**
   * Last update timestamp.
   */
  updatedAt?: string;
}

/**
 * Asynchronously retrieves an expenditure by its ID.
 *
 * @param id The ID of the expenditure to retrieve.
 * @returns A promise that resolves to an Expenditure object if found, or null if not found.
 */
export async function getExpenditure(id: string): Promise<Expenditure | null> {
  try {
    const db = getDb();
    const expenditureRef = doc(db, 'expenditures', id);
    const expenditureSnap = await getDoc(expenditureRef);

    if (!expenditureSnap.exists()) {
      return null;
    }

    const data = expenditureSnap.data();
    return {
      id: expenditureSnap.id,
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: data.date,
      organizationId: data.organizationId,
      paymentMethod: data.paymentMethod,
      recipient: data.recipient,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      recordedBy: data.recordedBy,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };
  } catch (error: any) {
    console.error(`Error fetching expenditure with ID ${id}:`, error);
    throw new Error(`Failed to fetch expenditure: ${error.message}`);
  }
}

/**
 * Asynchronously retrieves expenditures for a school with optional filters.
 *
 * @param organizationId The school ID.
 * @param categoryFilter Optional category filter.
 * @param startDate Optional start date filter (ISO string).
 * @param endDate Optional end date filter (ISO string).
 * @returns A promise that resolves to an array of Expenditure objects.
 */
export async function getExpenditures(
  organizationId: string,
  categoryFilter?: ExpenditureCategory,
  startDate?: string,
  endDate?: string
): Promise<Expenditure[]> {
  try {
    const db = getDb();
    const expendituresRef = collection(db, 'expenditures');
    
    let q = query(
      expendituresRef,
      where('organizationId', '==', organizationId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const expenditures: Expenditure[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Apply filters if provided
      if (categoryFilter && data.category !== categoryFilter) return;
      if (startDate && data.date < startDate) return;
      if (endDate && data.date > endDate) return;
      
      expenditures.push({
        id: doc.id,
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: data.date,
        organizationId: data.organizationId,
        paymentMethod: data.paymentMethod,
        recipient: data.recipient,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        recordedBy: data.recordedBy,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      });
    });

    return expenditures;
  } catch (error: any) {
    console.error(`Error fetching expenditures for organization ${organizationId}:`, error);
    throw new Error(`Failed to fetch expenditures: ${error.message}`);
  }
}

/**
 * Asynchronously creates a new expenditure.
 *
 * @param expenditure The expenditure to create (without id).
 * @returns A promise that resolves to the created Expenditure object.
 */
export async function createExpenditure(
  expenditure: Omit<Expenditure, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Expenditure> {
  try {
    const db = getDb();
    const expendituresRef = collection(db, 'expenditures');

    const expenditureData = {
      ...expenditure,
      date: expenditure.date || new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(expendituresRef, expenditureData);
    console.log(`Expenditure created with ID: ${docRef.id}`);

    const createdExpenditure = await getExpenditure(docRef.id);
    if (!createdExpenditure) {
      throw new Error('Failed to retrieve created expenditure');
    }

    return createdExpenditure;
  } catch (error: any) {
    console.error('Error creating expenditure:', error);
    throw new Error(`Failed to create expenditure: ${error.message}`);
  }
}

/**
 * Asynchronously updates an expenditure.
 *
 * @param id The expenditure's Firestore document ID.
 * @param updates Partial expenditure data to update.
 * @returns A promise that resolves to the updated Expenditure object.
 */
export async function updateExpenditure(
  id: string,
  updates: Partial<Omit<Expenditure, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Expenditure> {
  try {
    const db = getDb();
    const expenditureRef = doc(db, 'expenditures', id);

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(expenditureRef, updateData);
    console.log(`Expenditure ${id} updated successfully`);

    const updatedExpenditure = await getExpenditure(id);
    if (!updatedExpenditure) {
      throw new Error('Failed to retrieve updated expenditure');
    }

    return updatedExpenditure;
  } catch (error: any) {
    console.error(`Error updating expenditure ${id}:`, error);
    throw new Error(`Failed to update expenditure: ${error.message}`);
  }
}

/**
 * Asynchronously deletes an expenditure.
 *
 * @param id The expenditure's Firestore document ID.
 * @returns A promise that resolves when the expenditure is deleted.
 */
export async function deleteExpenditure(id: string): Promise<void> {
  try {
    const db = getDb();
    const expenditureRef = doc(db, 'expenditures', id);
    
    await deleteDoc(expenditureRef);
    console.log(`Expenditure ${id} deleted successfully`);
  } catch (error: any) {
    console.error(`Error deleting expenditure ${id}:`, error);
    throw new Error(`Failed to delete expenditure: ${error.message}`);
  }
}

/**
 * Calculate total expenditure by category.
 *
 * @param expenditures Array of expenditures.
 * @returns Object with category totals.
 */
function calculateCategoryTotals(expenditures: Expenditure[]): Record<ExpenditureCategory, number> {
  const totals: Record<ExpenditureCategory, number> = {
    Salaries: 0,
    Utilities: 0,
    Supplies: 0,
    Maintenance: 0,
    Transport: 0,
    Food: 0,
    Technology: 0,
    Events: 0,
    Other: 0
  };

  expenditures.forEach(exp => {
    totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
  });

  return totals;
}

// Export a wrapper that can be used in server actions if needed
// Helper is intentionally not exported to avoid being treated as a Server Action by Next.js.
// Keep it internal to this module for server-side calculations only.

