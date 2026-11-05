import { createQuest, type GameCtx, type QuestInput } from '../../core/game'
import { createInitialState } from '../../core/schema'
import { ulid } from '../../core/id'
import type { AppState, CharacterId } from '../../core/types'

let counter = 0
/** Id deterministici nei test. */
export const testId = (): string => `T${String(++counter).padStart(6, '0')}`

export const at = (y: number, m: number, d: number, h = 12, min = 0): Date => new Date(y, m - 1, d, h, min)
export const ctxAt = (now: Date): GameCtx => ({ now, newId: testId })

export function onboarded(characterId: CharacterId = 'valdo', now = at(2026, 11, 4, 9)): AppState {
  const s = createInitialState(now)
  return {
    ...s,
    profile: { displayName: 'Enrico', characterId, onboardedAt: now.toISOString(), updatedAt: now.toISOString() },
  }
}

export const daily = (title: string, difficulty: QuestInput['difficulty'] = 'medium'): QuestInput => ({
  title,
  icon: 'star',
  difficulty,
  period: 'daily',
  target: 1,
})

/** Crea piu' missioni; lancia se non riesce. */
export function withQuests(state: AppState, inputs: QuestInput[], now = at(2026, 11, 1, 9)): AppState {
  let s = state
  for (const input of inputs) {
    const res = createQuest(s, input, ctxAt(now))
    if (!res.ok) throw new Error(res.error)
    s = res.state
  }
  return s
}

export const sampleUlid = (): string => ulid(1_790_000_000_000, () => 0.5)
