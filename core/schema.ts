// Schema Zod dello stato salvato/importato + migrazioni a catena.
import { z } from 'zod'
import { CHARACTER_IDS, DIFFICULTIES, PERIODS, type AppState } from './types'
import { TARGET_LIMITS } from './xp'

export const SCHEMA_VERSION = 1

const isoString = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'data ISO non valida')
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const characterId = z.enum(CHARACTER_IDS)

export const questSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(80),
    icon: z.string().min(1).max(32),
    difficulty: z.enum(DIFFICULTIES),
    period: z.enum(PERIODS),
    target: z.number().int().min(1).max(31),
    order: z.number().int(),
    createdAt: isoString,
    updatedAt: isoString,
    archivedAt: isoString.nullish(),
  })
  .refine((q) => q.target >= TARGET_LIMITS[q.period].min && q.target <= TARGET_LIMITS[q.period].max, {
    message: 'target fuori dai limiti del periodo',
    path: ['target'],
  })

export const completionSchema = z.object({
  id: z.string().min(1),
  questId: z.string().min(1),
  periodKey: z.string().regex(/^\d{4}-(\d{2}-\d{2}|W\d{2}|\d{2})$/),
  count: z.number().int().min(0).max(31),
  completedAt: isoString.nullish(),
  updatedAt: isoString,
})

export const xpEventSchema = z.object({
  id: z.string().min(1),
  at: isoString,
  delta: z.number().int(),
  reason: z.enum(['quest', 'daily_bonus', 'streak_milestone', 'adjustment']),
  refId: z.string().optional(),
})

export const profileSchema = z.object({
  displayName: z.string().min(1).max(40),
  characterId,
  quizAnswers: z.array(z.number().int().min(0).max(3)).optional(),
  onboardedAt: isoString,
  updatedAt: isoString,
})

const settingsSchema = z.object({
  locale: z.enum(['it', 'en']),
  dayStartHour: z.number().int().min(0).max(6),
  notifications: z.object({
    enabled: z.boolean(),
    morningTime: hhmm,
    eveningTime: hhmm,
    streakRisk: z.boolean(),
    weeklyMonthly: z.boolean(),
    comeback: z.boolean(),
  }),
  sound: z.boolean(),
  haptics: z.boolean(),
})

export const appStateSchema = z.object({
  schemaVersion: z.number().int().min(1),
  profile: profileSchema.nullable(),
  quests: z.array(questSchema),
  completions: z.array(completionSchema),
  xpEvents: z.array(xpEventSchema),
  unlockedChapters: z.partialRecord(characterId, z.array(z.number().int().min(1).max(5))),
  settings: settingsSchema,
  lastOpenAt: isoString,
})

// Verifica a compile-time che lo schema produca esattamente i tipi di dominio.
const _typeCheck: z.ZodType<AppState> = appStateSchema
void _typeCheck

export function createInitialState(now: Date): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: null,
    quests: [],
    completions: [],
    xpEvents: [],
    unlockedChapters: Object.fromEntries(CHARACTER_IDS.map((id) => [id, [1]])) as AppState['unlockedChapters'],
    settings: {
      locale: 'it',
      dayStartHour: 4,
      notifications: {
        enabled: false,
        morningTime: '09:00',
        eveningTime: '20:30',
        streakRisk: true,
        weeklyMonthly: true,
        comeback: true,
      },
      sound: true,
      haptics: true,
    },
    lastOpenAt: now.toISOString(),
  }
}

export type Migration = (state: Record<string, unknown>) => Record<string, unknown>

/** MIGRATIONS[n] porta lo stato dalla versione n alla n+1. */
export const MIGRATIONS: Record<number, Migration> = {}

export type MigrateResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: 'not_object' | 'no_version' | 'too_new' | 'missing_migration' }

export function migrateState(
  raw: unknown,
  target: number = SCHEMA_VERSION,
  migrations: Record<number, Migration> = MIGRATIONS,
): MigrateResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, reason: 'not_object' }
  let current = raw as Record<string, unknown>
  let version = current.schemaVersion
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return { ok: false, reason: 'no_version' }
  }
  if (version > target) return { ok: false, reason: 'too_new' }
  while (version < target) {
    const step = migrations[version]
    if (!step) return { ok: false, reason: 'missing_migration' }
    current = { ...step(current), schemaVersion: version + 1 }
    version++
  }
  return { ok: true, value: current }
}

export type ParseResult =
  | { ok: true; state: AppState }
  | { ok: false; reason: 'not_object' | 'no_version' | 'too_new' | 'missing_migration' | 'invalid'; detail?: string }

/** Migra e valida. Non lancia mai. */
export function parseState(raw: unknown): ParseResult {
  const migrated = migrateState(raw)
  if (!migrated.ok) return migrated
  const parsed = appStateSchema.safeParse(migrated.value)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, reason: 'invalid', detail: first ? `${first.path.join('.')}: ${first.message}` : undefined }
  }
  return { ok: true, state: parsed.data }
}
