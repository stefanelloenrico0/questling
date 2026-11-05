// Viste derivate dallo stato (nessuno stato duplicato).
import { activeDays, activeQuests, currentCount, totalXp } from './game'
import { levelFromXp, tierOf, type LevelInfo, type Tier } from './levels'
import { dayKey } from './periods'
import { computeStreak, type StreakResult } from './streak'
import type { AppState, Period, Quest } from './types'
import { questXp } from './xp'

export interface QuestRowView {
  quest: Quest
  count: number
  done: boolean
  xp: number
}

export function questRows(state: AppState, period: Period, now: Date): QuestRowView[] {
  return activeQuests(state, period)
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
    .map((quest) => {
      const count = currentCount(state, quest, now)
      return { quest, count, done: count >= quest.target, xp: questXp(quest.difficulty, quest.period) }
    })
}

export interface Progress {
  done: number
  total: number
}

export function periodProgress(rows: readonly QuestRowView[]): Progress {
  return { done: rows.filter((r) => r.done).length, total: rows.length }
}

export interface Stats {
  totalXp: number
  level: LevelInfo
  tier: Tier
  streak: StreakResult
  questsCompleted: number
}

export function computeStats(state: AppState, now: Date): Stats {
  const xp = totalXp(state)
  const level = levelFromXp(xp)
  return {
    totalXp: xp,
    level,
    tier: tierOf(level.level),
    streak: computeStreak(activeDays(state), dayKey(now, state.settings.dayStartHour)),
    questsCompleted: state.completions.filter((c) => c.completedAt).length,
  }
}
