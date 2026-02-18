import axios from 'axios'

/**
 * Exchange rate data structure from DolarApi.com
 */
interface DolarApiResponse {
  compra: number // Buy price
  venta: number // Sell price
  casa: string
  nombre: string
  moneda?: string
  fechaActualizacion: string
}

/**
 * Cached exchange rates
 */
interface CachedRates {
  USD: number
  EUR: number
  BRL: number
  lastUpdated: number
}

/**
 * Static fallback rates (in case API fails)
 */
const FALLBACK_RATES: Omit<CachedRates, 'lastUpdated'> = {
  USD: 850, // Blue dollar rate
  EUR: 925,
  BRL: 170
}

/**
 * Cache duration: 30 minutes in milliseconds
 */
const CACHE_DURATION = 30 * 60 * 1000

/**
 * In-memory cache for exchange rates
 */
let ratesCache: CachedRates | null = null

/**
 * Fetch USD (Blue Dollar) rate from DolarApi
 */
const fetchUSDRate = async (): Promise<number> => {
  const response = await axios.get<DolarApiResponse>(
    'https://dolarapi.com/v1/dolares/blue',
    { timeout: 5000 }
  )
  return response.data.venta
}

/**
 * Fetch EUR rate from DolarApi
 */
const fetchEURRate = async (): Promise<number> => {
  const response = await axios.get<DolarApiResponse>(
    'https://dolarapi.com/v1/cotizaciones/eur',
    { timeout: 5000 }
  )
  return response.data.venta
}

/**
 * Fetch BRL rate from DolarApi
 */
const fetchBRLRate = async (): Promise<number> => {
  const response = await axios.get<DolarApiResponse>(
    'https://dolarapi.com/v1/cotizaciones/brl',
    { timeout: 5000 }
  )
  return response.data.venta
}

/**
 * Fetch all exchange rates from DolarApi.com
 */
const fetchRatesFromAPI = async (): Promise<Omit<CachedRates, 'lastUpdated'>> => {
  try {
    // Fetch all rates in parallel
    const [usdRate, eurRate, brlRate] = await Promise.all([
      fetchUSDRate(),
      fetchEURRate(),
      fetchBRLRate()
    ])

    return {
      USD: usdRate,
      EUR: eurRate,
      BRL: brlRate
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates from API:', error)
    throw error
  }
}

/**
 * Check if cached rates are still valid
 */
const isCacheValid = (): boolean => {
  if (!ratesCache) return false

  const now = Date.now()
  const cacheAge = now - ratesCache.lastUpdated

  return cacheAge < CACHE_DURATION
}

/**
 * Get current exchange rates (with caching and fallback)
 */
export const getExchangeRates = async (): Promise<Omit<CachedRates, 'lastUpdated'>> => {
  // Return cached rates if still valid
  if (isCacheValid() && ratesCache) {
    console.log('Using cached exchange rates')
    return {
      USD: ratesCache.USD,
      EUR: ratesCache.EUR,
      BRL: ratesCache.BRL
    }
  }

  // Try to fetch fresh rates from API
  try {
    console.log('Fetching fresh exchange rates from DolarApi.com...')
    const freshRates = await fetchRatesFromAPI()

    // Update cache
    ratesCache = {
      ...freshRates,
      lastUpdated: Date.now()
    }

    console.log('Exchange rates updated:', freshRates)
    return freshRates
  } catch (error) {
    console.error('Failed to fetch exchange rates, using fallback rates:', error)

    // Return fallback rates if API fails
    // If we have stale cache, use it instead of static fallback
    if (ratesCache) {
      console.log('Using stale cached rates as fallback')
      return {
        USD: ratesCache.USD,
        EUR: ratesCache.EUR,
        BRL: ratesCache.BRL
      }
    }

    console.log('Using static fallback rates')
    return FALLBACK_RATES
  }
}

/**
 * Convert amount from specified currency to ARS
 */
export const convertToARS = async (amount: number, currency: string): Promise<number> => {
  // ARS doesn't need conversion
  if (currency === 'ARS') {
    return amount
  }

  // Get current rates
  const rates = await getExchangeRates()

  // Apply conversion rate
  const rate = rates[currency as keyof typeof rates]

  if (!rate) {
    console.warn(`Unknown currency: ${currency}, returning original amount`)
    return amount
  }

  return amount * rate
}

/**
 * Get a specific currency rate
 */
export const getRate = async (currency: 'USD' | 'EUR' | 'BRL'): Promise<number> => {
  const rates = await getExchangeRates()
  return rates[currency]
}

/**
 * Clear the cache (useful for testing)
 */
export const clearCache = (): void => {
  ratesCache = null
  console.log('Exchange rate cache cleared')
}
