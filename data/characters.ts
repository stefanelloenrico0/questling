import type { AxisSigns, CharacterId } from '../core/types'

/** Come si sblocca un eroe. Il livello e il record di streak sono derivati dallo storico: nessun dato in piu' da salvare. */
export type UnlockRule = { kind: 'level'; value: number } | { kind: 'streak'; value: number }

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
  { id: 'valdo', accent: '#41a6f6', axes: { O: 1, M: -1, S: 1, A: 1 } },
  { id: 'kuro', accent: '#94b0c2', axes: { O: 1, M: -1, S: -1, A: -1 } },
  { id: 'fenna', accent: '#38b764', axes: { O: -1, M: -1, S: -1, A: 1 } },
  { id: 'zeffiro', accent: '#73eff7', axes: { O: -1, M: 1, S: -1, A: -1 } },
  { id: 'lumen', accent: '#ffcd75', axes: { O: 1, M: 1, S: 1, A: -1 } },
  { id: 'rondo', accent: '#ef7d57', axes: { O: -1, M: 1, S: 1, A: 1 } },
  { id: 'u404', accent: '#a7f070', axes: { O: 1, M: 1, S: -1, A: 1 } },
  { id: 'brunilde', accent: '#e8707f', axes: { O: -1, M: -1, S: 1, A: -1 } },
  { id: 'salmastro', accent: '#2fb5a8', unlock: { kind: 'level', value: 10 } },
  { id: 'plin', accent: '#b085f5', unlock: { kind: 'streak', value: 30 } },
  { id: 'brace', accent: '#ff5d5d', unlock: { kind: 'level', value: 20 } },
]

/** Gli otto eroi che il quiz puo' assegnare. */
export const QUIZ_CHARACTERS: readonly QuizCharacter[] = CHARACTERS.filter((c): c is QuizCharacter => c.axes !== undefined)

export const CHARACTER_BY_ID = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
) as Record<CharacterId, CharacterData>
