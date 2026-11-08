import type { AxisSigns, CharacterId } from '../core/types'

/** Come si sblocca un eroe. Il livello e il record di streak sono derivati dallo storico: nessun dato in piu' da salvare. */
export type UnlockRule = { kind: 'level'; value: number } | { kind: 'streak'; value: number }

// Accento = versione per tema scuro dalla palette del manuale grafico (docs/design-brief.md, direzione A).
export interface CharacterData {
  id: CharacterId
  accent: string
  /** Segni sui 4 assi del quiz (spec §5). Assenti per gli eroi sbloccabili, che il quiz non assegna mai. */
  axes?: AxisSigns
  /** Presente solo sugli eroi sbloccabili. */
  unlock?: UnlockRule
}

export type QuizCharacter = CharacterData & { axes: AxisSigns }

export const CHARACTERS: readonly CharacterData[] = [
  { id: 'valdo', accent: '#82a8ff', axes: { O: 1, M: -1, S: 1, A: 1 } },
  { id: 'kuro', accent: '#c7d0db', axes: { O: 1, M: -1, S: -1, A: -1 } },
  { id: 'fenna', accent: '#91c394', axes: { O: -1, M: -1, S: -1, A: 1 } },
  { id: 'zeffiro', accent: '#73d5e2', axes: { O: -1, M: 1, S: -1, A: -1 } },
  { id: 'lumen', accent: '#edc875', axes: { O: 1, M: 1, S: 1, A: -1 } },
  { id: 'rondo', accent: '#f0a46d', axes: { O: -1, M: 1, S: 1, A: 1 } },
  { id: 'u404', accent: '#c0dd78', axes: { O: 1, M: 1, S: -1, A: 1 } },
  { id: 'brunilde', accent: '#f1a8c6', axes: { O: -1, M: -1, S: 1, A: -1 } },
  { id: 'salmastro', accent: '#72cabb', unlock: { kind: 'level', value: 10 } },
  { id: 'plin', accent: '#b9a8f0', unlock: { kind: 'streak', value: 30 } },
  { id: 'brace', accent: '#f08c80', unlock: { kind: 'level', value: 20 } },
]

/** Gli otto eroi che il quiz puo' assegnare. */
export const QUIZ_CHARACTERS: readonly QuizCharacter[] = CHARACTERS.filter((c): c is QuizCharacter => c.axes !== undefined)

export const CHARACTER_BY_ID = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
) as Record<CharacterId, CharacterData>
