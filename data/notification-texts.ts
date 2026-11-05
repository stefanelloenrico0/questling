import characters from '../i18n/locales/it/characters.json'
import notifications from '../i18n/locales/it/notifications.json'
import type { NotificationTexts, PoolKey } from '../core/notifications-plan'
import type { CharacterId } from '../core/types'

type Pools = Record<CharacterId, Record<PoolKey, string[]>>

/** Testi delle notifiche (per ora solo italiano: il resto della UI usa vue-i18n). */
export const notificationTexts: NotificationTexts = {
  title: (id) => characters[id].name,
  variants: (id, key) => (notifications.pools as Pools)[id][key],
}

export const notificationChannel = notifications.channel

/** Frase di level-up dell'eroe, scelta in modo deterministico dal livello raggiunto. */
export function levelUpLine(id: CharacterId, level: number): string {
  const lines = (notifications.pools as Pools)[id].levelup
  return lines[Math.max(0, level) % lines.length] as string
}
