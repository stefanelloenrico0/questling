import type { AxisSigns, CharacterId } from '../core/types'

export type PlaceholderShape = 'helm' | 'hood' | 'hat' | 'halo' | 'antenna' | 'feather' | 'braids' | 'cap'

export interface CharacterData {
  id: CharacterId
  accent: string
  /** Segni sui 4 assi del quiz (spec §5) */
  axes: AxisSigns
  /** Forma riconoscibile usata dallo sprite placeholder */
  placeholderShape: PlaceholderShape
}

export const SPRITE_FRAME = 32
export const SPRITE_FRAMES = 4

export const CHARACTERS: readonly CharacterData[] = [
  { id: 'valdo', accent: '#41a6f6', axes: { O: 1, M: -1, S: 1, A: 1 }, placeholderShape: 'helm' },
  { id: 'kuro', accent: '#94b0c2', axes: { O: 1, M: -1, S: -1, A: -1 }, placeholderShape: 'hood' },
  { id: 'fenna', accent: '#38b764', axes: { O: -1, M: -1, S: -1, A: 1 }, placeholderShape: 'cap' },
  { id: 'zeffiro', accent: '#73eff7', axes: { O: -1, M: 1, S: -1, A: -1 }, placeholderShape: 'hat' },
  { id: 'lumen', accent: '#ffcd75', axes: { O: 1, M: 1, S: 1, A: -1 }, placeholderShape: 'halo' },
  { id: 'rondo', accent: '#ef7d57', axes: { O: -1, M: 1, S: 1, A: 1 }, placeholderShape: 'feather' },
  { id: 'u404', accent: '#a7f070', axes: { O: 1, M: 1, S: -1, A: 1 }, placeholderShape: 'antenna' },
  { id: 'brunilde', accent: '#e8707f', axes: { O: -1, M: -1, S: 1, A: -1 }, placeholderShape: 'braids' },
]

export const CHARACTER_BY_ID = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
) as Record<CharacterId, CharacterData>
