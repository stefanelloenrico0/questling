// Costanti di bilanciamento XP: TUTTE qui (spec §14, rischio 5). Valori in gran parte stimati.
import type { Difficulty, Period, XpEvent, XpReason } from './types'

export const BASE_XP: Record<Difficulty, number> = { easy: 5, medium: 10, hard: 20 }
export const PERIOD_MULTIPLIER: Record<Period, number> = { daily: 1, weekly: 4, monthly: 12 }

/** Tetto di missioni attive per periodo (anti-inflazione di XP). */
export const QUEST_CAPS: Record<Period, number> = { daily: 7, weekly: 4, monthly: 3 }

export const TARGET_LIMITS: Record<Period, { min: number; max: number }> = {
  daily: { min: 1, max: 1 },
  weekly: { min: 1, max: 7 },
  monthly: { min: 1, max: 31 },
}

/** Bonus "tutte fatte": una volta al giorno, solo se le daily attive sono almeno 2. */
export const ALL_DONE_BONUS = 10
export const ALL_DONE_MIN_QUESTS = 2

export const STREAK_MILESTONES = [
  { days: 7, xp: 25 },
  { days: 30, xp: 100 },
  { days: 100, xp: 300 },
] as const

export const STREAK_SHIELD_EVERY = 7
export const STREAK_MAX_SHIELDS = 2

export function questXp(difficulty: Difficulty, period: Period): number {
  return BASE_XP[difficulty] * PERIOD_MULTIPLIER[period]
}

export function sumXp(events: readonly XpEvent[]): number {
  return events.reduce((acc, e) => acc + e.delta, 0)
}

/** XP netti gia' assegnati per un certo riferimento (es. un completamento). */
export function xpByRef(events: readonly XpEvent[], reason: XpReason, refId: string): number {
  let sum = 0
  for (const e of events) if (e.reason === reason && e.refId === refId) sum += e.delta
  return sum
}
