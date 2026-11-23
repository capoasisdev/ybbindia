/**
 * Helpers for Indian mobile phone numbers (+91).
 *
 * Rules:
 * - Country code defaults to +91.
 * - Valid Indian mobile numbers are strictly 10 digits and start with 6, 7, 8, or 9.
 */

/**
 * Normalizes input by stripping non-digits and leading +91, 91, or 0.
 * Returns up to 10 digits.
 */
export function normalizeIndianMobile(raw: string | undefined | null): string {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");

  // If 12 digits starting with 91, strip the country code
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  // If 11 digits starting with 0, strip the trunk prefix
  else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  // If user pasted something like +91 9876543210 which has > 10 digits starting with 91
  else if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  // Cap at 10 digits
  return digits.slice(0, 10);
}

/**
 * Checks if the string is a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.
 */
export function isValidIndianMobile(raw: string | undefined | null): boolean {
  const digits = normalizeIndianMobile(raw);
  return /^[6-9]\d{9}$/.test(digits);
}

/**
 * Formats a 10-digit Indian mobile number into E.164 format (+919876543210).
 * If invalid or empty, returns an empty string or the raw value prefixed.
 */
export function formatE164IndianMobile(raw: string | undefined | null): string {
  const digits = normalizeIndianMobile(raw);
  if (!digits) return "";
  return `+91${digits}`;
}

/**
 * Returns human-readable validation error or null if valid.
 */
export function getIndianMobileValidationError(
  raw: string | undefined | null,
  touched: boolean = true,
): string | null {
  if (!touched) return null;
  const digits = normalizeIndianMobile(raw);
  if (!digits) return null;

  if (!/^[6-9]/.test(digits)) {
    return "Mobile numbers in India must start with 6, 7, 8, or 9";
  }

  if (digits.length < 10) {
    return `Enter all 10 digits (${digits.length}/10)`;
  }

  if (digits.length > 10 || !/^[6-9]\d{9}$/.test(digits)) {
    return "Please enter a valid 10-digit mobile number";
  }

  return null;
}
