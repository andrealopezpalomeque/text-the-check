/**
 * Format currency using ES-AR locale
 * Shows whole numbers without decimals, decimals only when needed
 * Format: $ 1.234 or $ 1.234,50
 */
export const formatCurrency = (amount: number): string => {
  return formatCurrencyByCode(amount, 'ARS')
}

/**
 * Format currency without symbol
 * Shows whole numbers without decimals, decimals only when needed
 */
export const formatAmount = (amount: number): string => {
  const isWholeNumber = Number.isInteger(amount)
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: isWholeNumber ? 0 : 2
  }).format(amount)
}

/**
 * Format currency with custom ISO code (defaults to ARS)
 * Shows whole numbers without decimals, decimals only when needed
 */
export const formatCurrencyByCode = (amount: number, currencyCode: string = 'ARS'): string => {
  const isWholeNumber = Number.isInteger(amount)
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: isWholeNumber ? 0 : 2
  }).format(amount)
}
