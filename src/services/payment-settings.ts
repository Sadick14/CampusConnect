import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { PaymentSettings } from '@/schemas/payment-settings';

const PAYMENT_SETTINGS_DOC_ID = 'global_payment_settings';

/**
 * Get the global payment settings
 */
export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  try {
    const db = getDb();
    const docRef = doc(db, 'system_settings', PAYMENT_SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Return default empty settings
      return {
        mobileMoneyAccounts: [],
        bankAccounts: [],
        enabled: false,
      };
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      updatedAt: data.updatedAt?.toDate(),
    } as PaymentSettings;
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    throw error;
  }
}

/**
 * Update the global payment settings (Super Admin only)
 */
export async function updatePaymentSettings(
  settings: Omit<PaymentSettings, 'id' | 'updatedAt'>,
  updatedBy: string
): Promise<void> {
  try {
    const db = getDb();
    const docRef = doc(db, 'system_settings', PAYMENT_SETTINGS_DOC_ID);
    
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy,
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    throw error;
  }
}

/**
 * Get payment account details by method type
 */
export async function getPaymentMethodDetails(
  paymentMethod: 'mobile_money' | 'bank_transfer' | 'cash' | 'cheque' | 'other'
): Promise<any> {
  try {
    const settings = await getPaymentSettings();
    
    if (!settings || !settings.enabled) {
      return null;
    }

    switch (paymentMethod) {
      case 'mobile_money':
        return settings.mobileMoneyAccounts;
      case 'bank_transfer':
        return settings.bankAccounts;
      case 'cash':
        return settings.cashPayment;
      case 'cheque':
        return settings.chequePayment;
      case 'other':
        return settings.otherPayment;
      default:
        return null;
    }
  } catch (error) {
    console.error('Error fetching payment method details:', error);
    throw error;
  }
}
