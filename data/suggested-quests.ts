import type { CharacterId, Difficulty, Period } from '../core/types'
import type { IconId } from './icons'

export interface SuggestedQuest {
  /** Chiave i18n: characters.{id}.quests.{key} */
  key: 'q1' | 'q2' | 'q3' | 'q4'
  icon: IconId
  period: Period
  difficulty: Difficulty
  target: number
}

// Le prime tre sono daily (pre-selezionate in onboarding), la quarta e' settimanale (spec §5).
export const SUGGESTED_QUESTS: Record<CharacterId, readonly SuggestedQuest[]> = {
  valdo: [
    { key: 'q1', icon: 'dumbbell', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q2', icon: 'bed', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q3', icon: 'heart', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'phone', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
  kuro: [
    { key: 'q1', icon: 'brain', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q2', icon: 'phone', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q3', icon: 'pencil', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'home', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
  fenna: [
    { key: 'q1', icon: 'leaf', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q2', icon: 'shoe', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q3', icon: 'drop', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'sun', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
  zeffiro: [
    { key: 'q1', icon: 'book', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q2', icon: 'brain', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q3', icon: 'pencil', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'star', period: 'weekly', difficulty: 'hard', target: 1 },
  ],
  lumen: [
    { key: 'q1', icon: 'moon', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q2', icon: 'heart', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q3', icon: 'apple', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'phone', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
  rondo: [
    { key: 'q1', icon: 'pencil', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q2', icon: 'music', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q3', icon: 'phone', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'star', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
  u404: [
    { key: 'q1', icon: 'check', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q2', icon: 'clock', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q3', icon: 'coin', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'key', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
  brunilde: [
    { key: 'q1', icon: 'cup', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q2', icon: 'home', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q3', icon: 'drop', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'dumbbell', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
  salmastro: [
    { key: 'q1', icon: 'home', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q2', icon: 'drop', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q3', icon: 'book', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q4', icon: 'coin', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
  plin: [
    { key: 'q1', icon: 'moon', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q2', icon: 'pencil', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q3', icon: 'shoe', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'brain', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
  brace: [
    { key: 'q1', icon: 'home', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q2', icon: 'dumbbell', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q3', icon: 'star', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'coin', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
  ulisse: [
    { key: 'q1', icon: 'book', period: 'daily', difficulty: 'medium', target: 1 },
    { key: 'q2', icon: 'bed', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q3', icon: 'pencil', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'brain', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
  cometa: [
    { key: 'q1', icon: 'star', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q2', icon: 'shoe', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q3', icon: 'pencil', period: 'daily', difficulty: 'easy', target: 1 },
    { key: 'q4', icon: 'sun', period: 'weekly', difficulty: 'medium', target: 1 },
  ],
}
