import type { Page } from '@playwright/test'

export interface NativeCall {
  plugin: string
  method: string
  options: Record<string, unknown> | undefined
}

export interface ScheduledNotification {
  id: number
  title: string
  body: string
  channelId?: string
  isExactNotification?: boolean
  schedule: { at: string; allowWhileIdle?: boolean }
  extra?: { route?: string; slot?: string }
}

interface NativeState {
  calls: NativeCall[]
  pending: number[]
  permission: 'prompt' | 'granted' | 'denied'
  requestResult: 'granted' | 'denied'
  emit: (plugin: string, event: string, data: unknown) => void
}

declare global {
  interface Window {
    __native: NativeState
  }
}

/**
 * Simula il bridge nativo di Capacitor (Android): window.androidBridge fa risultare la piattaforma
 * "android"; PluginHeaders/nativePromise/nativeCallback sono quanto inietta native-bridge.js.
 * Registra ogni chiamata ai plugin, cosi' i test verificano cosa arriverebbe al telefono.
 */
export async function installNativeMock(
  page: Page,
  opts: { permission?: 'prompt' | 'granted' | 'denied'; requestResult?: 'granted' | 'denied' } = {},
): Promise<void> {
  await page.addInitScript((options) => {
    const methods = (names: string[], callbacks: string[] = []) => [
      ...names.map((name) => ({ name, rtype: 'promise' })),
      ...callbacks.map((name) => ({ name, rtype: 'callback' })),
    ]
    const native: NativeState = {
      calls: [],
      pending: [],
      permission: options.permission ?? 'prompt',
      requestResult: options.requestResult ?? 'granted',
      emit: () => {},
    }
    const listeners = new Map<string, ((data: unknown) => void)[]>()
    native.emit = (plugin, event, data) => (listeners.get(`${plugin}.${event}`) ?? []).forEach((cb) => cb(data))
    window.__native = native

    const prefs = (key: string): string => `native-prefs:${key}`

    const handle = (plugin: string, method: string, o: Record<string, unknown> | undefined): unknown => {
      native.calls.push({ plugin, method, options: o ? JSON.parse(JSON.stringify(o)) : undefined })
      if (plugin === 'Preferences') {
        const key = String(o?.key)
        if (method === 'get') return { value: localStorage.getItem(prefs(key)) }
        if (method === 'set') localStorage.setItem(prefs(key), String(o?.value))
        if (method === 'remove') localStorage.removeItem(prefs(key))
        return {}
      }
      if (plugin === 'LocalNotifications') {
        if (method === 'checkPermissions') return { display: native.permission }
        if (method === 'requestPermissions') {
          native.permission = native.requestResult
          return { display: native.permission }
        }
        if (method === 'getPending') return { notifications: native.pending.map((id) => ({ id })) }
        if (method === 'cancel') {
          const ids = ((o?.notifications as { id: number }[]) ?? []).map((n) => n.id)
          native.pending = native.pending.filter((id) => !ids.includes(id))
          return {}
        }
        if (method === 'schedule') {
          const list = (o?.notifications as { id: number }[]) ?? []
          native.pending = [...native.pending, ...list.map((n) => n.id)]
          return { notifications: list.map((n) => ({ id: n.id })) }
        }
      }
      return {}
    }

    // L'oggetto con le opzioni "vere" (con Date) per i test che ispezionano gli orari
    ;(window as unknown as { __scheduled: unknown[] }).__scheduled = []
    const original = handle
    const wrapped = (plugin: string, method: string, o: Record<string, unknown> | undefined): unknown => {
      if (plugin === 'LocalNotifications' && method === 'schedule') {
        ;(window as unknown as { __scheduled: unknown[] }).__scheduled.push(
          ...((o?.notifications as { schedule: { at: Date } }[]) ?? []).map((n) => ({
            ...n,
            schedule: { ...n.schedule, at: n.schedule.at.toISOString() },
          })),
        )
      }
      return original(plugin, method, o)
    }

    Object.defineProperty(window, 'androidBridge', { value: { postMessage: () => {} }, configurable: true })
    ;(window as unknown as { Capacitor: unknown }).Capacitor = {
      PluginHeaders: [
        { name: 'Preferences', methods: methods(['get', 'set', 'remove', 'keys', 'clear']) },
        { name: 'App', methods: methods(['exitApp', 'getInfo'], ['addListener']) },
        { name: 'StatusBar', methods: methods(['setStyle', 'setBackgroundColor', 'show', 'hide']) },
        { name: 'SplashScreen', methods: methods(['hide', 'show']) },
        { name: 'Haptics', methods: methods(['impact', 'notification', 'vibrate']) },
        {
          name: 'LocalNotifications',
          methods: methods(
            ['schedule', 'getPending', 'cancel', 'createChannel', 'checkPermissions', 'requestPermissions'],
            ['addListener'],
          ),
        },
      ],
      nativePromise: (plugin: string, method: string, o?: Record<string, unknown>) =>
        Promise.resolve(wrapped(plugin, method, o)),
      nativeCallback: (plugin: string, method: string, o: { eventName?: string } | undefined, cb: (d: unknown) => void) => {
        native.calls.push({ plugin, method, options: o as Record<string, unknown> | undefined })
        const key = `${plugin}.${o?.eventName}`
        listeners.set(key, [...(listeners.get(key) ?? []), cb])
        return `cb-${key}`
      },
    }
  }, opts)
}

export const nativeCalls = (page: Page, plugin: string, method: string): Promise<NativeCall[]> =>
  page.evaluate(([p, m]) => window.__native.calls.filter((c) => c.plugin === p && c.method === m), [plugin, method] as const)

export const scheduledNotifications = (page: Page): Promise<ScheduledNotification[]> =>
  page.evaluate(() => (window as unknown as { __scheduled: ScheduledNotification[] }).__scheduled)
