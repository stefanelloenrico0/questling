// Lingue supportate. PURO: nessun import da Vue/Nuxt.
export const LOCALES = ['it', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'it'

/** Nome della lingua nella lingua stessa (non si traduce). */
export const LOCALE_NAMES: Record<Locale, string> = { it: 'Italiano', en: 'English' }

/** Tag BCP 47 per Intl (date, elenchi). */
export const LOCALE_TAGS: Record<Locale, string> = { it: 'it-IT', en: 'en-GB' }

export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

/** Sceglie la lingua dall'elenco del dispositivo (es. navigator.languages): la prima supportata, altrimenti l'italiano. */
export function detectLocale(languages: readonly string[] | undefined | null): Locale {
  for (const lang of languages ?? []) {
    const base = String(lang).toLowerCase().split(/[-_]/)[0]
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}
