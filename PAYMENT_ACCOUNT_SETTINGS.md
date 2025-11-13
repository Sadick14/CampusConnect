# Payment Account Settings System

## Overview
This system allows Super Admins to configure payment account details that will be displayed to schools when they submit payments for subscriptions.

## Payment Flow

### Subscription Activation (One-Time Payment)
Schools pay an **upfront activation fee** to activate their subscription plan:
- **Basic Plan**: GH₵300 one-time fee
- **Standard Plan**: GH₵500 one-time fee  
- **Premium Plan**: GH₵1,000 one-time fee

This payment is submitted through the **Subscription Page** and requires admin approval.

### Monthly Student Fees (Recurring Invoices)
Monthly fees are calculated based on active student count and sent as **invoices**:
- **Basic Plan**: GH₵20/student/month
- **Standard Plan**: GH₵20/student/month
- **Premium Plan**: GH₵20/student/month

Monthly invoices are handled separately from the subscription activation payment.

## Features

### Super Admin Configuration
Super admins can configure payment details for multiple payment methods:

1. **Mobile Money Accounts**
   - Multiple accounts support
   - Provider selection (MTN, Vodafone, AirtelTigo, Other)
   - Account name and phone number
   - Custom instructions per account

2. **Bank Transfer Accounts**
   - Multiple bank accounts support
   - Bank name, account name, account number
   - Optional branch name and SWIFT code
   - Custom instructions per account

3. **Cash Payment Details**
   - Office address for cash collection
   - Contact person and phone
   - Opening hours
   - Additional instructions

4. **Cheque Payment Details**
   - Payable to name
   - Mailing address
   - Contact person and phone
   - Additional instructions

5. **Other Payment Methods**
   - Custom payment method name
   - Detailed payment information
   - Additional instructions

### School User Experience
When schools submit payments:

1. **Select Payment Method**
   - Choose from: Mobile Money, Bank Transfer, Cash, Cheque, or Other

2. **View Account Details**
   - Automatically displays relevant account details based on selected method
   - Shows all configured accounts for that payment type
   - Displays instructions and contact information

3. **Submit Payment**
   - Enter transaction reference/ID
   - Upload proof of payment (optional)
   - Add notes if needed

## File Structure

```
src/
├── schemas/
│   └── payment-settings.ts          # TypeScript interfaces and Zod schemas
├── services/
│   └── payment-settings.ts          # Firestore CRUD operations
├── app/(app)/
│   ├── super-admin/
│   │   └── payment-settings/
│   │       └── page.tsx            # Super admin configuration UI
│   └── organizations/
│       └── subscription/
│           └── page.tsx            # Updated to display payment details
└── components/
    └── layout/
        └── sidebar-nav.tsx         # Added Payment Settings link
```

## Database Structure

### Collection: `system_settings`
### Document: `global_payment_settings`

```typescript
{
  mobileMoneyAccounts: [
    {
      provider: 'MTN' | 'Vodafone' | 'AirtelTigo' | 'Other',
      accountName: string,
      phoneNumber: string,
      instructions?: string
    }
  ],
  bankAccounts: [
    {
      bankName: string,
      accountName: string,
      accountNumber: string,
      branchName?: string,
      swiftCode?: string,
      instructions?: string
    }
  ],
  cashPayment?: {
    officeAddress: string,
    contactPerson: string,
    contactPhone: string,
    openingHours: string,
    instructions?: string
  },
  chequePayment?: {
    payableTo: string,
    mailingAddress: string,
    contactPerson: string,
    contactPhone: string,
    instructions?: string
  },
  otherPayment?: {
    method: string,
    details: string,
    instructions?: string
  },
  enabled: boolean,
  updatedAt: Timestamp,
  updatedBy: string
}
```

## Usage Guide

### For Super Admins

1. **Navigate to Payment Settings**
   - Access from sidebar: Super Admin > Payment Settings
   - URL: `/super-admin/payment-settings`

2. **Enable Payment Account Display**
   - Toggle the "Display Payment Accounts" switch at the top

3. **Configure Payment Methods**
   - Click on tabs for each payment method
   - Click "Add Account" for Mobile Money or Bank Transfer
   - Fill in all required fields
   - Add optional instructions for clarity

4. **Save Settings**
   - Click "Save Settings" button at the bottom
   - Settings are immediately available to all schools

### For School Users

1. **Navigate to Subscription Page**
   - Go to: Financial > Subscription
   - Click "Submit Payment" tab

2. **Select Payment Method**
   - Choose your preferred payment method
   - Account details will automatically appear

3. **Make Payment**
   - Use the displayed account details to make payment
   - Copy transaction reference/ID

4. **Submit Payment Record**
   - Enter transaction reference
   - Upload proof if available
   - Click "Submit Payment"

## Security

- Only Super Admins can modify payment settings
- All authenticated users can view payment settings (when enabled)
- Settings are stored in Firestore with access control rules
- Payment settings are cached on client side for performance

## API Reference

### `getPaymentSettings()`
Fetches the global payment settings.

**Returns:** `Promise<PaymentSettings | null>`

### `updatePaymentSettings(settings, updatedBy)`
Updates the global payment settings (Super Admin only).

**Parameters:**
- `settings`: Payment settings object (without id and updatedAt)
- `updatedBy`: User ID of the person updating

**Returns:** `Promise<void>`

### `getPaymentMethodDetails(paymentMethod)`
Gets payment account details for a specific payment method.

**Parameters:**
- `paymentMethod`: 'mobile_money' | 'bank_transfer' | 'cash' | 'cheque' | 'other'

**Returns:** `Promise<any>`

## Best Practices

1. **Keep Information Updated**
   - Regularly verify account details are current
   - Update contact information if it changes

2. **Clear Instructions**
   - Provide specific, easy-to-follow instructions
   - Include any special requirements or notes

3. **Multiple Options**
   - Configure multiple payment methods for flexibility
   - Provide at least 2-3 payment options

4. **Test Payments**
   - Verify account details work before enabling
   - Test each payment method periodically

## Future Enhancements

- [ ] Payment method availability by region
- [ ] Dynamic payment fees/charges display
- [ ] QR code generation for mobile money
- [ ] Automated payment verification
- [ ] Payment gateway integration
- [ ] Multi-currency support
