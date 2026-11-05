// Piano DETERMINISTICO delle notifiche locali. Funzione pura: stato + ora in ingresso, elenco in uscita.
// L'adapter nativo cancella tutto il pendente e riprogramma il piano (idempotente).
import { activeDays, activeQuests, currentCount } from './game'
import { addDays, dayDiff, dayKey, daysUntilMonthEnd, isoWeekKey, monthKeyOf, weekdayOf } from './periods'
import { computeStreak } from './streak'
import type { AppState, CharacterId, Quest } from './types'

export type NotificationSlot = 'morning' | 'evening' | 'streak_risk' | 'weekly' | 'monthly' | 'comeback'
/** Chiavi dei pool di testo per eroe (levelup non e' pianificato: serve alla UI). */
export type PoolKey = 'morning' | 'evening' | 'streak' | 'comeback' | 'weekly' | 'monthly' | 'levelup'

export interface NotificationTexts {
  title(id: CharacterId): string
  variants(id: CharacterId, key: PoolKey): readonly string[]
}

export interface PlannedNotification {
  /** yyyymmdd * 10 + slot: deterministico, entra in int32 (es. 202611041). */
  id: number
  at: Date
  slot: NotificationSlot
  title: string
  body: string
  route: string
}

export const PLAN_HORIZON_DAYS = 7 // iOS: limite ~64 notifiche pendenti; 7 x 2 + 2 comeback resta ben sotto
export const QUIET_START_MIN = 8 * 60 // mai prima delle 08:00
export const QUIET_END_MIN = 22 * 60 // mai dopo le 22:00
export const STREAK_RISK_TIME = '21:00'
export const STREAK_RISK_MIN_STREAK = 3
export const COMEBACK_AFTER_DAYS = [3, 7] as const // poi stop
export const MONTH_END_WINDOW_DAYS = 3

const SLOT_NUMBER: Record<NotificationSlot, number> = {
  morning: 1,
  evening: 2,
  streak_risk: 3,
  weekly: 4,
  monthly: 5,
  comeback: 6,
}
const POOL_OF: Record<NotificationSlot, PoolKey> = {
  morning: 'morning',
  evening: 'evening',
  streak_risk: 'streak',
  weekly: 'weekly',
  monthly: 'monthly',
  comeback: 'comeback',
}

export const notificationId = (day: string, slot: NotificationSlot): number =>
  Number(day.replaceAll('-', '')) * 10 + SLOT_NUMBER[slot]

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number]
  return h * 60 + m
}

/** Orario locale del giorno logico `day`, forzato entro 08:00-22:00. */
export function timeOnDay(day: string, hhmm: string): Date {
  const minutes = Math.min(QUIET_END_MIN, Math.max(QUIET_START_MIN, minutesOf(hhmm)))
  const [y, m, d] = day.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60)
}

function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

/**
 * Variante scelta in modo deterministico (hash eroe+slot + giorno). Il passo e' coprimo con la
 * dimensione del pool, quindi due giorni consecutivi NON ottengono mai la stessa frase.
 */
export function pickVariantIndex(count: number, heroId: string, key: PoolKey, day: string): number {
  if (count <= 1) return 0
  const step = 7 % count === 0 ? 1 : 7
  const epochDay = dayDiff('1970-01-01', day)
  const base = hashString(`${heroId}:${key}`) % count
  return (((base + epochDay * step) % count) + count) % count
}

const fill = (template: string, vars: { n: number; name: string }): string =>
  template.replaceAll('{n}', String(vars.n)).replaceAll('{name}', vars.name)

export interface PlanInput {
  state: AppState
  now: Date
  texts: NotificationTexts
}

