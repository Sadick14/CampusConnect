/**
 * Currency formatting utilities for Ghana Cedis (GHS)
 */

export const CURRENCY = {
  code: 'GHS',
  symbol: 'GHS',
  name: 'Ghana Cedis',
  locale: 'en-GH', // Ghana English locale
};

/**
 * Format a number as Ghana Cedis currency
 * @param amount - The amount to format
 * @param includeSymbol - Whether to include the currency symbol (default: true)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, includeSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return formatted;
}

/**
 * Format a number as Ghana Cedis without currency symbol
 * @param amount - The amount to format
 * @returns Formatted number string with commas
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse a currency string to a number
 * @param currencyString - String like "GHS 1,234.50"
 * @returns Parsed number
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbol and commas, then parse
  const cleaned = currencyString
    .replace(/[^\d.-]/g, '') // Keep only digits, dots, and minus signs
    .trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Format amount for display in compact form (e.g., "1.2K", "1.5M")
 * @param amount - The amount to format
 * @returns Compact formatted string with currency
 */
export function formatCompactCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  let divisor = 1;
  let suffix = '';

  if (absAmount >= 1000000) {
    divisor = 1000000;
    suffix = 'M';
  } else if (absAmount >= 1000) {
    divisor = 1000;
    suffix = 'K';
  }

  const result = (amount / divisor).toFixed(1);
  return `GHS ${result}${suffix}`;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(): string {
  return CURRENCY.symbol;
}

/**
 * Validate if a string is a valid currency amount
 */
export function isValidCurrencyAmount(value: string): boolean {
  const parsed = parseCurrency(value);
  return !isNaN(parsed) && isFinite(parsed) && parsed >= 0;
}

/**
 * Format date with currency (for reports)
 */
export function formatCurrencyWithDate(amount: number, date: Date): string {
  const formatted = formatCurrency(amount);
  const dateStr = new Intl.DateTimeFormat(CURRENCY.locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);

  return `${formatted} on ${dateStr}`;
}
