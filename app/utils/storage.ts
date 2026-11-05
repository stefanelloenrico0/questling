import { Preferences } from '@capacitor/preferences'
import type { KeyValueStore } from '../../core/persistence'

// Storage nativo su Android/iOS; su web (PWA) Capacitor ripiega su localStorage.
export const capacitorStore: KeyValueStore = {
  async get(key) {
    return (await Preferences.get({ key })).value
  },
  async set(key, value) {
    await Preferences.set({ key, value })
  },
  async remove(key) {
    await Preferences.remove({ key })
  },
}
