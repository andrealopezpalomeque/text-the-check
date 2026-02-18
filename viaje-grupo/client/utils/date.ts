import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'

dayjs.extend(relativeTime)
dayjs.locale('es')

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return dayjs(date).format('DD/MM/YYYY HH:mm')
}

/**
 * Format date as relative time (e.g., "hace 2 horas")
 */
export const formatRelativeTime = (date: Date): string => {
  return dayjs(date).fromNow()
}

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'day')
}
