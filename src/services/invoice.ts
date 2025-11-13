import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Invoice, InvoicePayment } from '@/schemas/invoice';
import { generateInvoiceNumber, calculateDueDate, isInvoiceOverdue } from '@/schemas/invoice';

/**
 * Get all invoices for an organization
 */
export async function getOrganizationInvoices(organizationId: string): Promise<Invoice[]> {
  try {
    const db = getDb();
    const invoicesRef = collection(db, 'invoices');
    const q = query(
      invoicesRef,
      where('organizationId', '==', organizationId),
      orderBy('issueDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const invoices: Invoice[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const invoice: Invoice = {
        id: doc.id,
        ...data,
        issueDate: data.issueDate?.toDate?.() || data.issueDate,
        dueDate: data.dueDate?.toDate?.() || data.dueDate,
        paidDate: data.paidDate?.toDate?.() || data.paidDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Invoice;

      // Update status if overdue
      if (isInvoiceOverdue(invoice) && invoice.status === 'pending') {
        invoice.status = 'overdue';
      }

      invoices.push(invoice);
    });

    return invoices;
  } catch (error) {
    console.error('Error fetching organization invoices:', error);
    throw error;
  }
}

/**
 * Get a single invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  try {
    const db = getDb();
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      return null;
    }

    const data = invoiceSnap.data();
    return {
      id: invoiceSnap.id,
      ...data,
      issueDate: data.issueDate?.toDate?.() || data.issueDate,
      dueDate: data.dueDate?.toDate?.() || data.dueDate,
      paidDate: data.paidDate?.toDate?.() || data.paidDate,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    } as Invoice;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
}

/**
 * Create a monthly subscription invoice
 */
export async function createMonthlyInvoice(
  organizationId: string,
  schoolName: string,
  studentCount: number,
  perStudentFee: number,
  subscriptionPlan: 'BASIC' | 'STANDARD' | 'PREMIUM',
  billingPeriod: string
): Promise<string> {
  try {
    const db = getDb();
    const invoicesRef = collection(db, 'invoices');
    const newInvoiceRef = doc(invoicesRef);

    const issueDate = new Date();
    const dueDate = calculateDueDate(issueDate, 14); // 14 days to pay
    const amount = studentCount * perStudentFee;

    const invoice: Omit<Invoice, 'id'> = {
      invoiceNumber: generateInvoiceNumber(issueDate),
      organizationId,
      schoolName,
      type: 'monthly_subscription',
      description: `Monthly subscription fee for ${billingPeriod}`,
      status: 'pending',
      amount,
      currency: 'GHS',
      studentCount,
      perStudentFee,
      subscriptionPlan,
      billingPeriod,
      issueDate: Timestamp.fromDate(issueDate),
      dueDate: Timestamp.fromDate(dueDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newInvoiceRef, invoice);
    return newInvoiceRef.id;
  } catch (error) {
    console.error('Error creating monthly invoice:', error);
    throw error;
  }
}

/**
 * Submit payment for an invoice
 */
export async function submitInvoicePayment(
  invoiceId: string,
  payment: InvoicePayment
): Promise<void> {
  try {
    const db = getDb();
    const invoiceRef = doc(db, 'invoices', invoiceId);

    await updateDoc(invoiceRef, {
      status: 'paid',
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
      paymentProof: payment.paymentProof || null,
      paymentNotes: payment.notes || null,
      paidDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error submitting invoice payment:', error);
    throw error;
  }
}

/**
 * Get all invoices (Super Admin)
 */
export async function getAllInvoices(): Promise<Invoice[]> {
  try {
    const db = getDb();
    const invoicesRef = collection(db, 'invoices');
    const q = query(invoicesRef, orderBy('issueDate', 'desc'));

    const querySnapshot = await getDocs(q);
    const invoices: Invoice[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      invoices.push({
        id: doc.id,
        ...data,
        issueDate: data.issueDate?.toDate?.() || data.issueDate,
        dueDate: data.dueDate?.toDate?.() || data.dueDate,
        paidDate: data.paidDate?.toDate?.() || data.paidDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Invoice);
    });

    return invoices;
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    throw error;
  }
}

/**
 * Approve an invoice payment (Super Admin)
 */
export async function approveInvoicePayment(
  invoiceId: string,
  approvedBy: string
): Promise<void> {
  try {
    const db = getDb();
    const invoiceRef = doc(db, 'invoices', invoiceId);

    await updateDoc(invoiceRef, {
      approvedBy,
      approvedDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error approving invoice payment:', error);
    throw error;
  }
}

/**
 * Cancel an invoice (Super Admin)
 */
export async function cancelInvoice(invoiceId: string): Promise<void> {
  try {
    const db = getDb();
    const invoiceRef = doc(db, 'invoices', invoiceId);

    await updateDoc(invoiceRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    throw error;
  }
}
