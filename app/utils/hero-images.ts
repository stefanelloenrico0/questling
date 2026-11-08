import type { CharacterId } from '../../core/types'

// Illustrazioni dipinte (app/assets/heroes/art/hero_<id>_full.webp|png, 900x1200 con alpha).
// Se manca il file di un eroe, i componenti ripiegano sull'SVG.
const PAINTED = import.meta.glob('../assets/heroes/art/hero_*_full.{webp,png}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const BY_ID = Object.fromEntries(
  Object.entries(PAINTED).map(([path, url]) => [/hero_(.+)_full\./.exec(path)?.[1] ?? '', url]),
) as Partial<Record<CharacterId, string>>

export const heroImageUrl = (id: CharacterId): string | null => BY_ID[id] ?? null
