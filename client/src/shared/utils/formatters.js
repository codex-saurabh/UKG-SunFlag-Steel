// src/shared/utils/formatters.js
import { format, parseISO, isValid } from 'date-fns'

// Parse an ISO date string safely
const safeParse = (str) => {
  if (!str) return null
  try {
    const d = typeof str === 'string' ? parseISO(str) : new Date(str)
    return isValid(d) ? d : null
  } catch {
    return null
  }
}

// Display date as DD MMM YYYY (e.g. 29 May 2026)
export const formatDate = (str) => {
  const d = safeParse(str)
  return d ? format(d, 'dd MMM yyyy') : '—'
}

// Display date as YYYY-MM-DD for API params
export const toApiDate = (str) => {
  const d = safeParse(str)
  return d ? format(d, 'yyyy-MM-dd') : ''
}

// Display time as HH:mm (24-hr) from ISO string
export const formatTime = (str) => {
  const d = safeParse(str)
  return d ? format(d, 'HH:mm') : '—'
}

// Convert total minutes → "Xh Ym" string (e.g. 125 → "2h 5m")
export const minutesToHHMM = (mins) => {
  if (mins === null || mins === undefined) return '—'
  const m = Number(mins)
  if (isNaN(m) || m < 0) return '—'
  if (m === 0) return '0h'
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h === 0) return `${rem}m`
  if (rem === 0) return `${h}h`
  return `${h}h ${rem}m`
}

// Format a month number + year nicely (5, 2026 → "May 2026")
export const formatMonthYear = (month, year) => {
  try {
    return format(new Date(year, month - 1, 1), 'MMMM yyyy')
  } catch {
    return `${month}/${year}`
  }
}

// Today as YYYY-MM-DD
export const todayString = () => format(new Date(), 'yyyy-MM-dd')

// Current month/year numbers
export const currentMonth = () => new Date().getMonth() + 1
export const currentYear  = () => new Date().getFullYear()