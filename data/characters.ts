import type { AxisSigns, CharacterId } from '../core/types'

export interface CharacterData {
  id: CharacterId
  accent: string
  /** Segni sui 4 assi del quiz (spec §5) */
  axes: AxisSigns
}

export const CHARACTERS: readonly CharacterData[] = [
  { id: 'valdo', accent: '#41a6f6', axes: { O: 1, M: -1, S: 1, A: 1 } },
  { id: 'kuro', accent: '#94b0c2', axes: { O: 1, M: -1, S: -1, A: -1 } },
  { id: 'fenna', accent: '#38b764', axes: { O: -1, M: -1, S: -1, A: 1 } },
  { id: 'zeffiro', accent: '#73eff7', axes: { O: -1, M: 1, S: -1, A: -1 } },
  { id: 'lumen', accent: '#ffcd75', axes: { O: 1, M: 1, S: 1, A: -1 } },
  { id: 'rondo', accent: '#ef7d57', axes: { O: -1, M: 1, S: 1, A: 1 } },
  { id: 'u404', accent: '#a7f070', axes: { O: 1, M: 1, S: -1, A: 1 } },
  { id: 'brunilde', accent: '#e8707f', axes: { O: -1, M: -1, S: 1, A: -1 } },
]

export const CHARACTER_BY_ID = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
) as Record<CharacterId, CharacterData>
