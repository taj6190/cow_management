/**
 * Format a number as Bangladeshi Taka (BDT)
 */
export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Get current month range
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

/**
 * Get month range for a specific month/year
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

/**
 * Generate a unique cow tag
 */
export function generateCowTag(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `COW-${year}${random}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: Date | string): string {
  const birthDate = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - birthDate.getFullYear();
  const months = now.getMonth() - birthDate.getMonth();
  
  if (years > 0) {
    return `${years}y ${months >= 0 ? months : 12 + months}m`;
  }
  return `${months >= 0 ? months : 12 + months}m`;
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}
