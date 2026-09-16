/**
 * Masks Bangladesh phone numbers for privacy protection according to
 * Winstone Connect V2 Master Production Contract (Section 7).
 * Example: 01712345678 -> 017••••••78 or +8801805049668 -> +88018••••••68
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '—';
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, '');

  if (digits.length >= 10) {
    const isInternational = clean.startsWith('+880') || digits.startsWith('880');
    if (isInternational && digits.length >= 13) {
      const prefix = `+880${digits.slice(3, 5)}`;
      const suffix = digits.slice(-2);
      return `${prefix}••••••${suffix}`;
    }
    const localDigits = digits.startsWith('880') ? digits.slice(2) : digits;
    const prefix = localDigits.slice(0, 3);
    const suffix = localDigits.slice(-2);
    return `${prefix}••••••${suffix}`;
  }

  // Fallback if unusual length
  if (clean.length > 5) {
    return `${clean.slice(0, 3)}••••••${clean.slice(-2)}`;
  }

  return clean;
}
