// Transizioni di stato del gioco: funzioni PURE (stato in -> nuovo stato out).
// Tempo e generazione degli id arrivano dal chiamante (GameCtx).
import { dayKey, periodKey } from './periods'
import { levelFromXp, levelUpInfo, unlockedChapterNumbers, type LevelUpInfo } from './levels'
import { computeStreak } from './streak'
import {
  ALL_DONE_BONUS,
  ALL_DONE_MIN_QUESTS,
  QUEST_CAPS,
  STREAK_MILESTONES,
  TARGET_LIMITS,
  questXp,
  sumXp,
  xpByRef,
} from './xp'
import type {
  AppState,
  CharacterId,
  Completion,
  Difficulty,
  Period,
  Quest,
  XpEvent,
  XpReason,
} from './types'
import { CHARACTER_IDS } from './types'

export interface GameCtx {
  now: Date
  newId: () => string
}

export interface ActionOutcome {
  state: AppState
  changed: boolean
  xpDelta: number
  levelUp: LevelUpInfo | null
}

export const MAX_TITLE_LENGTH = 60
export const MAX_NAME_LENGTH = 24

export interface QuestInput {
  title: string
  icon: string
  difficulty: Difficulty
  period: Period
  target: number
}

export type QuestError = 'invalid_title' | 'invalid_icon' | 'cap_reached' | 'not_found'
export type QuestResult = { ok: true; state: AppState; quest: Quest } | { ok: false; error: QuestError }

const iso = (d: Date): string => d.toISOString()

function mkEvent(ctx: GameCtx, delta: number, reason: XpReason, refId: string): XpEvent {
  return { id: ctx.newId(), at: iso(ctx.now), delta, reason, refId }
}

export const activeQuests = (state: AppState, period?: Period): Quest[] =>
  state.quests.filter((q) => !q.archivedAt && (period === undefined || q.period === period))

export const totalXp = (state: AppState): number => sumXp(state.xpEvents)

/** dayKey in cui almeno una daily e' stata completata. */
export function activeDays(state: AppState): Set<string> {
  const dailyIds = new Set(state.quests.filter((q) => q.period === 'daily').map((q) => q.id))
  const days = new Set<string>()
  for (const c of state.completions) if (c.completedAt && dailyIds.has(c.questId)) days.add(c.periodKey)
  return days
}

export function clampTarget(period: Period, target: number): number {
  const { min, max } = TARGET_LIMITS[period]
  return Math.min(max, Math.max(min, Math.round(Number.isFinite(target) ? target : min)))
}

/** I capitoli, come il livello, appartengono al giocatore: si sbloccano per tutti gli eroi e non si perdono. */
function syncChapters(state: AppState): AppState {
  const nums = unlockedChapterNumbers(levelFromXp(totalXp(state)).level)
  const unlockedChapters = { ...state.unlockedChapters }
  let changed = false
  for (const id of CHARACTER_IDS) {
    const merged = [...new Set([...(unlockedChapters[id] ?? []), ...nums])].sort((a, b) => a - b)
    if (merged.length !== (unlockedChapters[id] ?? []).length) {
      unlockedChapters[id] = merged
      changed = true
    }
  }
  return changed ? { ...state, unlockedChapters } : state
}

function finalize(prev: AppState, next: AppState): ActionOutcome {
  const synced = syncChapters(next)
  const before = levelFromXp(totalXp(prev)).level
  const after = levelFromXp(totalXp(synced)).level
  return {
    state: synced,
    changed: true,
    xpDelta: totalXp(synced) - totalXp(prev),
    levelUp: levelUpInfo(before, after),
  }
}

const unchanged = (state: AppState): ActionOutcome => ({ state, changed: false, xpDelta: 0, levelUp: null })

/** Bonus "tutte fatte" per un giorno: allinea gli eventi a quanto atteso. */
function dailyBonusEvents(state: AppState, day: string, ctx: GameCtx): XpEvent[] {
  const hour = state.settings.dayStartHour
  const dailies = activeQuests(state, 'daily').filter((q) => dayKey(new Date(q.createdAt), hour) <= day)
  const done = new Set(state.completions.filter((c) => c.periodKey === day && c.completedAt).map((c) => c.questId))
  const eligible = dailies.length >= ALL_DONE_MIN_QUESTS && dailies.every((q) => done.has(q.id))
  const diff = (eligible ? ALL_DONE_BONUS : 0) - xpByRef(state.xpEvents, 'daily_bonus', day)
  return diff === 0 ? [] : [mkEvent(ctx, diff, 'daily_bonus', day)]
}

