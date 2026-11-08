// Eroi sbloccabili. PURO: dipende solo dai dati degli eroi e da due numeri derivati dallo storico.
import { CHARACTERS, type UnlockRule } from '../data/characters'
import type { CharacterId } from './types'

/** Progressi che contano per gli sblocchi. Entrambi derivano dallo storico (livello dall'XP, record di streak). */
export interface HeroProgress {
  level: number
  bestStreak: number
}

export function ruleMet(rule: UnlockRule | undefined, progress: HeroProgress): boolean {
  if (!rule) return true
  return rule.kind === 'level' ? progress.level >= rule.value : progress.bestStreak >= rule.value
}

export function isHeroUnlocked(id: CharacterId, progress: HeroProgress): boolean {
  return ruleMet(CHARACTERS.find((c) => c.id === id)?.unlock, progress)
}

/** Tutti gli eroi disponibili: gli otto di base piu' gli sbloccabili raggiunti. */
export function unlockedHeroIds(progress: HeroProgress): CharacterId[] {
  return CHARACTERS.filter((c) => ruleMet(c.unlock, progress)).map((c) => c.id)
}

/** Eroi che con `next` sono disponibili e con `prev` non lo erano. */
export function newlyUnlockedHeroes(prev: HeroProgress, next: HeroProgress): CharacterId[] {
  return CHARACTERS.filter((c) => c.unlock && !ruleMet(c.unlock, prev) && ruleMet(c.unlock, next)).map((c) => c.id)
}

/** Una scelta e' valida se l'eroe e' sbloccato o e' quello gia' in uso (un undo non toglie l'eroe a nessuno). */
export function canChooseHero(id: CharacterId, current: CharacterId | null, progress: HeroProgress): boolean {
  return id === current || isHeroUnlocked(id, progress)
}
