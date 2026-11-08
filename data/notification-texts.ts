import charactersIt from '../i18n/locales/it/characters.json'
import charactersEn from '../i18n/locales/en/characters.json'
import notificationsIt from '../i18n/locales/it/notifications.json'
import notificationsEn from '../i18n/locales/en/notifications.json'
import type { NotificationTexts, PoolKey } from '../core/notifications-plan'
import type { Locale } from '../core/locale'
import type { CharacterId } from '../core/types'

type Pools = Record<CharacterId, Record<PoolKey, string[]>>

const BY_LOCALE = {
  it: { characters: charactersIt, notifications: notificationsIt },
  en: { characters: charactersEn, notifications: notificationsEn },
} as const

/** Testi delle notifiche nella lingua scelta (le notifiche non passano da vue-i18n: sono programmate in anticipo). */
export function textsFor(locale: Locale): NotificationTexts {
  const { characters, notifications } = BY_LOCALE[locale]
  return {
    title: (id) => characters[id].name,
    variants: (id, key) => (notifications.pools as Pools)[id][key],
  }
}

/** Italiano: usato dai test e come predefinito. */
export const notificationTexts: NotificationTexts = textsFor('it')

export const channelFor = (locale: Locale): { name: string; description: string } => BY_LOCALE[locale].notifications.channel

/** Frase di level-up dell'eroe, scelta in modo deterministico dal livello raggiunto. */
export function levelUpLine(id: CharacterId, level: number, locale: Locale = 'it'): string {
  const lines = (BY_LOCALE[locale].notifications.pools as Pools)[id].levelup
  return lines[Math.max(0, level) % lines.length] as string
}
