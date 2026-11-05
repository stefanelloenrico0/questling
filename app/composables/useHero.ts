import { tierOf } from '../../core/levels'
import type { CharacterId } from '../../core/types'

// Accessori ai testi dell'eroe (tutto in i18n/locales/<lingua>/characters.json).
export function useHero() {
  const { t } = useI18n()
  return {
    name: (id: CharacterId): string => t(`characters.${id}.name`),
    archetype: (id: CharacterId): string => t(`characters.${id}.archetype`),
    appearance: (id: CharacterId): string => t(`characters.${id}.appearance`),
    voice: (id: CharacterId): string => t(`characters.${id}.voice`),
    tierTitle: (id: CharacterId, tier: number): string => t(`characters.${id}.titles.t${tier}`),
    levelTitle: (id: CharacterId, level: number): string => t(`characters.${id}.titles.t${tierOf(level)}`),
    chapter: (id: CharacterId, n: number): string => t(`characters.${id}.chapters.c${n}`),
    line: (id: CharacterId, kind: 'morning' | 'evening' | 'done'): string => t(`characters.${id}.lines.${kind}`),
    permission: (id: CharacterId): string => t(`characters.${id}.permission`),
    questTitle: (id: CharacterId, key: string): string => t(`characters.${id}.quests.${key}`),
  }
}

/** Colore d'accento forzato (es. durante l'onboarding, quando l'eroe non e' ancora salvato). */
export const useAccentOverride = () => useState<string | null>('accent-override', () => null)
