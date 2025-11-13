import { z } from 'zod';

// Payment Method Types
export type PaymentMethodType = 'mobile_money' | 'bank_transfer' | 'cash' | 'cheque' | 'other';

// Mobile Money Account Details
export interface MobileMoneyAccount {
  provider: 'MTN' | 'Vodafone' | 'AirtelTigo' | 'Other';
  accountName: string;
  phoneNumber: string;
  instructions?: string;
}

// Bank Account Details
export interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName?: string;
  swiftCode?: string;
  instructions?: string;
}

// Cash Payment Details
export interface CashPaymentDetails {
  officeAddress: string;
  contactPerson: string;
  contactPhone: string;
  openingHours: string;
  instructions?: string;
}

// Cheque Payment Details
export interface ChequePaymentDetails {
  payableTo: string;
  mailingAddress: string;
  contactPerson: string;
  contactPhone: string;
  instructions?: string;
}

// Other Payment Details
export interface OtherPaymentDetails {
  method: string;
  details: string;
  instructions?: string;
}

// Complete Payment Settings
export interface PaymentSettings {
  id?: string;
  mobileMoneyAccounts: MobileMoneyAccount[];
  bankAccounts: BankAccount[];
  cashPayment?: CashPaymentDetails;
  chequePayment?: ChequePaymentDetails;
  otherPayment?: OtherPaymentDetails;
  enabled: boolean;
  updatedAt?: Date;
  updatedBy?: string;
}

// Zod Schemas for Validation
export const mobileMoneyAccountSchema = z.object({
  provider: z.enum(['MTN', 'Vodafone', 'AirtelTigo', 'Other']),
  accountName: z.string().min(2, 'Account name is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  instructions: z.string().optional(),
});

export const bankAccountSchema = z.object({
  bankName: z.string().min(2, 'Bank name is required'),
  accountName: z.string().min(2, 'Account name is required'),
  accountNumber: z.string().min(5, 'Account number is required'),
  branchName: z.string().optional(),
  swiftCode: z.string().optional(),
  instructions: z.string().optional(),
});

export const cashPaymentSchema = z.object({
  officeAddress: z.string().min(5, 'Office address is required'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  contactPhone: z.string().min(10, 'Contact phone is required'),
  openingHours: z.string().min(5, 'Opening hours required (e.g., Mon-Fri 9AM-5PM)'),
  instructions: z.string().optional(),
});

export const chequePaymentSchema = z.object({
  payableTo: z.string().min(2, 'Payable to name is required'),
  mailingAddress: z.string().min(10, 'Mailing address is required'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  contactPhone: z.string().min(10, 'Contact phone is required'),
  instructions: z.string().optional(),
});

export const otherPaymentSchema = z.object({
  method: z.string().min(2, 'Payment method name is required'),
  details: z.string().min(10, 'Payment details are required'),
  instructions: z.string().optional(),
});

export const paymentSettingsSchema = z.object({
  mobileMoneyAccounts: z.array(mobileMoneyAccountSchema),
  bankAccounts: z.array(bankAccountSchema),
  cashPayment: cashPaymentSchema.optional(),
  chequePayment: chequePaymentSchema.optional(),
  otherPayment: otherPaymentSchema.optional(),
  enabled: z.boolean(),
});