export function planNotifications({ state, now, texts }: PlanInput): PlannedNotification[] {
  const profile = state.profile
  const cfg = state.settings.notifications
  if (!profile || !cfg.enabled) return []

  const hour = state.settings.dayStartHour
  const today = dayKey(now, hour)
  const hero = profile.characterId
  const dailies = activeQuests(state, 'daily')
  const weeklies = activeQuests(state, 'weekly')
  const monthlies = activeQuests(state, 'monthly')
  const active = activeDays(state)

  const dailyDone = (day: string, q: Quest): boolean =>
    state.completions.some((c) => c.id === `${q.id}_${day}` && !!c.completedAt)
  const anyDailyDone = (day: string): boolean => dailies.some((q) => dailyDone(day, q))
  const allDailiesDone = (day: string): boolean => dailies.length > 0 && dailies.every((q) => dailyDone(day, q))
  // Per i giorni futuri non c'e' ancora nulla di fatto: qualsiasi attivita' richiede di aprire l'app,
  // e ogni apertura/completamento ripianifica. Quindi "nessun progresso" e' l'ipotesi corretta.
  const incomplete = (quests: Quest[], keyOfDay: (d: string) => string, day: string): boolean => {
    if (quests.length === 0) return false
    if (keyOfDay(day) !== keyOfDay(today)) return true
    return quests.some((q) => currentCount(state, q, now) < q.target)
  }

  const slots = new Map<string, PlannedNotification>() // `${giorno}:am|pm`

  function add(part: 'am' | 'pm', day: string, slot: NotificationSlot, at: Date, streak = 0): void {
    const variants = texts.variants(hero, POOL_OF[slot])
    if (variants.length === 0) return
    const template = variants[pickVariantIndex(variants.length, hero, POOL_OF[slot], day)] as string
    slots.set(`${day}:${part}`, {
      id: notificationId(day, slot),
      at,
      slot,
      title: texts.title(hero),
      body: fill(template, { n: streak, name: profile!.displayName }),
      route: '/',
    })
  }

  for (let i = 0; i < PLAN_HORIZON_DAYS; i++) {
    const day = addDays(today, i)

    // ── mattina: comeback a parte; qui un solo slot, scelto per priorita' ──
    if (cfg.weeklyMonthly && day.endsWith('-01') && monthlies.length > 0) {
      add('am', day, 'monthly', timeOnDay(day, cfg.morningTime)) // primo del mese
    } else if (cfg.weeklyMonthly && weekdayOf(day) === 1 && weeklies.length > 0) {
      add('am', day, 'weekly', timeOnDay(day, cfg.morningTime)) // lunedi': nuova settimana
    } else if (dailies.length > 0) {
      add('am', day, 'morning', timeOnDay(day, cfg.morningTime))
    }

    // ── sera: UNO slot per priorita' streak_risk > weekly/monthly > evening ──
    // Se oggi tutte le daily sono fatte, la serale (streak_risk/evening) di oggi sparisce.
    const cancelDailyEvening = i === 0 && allDailiesDone(today)
    const streak = computeStreak(active, day)
    if (
      cfg.streakRisk &&
      !cancelDailyEvening &&
      dailies.length > 0 &&
      !anyDailyDone(day) &&
      streak.current >= STREAK_RISK_MIN_STREAK
    ) {
      add('pm', day, 'streak_risk', timeOnDay(day, STREAK_RISK_TIME), streak.current)
    } else if (cfg.weeklyMonthly && weekdayOf(day) === 0 && incomplete(weeklies, isoWeekKey, day)) {
      add('pm', day, 'weekly', timeOnDay(day, cfg.eveningTime)) // domenica sera
    } else if (
      cfg.weeklyMonthly &&
      daysUntilMonthEnd(day) < MONTH_END_WINDOW_DAYS &&
      incomplete(monthlies, monthKeyOf, day)
    ) {
      add('pm', day, 'monthly', timeOnDay(day, cfg.eveningTime)) // ultimi 3 giorni del mese
    } else if (!cancelDailyEvening && dailies.length > 0) {
      add('pm', day, 'evening', timeOnDay(day, cfg.eveningTime))
    }
  }

  // ── comeback: dopo 3 e 7 giorni dall'ultima apertura, poi stop. Sostituisce la mattina del giorno. ──
  if (cfg.comeback) {
    const lastOpenDay = dayKey(new Date(state.lastOpenAt), hour)
    for (const after of COMEBACK_AFTER_DAYS) {
      const day = addDays(lastOpenDay, after)
      if (day < today) continue
      add('am', day, 'comeback', timeOnDay(day, cfg.morningTime))
    }
  }

  return [...slots.values()].filter((n) => n.at.getTime() > now.getTime()).sort((a, b) => a.at.getTime() - b.at.getTime())
}
