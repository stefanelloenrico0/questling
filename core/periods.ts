// Chiavi di periodo. Il "giorno" cambia alle dayStartHour (default 4).
// Tutta l'aritmetica sulle date e' fatta su chiavi 'YYYY-MM-DD' con calcoli UTC:
// a prova di ora legale (nessun giorno da 23/25 ore).
import type { Period } from './types'

export const DEFAULT_DAY_START_HOUR = 4
const DAY_MS = 86_400_000

const pad = (n: number): string => String(n).padStart(2, '0')

/** 'YYYY-MM-DD' dai campi del calendario LOCALE. */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function dayKey(now: Date, dayStartHour = DEFAULT_DAY_START_HOUR): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (now.getHours() < dayStartHour) d.setDate(d.getDate() - 1)
  return ymd(d)
}

function utcMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  return Date.UTC(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  return new Date(utcMs(key) + n * DAY_MS).toISOString().slice(0, 10)
}

/** Giorni da `a` a `b` (positivo se b e' dopo a). */
export function dayDiff(a: string, b: string): number {
  return Math.round((utcMs(b) - utcMs(a)) / DAY_MS)
}

/** Giorno della settimana di una chiave: 0 = domenica ... 6 = sabato. */
export function weekdayOf(key: string): number {
  return new Date(utcMs(key)).getUTCDay()
}

/** Giorni che mancano all'ultimo giorno del mese (0 nell'ultimo giorno). */
export function daysUntilMonthEnd(key: string): number {
  const [y, m] = key.split('-').map(Number) as [number, number]
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate() // giorno 0 del mese successivo
  return lastDay - Number(key.slice(8, 10))
}

/** Settimana ISO (da lunedi') del giorno logico: '2026-W45'. */
export function isoWeekKey(key: string): string {
  const t = new Date(utcMs(key))
  const dayNr = (t.getUTCDay() + 6) % 7 // lunedi' = 0
  t.setUTCDate(t.getUTCDate() - dayNr + 3) // giovedi' della settimana
  const isoYear = t.getUTCFullYear()
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4))
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7
  const week = 1 + Math.round(((t.getTime() - firstThursday.getTime()) / DAY_MS - 3 + firstDayNr) / 7)
  return `${isoYear}-W${pad(week)}`
}

export const monthKeyOf = (key: string): string => key.slice(0, 7)

export function weekKey(now: Date, dayStartHour = DEFAULT_DAY_START_HOUR): string {
  return isoWeekKey(dayKey(now, dayStartHour))
}

export function monthKey(now: Date, dayStartHour = DEFAULT_DAY_START_HOUR): string {
  return monthKeyOf(dayKey(now, dayStartHour))
}

export function periodKey(period: Period, now: Date, dayStartHour = DEFAULT_DAY_START_HOUR): string {
  const day = dayKey(now, dayStartHour)
  if (period === 'daily') return day
  if (period === 'weekly') return isoWeekKey(day)
  return monthKeyOf(day)
}
