// Tipi condivisi del dominio. PURO: nessun import da Vue/Nuxt/Capacitor.
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Period = 'daily' | 'weekly' | 'monthly'

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export const PERIODS = ['daily', 'weekly', 'monthly'] as const

export const CHARACTER_IDS = [
  'valdo',
  'kuro',
  'fenna',
  'zeffiro',
  'lumen',
  'rondo',
  'u404',
  'brunilde',
] as const

export type CharacterId = (typeof CHARACTER_IDS)[number]

export type Sign = 1 | -1
export type Axis = 'O' | 'M' | 'S' | 'A'
export type AxisSigns = Record<Axis, Sign>

export interface Quest {
  id: string // ULID
  title: string
  icon: string // id da un set fisso di icone
  difficulty: Difficulty
  period: Period
  target: number // daily=1, weekly 1..7, monthly 1..31
  order: number
  createdAt: string // ISO
  updatedAt: string
  archivedAt?: string | null // soft delete (serve anche al sync)
}

export interface Completion {
  id: string // `${questId}_${periodKey}` -> deterministico, idempotente
  questId: string
  periodKey: string // '2026-11-04' | '2026-W45' | '2026-11'
  count: number // 0..target
  completedAt?: string | null
  updatedAt: string
}

export type XpReason = 'quest' | 'daily_bonus' | 'streak_milestone' | 'adjustment'

export interface XpEvent {
  // log append-only; XP totali = somma dei delta
  id: string // ULID
  at: string
  delta: number // negativo in caso di undo
  reason: XpReason
  refId?: string // id completamento, dayKey o `${giorni}:${dayKey}` per i traguardi streak
}

export interface Profile {
  displayName: string
  characterId: CharacterId
  quizAnswers?: number[] // indici risposta, per poter rifare/rivedere
  onboardedAt: string
  updatedAt: string
}

export interface Settings {
  locale: 'it' | 'en'
  dayStartHour: number // default 4
  notifications: {
    enabled: boolean
    morningTime: string // 'HH:mm' default '09:00'
    eveningTime: string // default '20:30'
    streakRisk: boolean
    weeklyMonthly: boolean
    comeback: boolean
  }
  sound: boolean
  haptics: boolean
}

export interface AppState {
  schemaVersion: number
  profile: Profile | null
  quests: Quest[]
  completions: Completion[]
  xpEvents: XpEvent[]
  unlockedChapters: Record<CharacterId, number[]>
  settings: Settings
  lastOpenAt: string
}
