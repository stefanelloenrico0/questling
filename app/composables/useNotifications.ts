import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type PermissionStatus } from '@capacitor/local-notifications'
import { notificationChannel, notificationTexts } from '../../data/notification-texts'
import { planNotifications, type PlannedNotification } from '../../core/notifications-plan'

export type ReminderPermission = 'granted' | 'denied' | 'prompt' | 'unsupported'

const CHANNEL_ID = 'reminders'
const isNative = (): boolean => Capacitor.isNativePlatform()

function mapPermission(display: PermissionStatus['display']): ReminderPermission {
  if (display === 'granted') return 'granted'
  if (display === 'denied') return 'denied'
  return 'prompt'
}

// Stato di modulo: l'adapter e' un singleton (una sola coda di riprogrammazioni per app).
let queue: Promise<unknown> = Promise.resolve()
let lastSignature: string | null = null
let channelReady = false
let listenerReady = false

/**
 * Adapter nativo delle notifiche locali: cancella tutto il pendente e riprogramma il piano
 * deterministico di core/notifications-plan.ts. Sul web e' un no-op con log.
 */
export function useNotifications() {
  const game = useGameStore()

  async function permission(): Promise<ReminderPermission> {
    if (!isNative()) return 'unsupported'
    return mapPermission((await LocalNotifications.checkPermissions()).display)
  }

  async function requestPermission(): Promise<ReminderPermission> {
    if (!isNative()) return 'unsupported'
    return mapPermission((await LocalNotifications.requestPermissions()).display)
  }

  async function ensureChannel(): Promise<void> {
    if (channelReady || Capacitor.getPlatform() !== 'android') return
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: notificationChannel.name,
      description: notificationChannel.description,
      importance: 3, // default: suono, nessun pop-up invadente
      visibility: 1,
    })
    channelReady = true
  }

  async function cancelAll(): Promise<void> {
    const { notifications } = await LocalNotifications.getPending()
    if (notifications.length > 0) await LocalNotifications.cancel({ notifications })
  }

  async function run(force: boolean): Promise<PlannedNotification[]> {
    const plan = planNotifications({ state: game.state, now: new Date(), texts: notificationTexts })
    if (!isNative()) {
      console.info(`[notifiche] no-op sul web: ${plan.length} notifiche pianificate (non programmate)`)
      return plan
    }
    // Senza permesso non si programma nulla (e si toglie quanto c'era).
    if ((await permission()) !== 'granted') {
      await cancelAll()
      lastSignature = null
      return []
    }
    const signature = JSON.stringify(plan.map((n) => [n.id, n.at.getTime(), n.body]))
    if (!force && signature === lastSignature) return plan

    await ensureChannel()
    await cancelAll()
    if (plan.length > 0) {
      await LocalNotifications.schedule({
        notifications: plan.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          channelId: CHANNEL_ID,
          extra: { route: n.route, slot: n.slot },
          schedule: {
            at: n.at,
            // Orario al minuto non necessario: allarmi INESATTI (nessun permesso "Sveglie e promemoria",
            // che altrimenti il plugin richiederebbe aprendo le impostazioni di sistema su Android 12+).
            allowWhileIdle: true,
          },
          isExactNotification: false,
        })),
      })
    }
    lastSignature = signature
    return plan
  }

  /** Riprogramma in coda (mai due riprogrammazioni sovrapposte). */
  function reschedule(force = false): Promise<PlannedNotification[]> {
    const next = queue.then(() => run(force)).catch((e: unknown) => {
      console.warn('[notifiche] riprogrammazione fallita', e)
      return [] as PlannedNotification[]
    })
    queue = next
    return next
  }

  /** Tap su una notifica: apre la route indicata. */
  async function init(): Promise<void> {
    if (!isNative() || listenerReady) return
    listenerReady = true
    await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
      const route = notification.extra?.route
      void navigateTo(typeof route === 'string' ? route : '/')
    })
  }

  return { permission, requestPermission, reschedule, init, isNative }
}
