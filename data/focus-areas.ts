import type { Difficulty, Period } from '../core/types'
import type { IconId } from './icons'

export const FOCUS_IDS = ['move', 'mind', 'home', 'craft', 'calm', 'money'] as const
export type FocusId = (typeof FOCUS_IDS)[number]

/** Quante aree si possono scegliere in onboarding (tengono le missioni sotto i tetti: 7 daily, 4 settimanali). */
export const MAX_FOCUS = 3

export interface FocusQuest {
  /** Chiave i18n: focus.areas.{id}.{key} */
  key: 'q1' | 'q2'
  icon: IconId
  period: Period
  difficulty: Difficulty
  target: number
}

export interface FocusArea {
  id: FocusId
  icon: IconId
  /** Una giornaliera (pre-selezionata) e una settimanale. */
  quests: readonly [FocusQuest, FocusQuest]
}

export const FOCUS_AREAS: readonly FocusArea[] = [
  {
    id: 'move',
    icon: 'dumbbell',
    quests: [
      { key: 'q1', icon: 'shoe', period: 'daily', difficulty: 'medium', target: 1 },
      { key: 'q2', icon: 'dumbbell', period: 'weekly', difficulty: 'medium', target: 3 },
    ],
  },
  {
    id: 'mind',
    icon: 'brain',
    quests: [
      { key: 'q1', icon: 'book', period: 'daily', difficulty: 'easy', target: 1 },
      { key: 'q2', icon: 'brain', period: 'weekly', difficulty: 'medium', target: 2 },
    ],
  },
  {
    id: 'home',
    icon: 'home',
    quests: [
      { key: 'q1', icon: 'home', period: 'daily', difficulty: 'easy', target: 1 },
      { key: 'q2', icon: 'check', period: 'weekly', difficulty: 'medium', target: 1 },
    ],
  },
  {
    id: 'craft',
    icon: 'pencil',
    quests: [
      { key: 'q1', icon: 'pencil', period: 'daily', difficulty: 'medium', target: 1 },
      { key: 'q2', icon: 'star', period: 'weekly', difficulty: 'hard', target: 1 },
    ],
  },
  {
    id: 'calm',
    icon: 'moon',
    quests: [
      { key: 'q1', icon: 'bed', period: 'daily', difficulty: 'medium', target: 1 },
      { key: 'q2', icon: 'phone', period: 'weekly', difficulty: 'easy', target: 2 },
    ],
  },
  {
    id: 'money',
    icon: 'coin',
    quests: [
      { key: 'q1', icon: 'coin', period: 'daily', difficulty: 'easy', target: 1 },
      { key: 'q2', icon: 'key', period: 'weekly', difficulty: 'medium', target: 1 },
    ],
  },
]

export const FOCUS_BY_ID = Object.fromEntries(FOCUS_AREAS.map((a) => [a.id, a])) as Record<FocusId, FocusArea>
