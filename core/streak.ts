// Streak DERIVATA, non memorizzata: riscorre i giorni dal primo giorno attivo.
import { addDays } from './periods'
import { STREAK_MAX_SHIELDS, STREAK_MILESTONES, STREAK_SHIELD_EVERY } from './xp'

export interface StreakMilestone {
  days: number
  dayKey: string
}

export interface StreakResult {
  current: number
  best: number
  shields: number
  /** Oggi non e' ancora "contato" e c'e' una streak da proteggere (non e' persa). */
  atRisk: boolean
  todayDone: boolean
  milestones: StreakMilestone[]
}

const EMPTY: StreakResult = {
  current: 0,
  best: 0,
  shields: 0,
  atRisk: false,
  todayDone: false,
  milestones: [],
}

/**
 * @param activeDays dayKey in cui almeno una daily e' completata
 * @param today dayKey del giorno logico corrente
 */
export function computeStreak(activeDays: Iterable<string>, today: string): StreakResult {
  const active = new Set<string>()
  for (const d of activeDays) if (d <= today) active.add(d)
  if (active.size === 0) return { ...EMPTY }

  const first = [...active].sort()[0] as string
  let current = 0
  let best = 0
  let shields = 0
  const milestones: StreakMilestone[] = []

  for (let day = first; day <= today; day = addDays(day, 1)) {
    if (active.has(day)) {
      current++
      best = Math.max(best, current)
      if (current % STREAK_SHIELD_EVERY === 0) shields = Math.min(STREAK_MAX_SHIELDS, shields + 1)
      if (STREAK_MILESTONES.some((m) => m.days === current)) milestones.push({ days: current, dayKey: day })
    } else if (day !== today) {
      // giorno saltato (e finito): consuma uno scudo se c'e', altrimenti azzera
      if (shields > 0) shields--
      else current = 0
    }
    // oggi non attivo: la streak non e' rotta finche' il giorno non e' finito
  }

  const todayDone = active.has(today)
  return { current, best, shields, atRisk: !todayDone && current > 0, todayDone, milestones }
}