/** Traguardi streak: allinea gli eventi a quelli attesi (un undo puo' ritirarli). */
function streakMilestoneEvents(state: AppState, ctx: GameCtx): XpEvent[] {
  const today = dayKey(ctx.now, state.settings.dayStartHour)
  const expected = new Map<string, number>()
  for (const m of computeStreak(activeDays(state), today).milestones) {
    const xp = STREAK_MILESTONES.find((s) => s.days === m.days)?.xp ?? 0
    expected.set(`${m.days}:${m.dayKey}`, xp)
  }
  const existing = new Map<string, number>()
  for (const e of state.xpEvents) {
    if (e.reason === 'streak_milestone' && e.refId) existing.set(e.refId, (existing.get(e.refId) ?? 0) + e.delta)
  }
  const events: XpEvent[] = []
  for (const ref of new Set([...expected.keys(), ...existing.keys()])) {
    const diff = (expected.get(ref) ?? 0) - (existing.get(ref) ?? 0)
    if (diff !== 0) events.push(mkEvent(ctx, diff, 'streak_milestone', ref))
  }
  return events
}

/** Imposta il progresso del periodo corrente di una missione e assegna/ritira l'XP. */
function setCount(state: AppState, quest: Quest, count: number, ctx: GameCtx): AppState {
  const key = periodKey(quest.period, ctx.now, state.settings.dayStartHour)
  const id = `${quest.id}_${key}`
  const nowIso = iso(ctx.now)
  const prev = state.completions.find((c) => c.id === id)
  const done = count >= quest.target
  const completion: Completion = {
    id,
    questId: quest.id,
    periodKey: key,
    count,
    completedAt: done ? (prev?.completedAt ?? nowIso) : null,
    updatedAt: nowIso,
  }
  let next: AppState = {
    ...state,
    completions: prev ? state.completions.map((c) => (c.id === id ? completion : c)) : [...state.completions, completion],
  }

  // XP solo al raggiungimento del target, una volta per periodo; l'undo ritira esattamente quanto dato.
  const given = xpByRef(state.xpEvents, 'quest', id)
  const events: XpEvent[] = []
  if (done && given === 0) events.push(mkEvent(ctx, questXp(quest.difficulty, quest.period), 'quest', id))
  else if (!done && given > 0) events.push(mkEvent(ctx, -given, 'quest', id))
  next = { ...next, xpEvents: [...next.xpEvents, ...events] }

  if (quest.period === 'daily') {
    const bonus = dailyBonusEvents(next, key, ctx)
    next = { ...next, xpEvents: [...next.xpEvents, ...bonus] }
    const milestones = streakMilestoneEvents(next, ctx)
    next = { ...next, xpEvents: [...next.xpEvents, ...milestones] }
  }
  return next
}

export function currentCount(state: AppState, quest: Quest, now: Date): number {
  const id = `${quest.id}_${periodKey(quest.period, now, state.settings.dayStartHour)}`
  return state.completions.find((c) => c.id === id)?.count ?? 0
}

/** +1 / -1 sul periodo corrente. Non si puo' modificare un periodo passato. */
export function progressQuest(state: AppState, questId: string, direction: 1 | -1, ctx: GameCtx): ActionOutcome {
  const quest = state.quests.find((q) => q.id === questId && !q.archivedAt)
  if (!quest) return unchanged(state)
  const count = currentCount(state, quest, ctx.now)
  const next = Math.min(quest.target, Math.max(0, count + direction))
  if (next === count) return unchanged(state)
  return finalize(state, setCount(state, quest, next, ctx))
}

function validTitle(title: string): string | null {
  const t = title.trim().replace(/\s+/g, ' ')
  return t.length >= 1 && t.length <= MAX_TITLE_LENGTH ? t : null
}

export function createQuest(state: AppState, input: QuestInput, ctx: GameCtx): QuestResult {
  const title = validTitle(input.title)
  if (!title) return { ok: false, error: 'invalid_title' }
  if (!input.icon) return { ok: false, error: 'invalid_icon' }
  if (activeQuests(state, input.period).length >= QUEST_CAPS[input.period]) return { ok: false, error: 'cap_reached' }
  const order = Math.max(-1, ...activeQuests(state, input.period).map((q) => q.order)) + 1
  const nowIso = iso(ctx.now)
  const quest: Quest = {
    id: ctx.newId(),
    title,
    icon: input.icon,
    difficulty: input.difficulty,
    period: input.period,
    target: clampTarget(input.period, input.target),
    order,
    createdAt: nowIso,
    updatedAt: nowIso,
    archivedAt: null,
  }
  return { ok: true, state: { ...state, quests: [...state.quests, quest] }, quest }
}

export interface QuestPatch {
  title?: string
  icon?: string
  difficulty?: Difficulty
  target?: number
}

