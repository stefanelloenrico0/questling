// Statistiche derivate dalla storia: heatmap, totali per periodo, traguardi. PURO, nessuno stato extra.
import { ACHIEVEMENTS, type AchievementDef, type AchievementMetric } from '../data/achievements'
import { activeDays } from './game'
import { levelFromXp } from './levels'
import { addDays, dayDiff, dayKey, weekdayOf } from './periods'
import { computeStreak } from './streak'
import type { AppState } from './types'
import { sumXp } from './xp'

// ── heatmap ──────────────────────────────────────────────────────────────────

export type HeatLevel = 0 | 1 | 2 | 3 | 4

export interface HeatCell {
  day: string
  /** Daily completate in quel giorno logico. */
  count: number
  level: HeatLevel
  future: boolean
  today: boolean
}

export const heatLevel = (count: number): HeatLevel => (count <= 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4)

/** Daily completate per giorno logico (tutte le missioni giornaliere, anche archiviate). */
export function dailyCompletionsByDay(state: AppState): Map<string, number> {
  const dailyIds = new Set(state.quests.filter((q) => q.period === 'daily').map((q) => q.id))
  const byDay = new Map<string, number>()
  for (const c of state.completions) {
    if (c.completedAt && dailyIds.has(c.questId)) byDay.set(c.periodKey, (byDay.get(c.periodKey) ?? 0) + 1)
  }
  return byDay
}

export interface Heatmap {
  /** Colonne = settimane (la piu' vecchia per prima), righe = lunedi'..domenica. */
  weeks: HeatCell[][]
  total: number
  activeDays: number
  best: number
}

export function buildHeatmap(state: AppState, now: Date, weekCount = 12): Heatmap {
  const today = dayKey(now, state.settings.dayStartHour)
  const sinceMonday = (weekdayOf(today) + 6) % 7
  const start = addDays(today, -sinceMonday - 7 * (weekCount - 1))
  const byDay = dailyCompletionsByDay(state)

  let total = 0
  let active = 0
  let best = 0
  const weeks: HeatCell[][] = []
  for (let w = 0; w < weekCount; w++) {
    const column: HeatCell[] = []
    for (let d = 0; d < 7; d++) {
      const day = addDays(start, w * 7 + d)
      const future = day > today
      const count = future ? 0 : (byDay.get(day) ?? 0)
      total += count
      if (count > 0) active++
      best = Math.max(best, count)
      column.push({ day, count, level: heatLevel(count), future, today: day === today })
    }
    weeks.push(column)
  }
  return { weeks, total, activeDays: active, best }
}

// ── totali per periodo ───────────────────────────────────────────────────────

export interface PeriodTotals {
  completedDaily: number
  completedWeekly: number
  completedMonthly: number
  /** Daily completate negli ultimi 7 / 30 giorni logici (oggi compreso). */
  last7: number
  last30: number
  xpLast7: number
  xpLast30: number
  totalXp: number
}

export function periodTotals(state: AppState, now: Date): PeriodTotals {
  const hour = state.settings.dayStartHour
  const today = dayKey(now, hour)
  const period = new Map(state.quests.map((q) => [q.id, q.period]))
  let completedDaily = 0
  let completedWeekly = 0
  let completedMonthly = 0
  let last7 = 0
  let last30 = 0
  for (const c of state.completions) {
    if (!c.completedAt) continue
    const p = period.get(c.questId)
    if (p === 'daily') {
      completedDaily++
      const age = dayDiff(c.periodKey, today)
      if (age >= 0 && age < 7) last7++
      if (age >= 0 && age < 30) last30++
    } else if (p === 'weekly') completedWeekly++
    else if (p === 'monthly') completedMonthly++
  }
  let xpLast7 = 0
  let xpLast30 = 0
  for (const e of state.xpEvents) {
    const age = dayDiff(dayKey(new Date(e.at), hour), today)
    if (age >= 0 && age < 7) xpLast7 += e.delta
    if (age >= 0 && age < 30) xpLast30 += e.delta
  }
  return { completedDaily, completedWeekly, completedMonthly, last7, last30, xpLast7, xpLast30, totalXp: sumXp(state.xpEvents) }
}

// ── livello massimo mai raggiunto ────────────────────────────────────────────

/** Il livello massimo raggiunto in qualunque momento: non scende con gli undo. */
export function maxLevelEver(state: AppState): number {
  const events = [...state.xpEvents].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : 1))
  let sum = 0
  let peak = 1
  for (const e of events) {
    sum += e.delta
    peak = Math.max(peak, levelFromXp(sum).level)
  }
  return peak
}

// ── traguardi ────────────────────────────────────────────────────────────────

export interface AchievementProgress {
  def: AchievementDef
  current: number
  done: boolean
}

export function achievementMetrics(state: AppState, now: Date): Record<AchievementMetric, number> {
  const today = dayKey(now, state.settings.dayStartHour)
  const period = new Map(state.quests.map((q) => [q.id, q.period]))
  const bonusByDay = new Map<string, number>()
  for (const e of state.xpEvents) {
    if (e.reason === 'daily_bonus' && e.refId) bonusByDay.set(e.refId, (bonusByDay.get(e.refId) ?? 0) + e.delta)
  }
  return {
    completions: state.completions.filter((c) => c.completedAt).length,
    bestStreak: computeStreak(activeDays(state), today).best,
    maxLevel: maxLevelEver(state),
    perfectDays: [...bonusByDay.values()].filter((v) => v > 0).length,
    weeklyDone: state.completions.filter((c) => c.completedAt && period.get(c.questId) === 'weekly').length,
    monthlyDone: state.completions.filter((c) => c.completedAt && period.get(c.questId) === 'monthly').length,
  }
}

export function achievementsProgress(state: AppState, now: Date): AchievementProgress[] {
  const metrics = achievementMetrics(state, now)
  return ACHIEVEMENTS.map((def) => {
    const value = metrics[def.metric]
    return { def, current: Math.min(value, def.target), done: value >= def.target }
  })
}
