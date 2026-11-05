// Il livello NON si memorizza: si deriva dalla somma degli XpEvent.
export const xpToNext = (level: number): number => Math.round(50 * level ** 1.1)

export interface LevelInfo {
  level: number
  xpInLevel: number
  xpToNext: number
}

export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1
  let rest = Math.max(0, totalXp)
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level)
    level++
  }
  return { level, xpInLevel: rest, xpToNext: xpToNext(level) }
}

/** Livelli in cui scatta un nuovo tier (e si sblocca il capitolo corrispondente). */
export const TIER_LEVELS = [1, 5, 10, 15, 20] as const
export type Tier = 1 | 2 | 3 | 4 | 5

export function tierOf(level: number): Tier {
  let tier = 1
  TIER_LEVELS.forEach((l, i) => {
    if (level >= l) tier = i + 1
  })
  return tier as Tier
}

/** Capitoli sbloccati a un dato livello: [1], [1,2] (Lv5), ... [1..5] (Lv20). */
export function unlockedChapterNumbers(level: number): number[] {
  return Array.from({ length: tierOf(level) }, (_, i) => i + 1)
}

export interface LevelUpInfo {
  from: number
  to: number
  tier: Tier
  tierChanged: boolean
  /** Capitolo appena sbloccato (coincide col tier quando il tier cambia). */
  chapter: number | null
}

export function levelUpInfo(fromLevel: number, toLevel: number): LevelUpInfo | null {
  if (toLevel <= fromLevel) return null
  const tierChanged = tierOf(toLevel) !== tierOf(fromLevel)
  return {
    from: fromLevel,
    to: toLevel,
    tier: tierOf(toLevel),
    tierChanged,
    chapter: tierChanged ? tierOf(toLevel) : null,
  }
}
