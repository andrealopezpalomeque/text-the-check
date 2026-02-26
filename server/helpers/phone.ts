/**
 * Phone number normalization helpers.
 *
 * Two distinct contexts:
 * - Comparison/lookup: digits-only so "+54911..." and "54911..." match
 * - Sending via WhatsApp API: Argentine 549→54 conversion
 */

/** Digits-only for matching and Firestore lookup */
export function normalizeForComparison(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

/**
 * Argentine mobile: 549XXXXXXXXX → 54XXXXXXXXX for WhatsApp API send.
 * The API expects the number WITHOUT the 9 after country code.
 */
export function normalizeForSending(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '')
  if (digits.startsWith('549') && digits.length === 13) {
    return '54' + digits.slice(3)
  }
  return digits
}

/**
 * Full Argentine mobile normalization with area code + "15" insertion.
 * WhatsApp sends: 5493794702813 (54 + 9 + area + number)
 * Meta expects:   543791547028013 (54 + area + 15 + number)
 */
export function normalizeArgentineMobile(phone: string): string {
  let normalized = phone.replace(/[\s\-\(\)]/g, '')
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized
  }

  if (normalized.startsWith('+549')) {
    const withoutPrefix = normalized.substring(3) // Remove "+54"

    const match =
      withoutPrefix.match(/^9(\d{3})(\d{7})$/) ||  // 3-digit area + 7-digit number
      withoutPrefix.match(/^9(\d{4})(\d{6})$/) ||  // 4-digit area + 6-digit number
      withoutPrefix.match(/^9(\d{2})(\d{8})$/)     // 2-digit area (Buenos Aires)

    if (match) {
      normalized = `+54${match[1]}15${match[2]}`
    }
  }

  return normalized
}

/** Compare two phone numbers by digits only */
export function comparePhones(a: string, b: string): boolean {
  return normalizeForComparison(a) === normalizeForComparison(b)
}

/**
 * Generate multiple format variants for Firestore lookup.
 * Covers: raw, digits-only, +digits, stripped spaces/dashes,
 * and Argentine 549↔54 variants (with/without mobile "9" prefix).
 */
export function generatePhoneCandidates(phone: string): string[] {
  const digitsOnly = normalizeForComparison(phone)
  const candidates = [
    phone.replace(/[\s-]/g, ''),
    digitsOnly,
    `+${digitsOnly}`,
  ]

  // Argentine mobile: 549XXXXXXXXX (13 digits) ↔ 54XXXXXXXXX (12 digits)
  if (digitsOnly.startsWith('549') && digitsOnly.length === 13) {
    const without9 = '54' + digitsOnly.slice(3)
    candidates.push(without9, `+${without9}`)
  } else if (digitsOnly.startsWith('54') && !digitsOnly.startsWith('549') && digitsOnly.length === 12) {
    const with9 = '549' + digitsOnly.slice(2)
    candidates.push(with9, `+${with9}`)
  }

  return [...new Set(candidates.filter(Boolean))]
}
