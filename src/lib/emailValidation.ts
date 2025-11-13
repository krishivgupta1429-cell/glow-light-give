// Email validation utilities with disposable domain checking

const DISPOSABLE_DOMAINS = [
  '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'temp-mail.org',
  'throwaway.email', 'tempmail.com', 'yopmail.com', 'fakeinbox.com',
  'trashmail.com', 'maildrop.cc', 'getnada.com', 'tempinbox.com',
  'sharklasers.com', 'guerrillamailblock.com', 'discard.email',
  'discardmail.com', 'spamgourmet.com', 'mintemail.com'
];

/**
 * Validates email format
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Checks if email domain is a known disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

/**
 * Comprehensive email validation
 * @returns { valid: boolean, error?: string }
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!isValidEmailFormat(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  if (isDisposableEmail(trimmedEmail)) {
    return { valid: false, error: 'Disposable email addresses are not allowed. Please use a permanent email address.' };
  }

  return { valid: true };
}
