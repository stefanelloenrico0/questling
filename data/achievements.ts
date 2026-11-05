// Traguardi: derivati dalla STORIA (completamenti ed eventi XP), nessuno stato in piu' da salvare ne' sincronizzare.
// Il livello massimo e' un picco sugli eventi XP: non scende con gli undo. Completamenti e streak sono invece
// ricalcolati dai completamenti attuali: annullare un completamento puo' far scendere quei traguardi.
export type AchievementMetric =
  | 'completions' // completamenti totali (qualsiasi periodo)
  | 'bestStreak'
  | 'maxLevel'
  | 'perfectDays' // giorni col bonus "tutte fatte"
  | 'weeklyDone'
  | 'monthlyDone'

export interface AchievementDef {
  /** Chiave i18n: achievements.{id}.title / .desc */
  id: string
  group: 'quests' | 'streak' | 'level' | 'special'
  metric: AchievementMetric
  target: number
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'first_step', group: 'quests', metric: 'completions', target: 1 },
  { id: 'quests_25', group: 'quests', metric: 'completions', target: 25 },
  { id: 'quests_100', group: 'quests', metric: 'completions', target: 100 },
  { id: 'quests_365', group: 'quests', metric: 'completions', target: 365 },
  { id: 'streak_7', group: 'streak', metric: 'bestStreak', target: 7 },
  { id: 'streak_30', group: 'streak', metric: 'bestStreak', target: 30 },
  { id: 'streak_100', group: 'streak', metric: 'bestStreak', target: 100 },
  { id: 'level_5', group: 'level', metric: 'maxLevel', target: 5 },
  { id: 'level_10', group: 'level', metric: 'maxLevel', target: 10 },
  { id: 'level_15', group: 'level', metric: 'maxLevel', target: 15 },
  { id: 'level_20', group: 'level', metric: 'maxLevel', target: 20 },
  { id: 'perfect_day', group: 'special', metric: 'perfectDays', target: 1 },
  { id: 'weekly_first', group: 'special', metric: 'weeklyDone', target: 1 },
  { id: 'monthly_first', group: 'special', metric: 'monthlyDone', target: 1 },
]
