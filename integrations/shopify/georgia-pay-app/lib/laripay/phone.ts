/** Normalize to E.164-ish (+995...) for Georgia-focused onboarding. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9) return null;
  if (digits.startsWith('995') && digits.length >= 12) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+995${digits}`;
  }
  if (digits.startsWith('5') && digits.length === 9) {
    return `+995${digits}`;
  }
  if (raw.trim().startsWith('+') && digits.length >= 10) {
    return `+${digits}`;
  }
  return null;
}