/** Il periodo non si cambia: per farlo si archivia e si ricrea (le chiavi di completamento dipendono dal periodo). */
export function updateQuest(state: AppState, questId: string, patch: QuestPatch, ctx: GameCtx): QuestResult {
  const quest = state.quests.find((q) => q.id === questId && !q.archivedAt)
  if (!quest) return { ok: false, error: 'not_found' }
  let title = quest.title
  if (patch.title !== undefined) {
    const t = validTitle(patch.title)
    if (!t) return { ok: false, error: 'invalid_title' }
    title = t
  }
  const updated: Quest = {
    ...quest,
    title,
    icon: patch.icon || quest.icon,
    difficulty: patch.difficulty ?? quest.difficulty,
    target: patch.target === undefined ? quest.target : clampTarget(quest.period, patch.target),
    updatedAt: iso(ctx.now),
  }
  let next: AppState = { ...state, quests: state.quests.map((q) => (q.id === questId ? updated : q)) }
  // Se il target cambia, il progresso del periodo corrente va riallineato (con XP coerente).
  if (updated.target !== quest.target) {
    const key = periodKey(updated.period, ctx.now, state.settings.dayStartHour)
    if (next.completions.some((c) => c.id === `${questId}_${key}`)) {
      next = setCount(next, updated, Math.min(currentCount(next, updated, ctx.now), updated.target), ctx)
    }
  }
  return { ok: true, state: syncChapters(next), quest: updated }
}

export function archiveQuest(state: AppState, questId: string, ctx: GameCtx): ActionOutcome {
  if (!state.quests.some((q) => q.id === questId && !q.archivedAt)) return unchanged(state)
  const nowIso = iso(ctx.now)
  return finalize(state, {
    ...state,
    quests: state.quests.map((q) => (q.id === questId ? { ...q, archivedAt: nowIso, updatedAt: nowIso } : q)),
  })
}

export function reorderQuests(state: AppState, period: Period, orderedIds: readonly string[], ctx: GameCtx): AppState {
  const nowIso = iso(ctx.now)
  return {
    ...state,
    quests: state.quests.map((q) => {
      const idx = orderedIds.indexOf(q.id)
      return q.period === period && !q.archivedAt && idx >= 0 ? { ...q, order: idx, updatedAt: nowIso } : q
    }),
  }
}

/** Cambiare eroe NON tocca XP, livello, streak o completamenti (D5). */
export function setCharacter(state: AppState, characterId: CharacterId, ctx: GameCtx): AppState {
  if (!state.profile) return state
  return syncChapters({
    ...state,
    profile: { ...state.profile, characterId, updatedAt: iso(ctx.now) },
  })
}

export function setQuizAnswers(state: AppState, answers: readonly number[], ctx: GameCtx): AppState {
  if (!state.profile) return state
  return { ...state, profile: { ...state.profile, quizAnswers: [...answers], updatedAt: iso(ctx.now) } }
}

export function renameProfile(state: AppState, displayName: string, ctx: GameCtx): AppState {
  const name = displayName.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH)
  if (!state.profile || !name) return state
  return { ...state, profile: { ...state.profile, displayName: name, updatedAt: iso(ctx.now) } }
}

export interface OnboardingInput {
  displayName: string
  characterId: CharacterId
  quizAnswers?: readonly number[]
  quests: readonly QuestInput[]
}

export function completeOnboarding(state: AppState, input: OnboardingInput, ctx: GameCtx): AppState | null {
  const name = input.displayName.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH)
  if (!name) return null
  const nowIso = iso(ctx.now)
  let next: AppState = {
    ...state,
    profile: {
      displayName: name,
      characterId: input.characterId,
      ...(input.quizAnswers ? { quizAnswers: [...input.quizAnswers] } : {}),
      onboardedAt: nowIso,
      updatedAt: nowIso,
    },
    lastOpenAt: nowIso,
  }
  for (const q of input.quests) {
    const res = createQuest(next, q, ctx)
    if (res.ok) next = res.state
  }
  return syncChapters(next)
}

export interface SettingsPatch {
  dayStartHour?: number
  sound?: boolean
  haptics?: boolean
  notifications?: Partial<AppState['settings']['notifications']>
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

export function updateSettings(state: AppState, patch: SettingsPatch): AppState {
  const { notifications, ...rest } = patch
  const dayStartHour =
    rest.dayStartHour === undefined ? state.settings.dayStartHour : Math.min(6, Math.max(0, Math.round(rest.dayStartHour)))
  const next = { ...state.settings.notifications, ...notifications }
  // Orari non validi vengono ignorati (restano quelli precedenti).
  if (!HHMM.test(next.morningTime)) next.morningTime = state.settings.notifications.morningTime
  if (!HHMM.test(next.eveningTime)) next.eveningTime = state.settings.notifications.eveningTime
  return { ...state, settings: { ...state.settings, ...rest, dayStartHour, notifications: next } }
}

/** Segna l'apertura/ritorno in primo piano (serve ai promemoria di "ritorno"). */
export function touchOpen(state: AppState, now: Date): AppState {
  return { ...state, lastOpenAt: now.toISOString() }
}
