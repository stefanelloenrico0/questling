// Caricamento/salvataggio dello stato su uno storage chiave-valore astratto
// (Capacitor Preferences nell'app, una Map nei test). Uno stato corrotto NON viene mai perso.
import { createInitialState, parseState } from './schema'
import type { AppState } from './types'

export const STATE_KEY = 'questling:v1:state'
export const corruptKey = (now: Date): string => `questling:v1:corrupt:${now.getTime()}`

export interface KeyValueStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

export interface LoadResult {
  state: AppState
  /** fresh = nessun dato; loaded = ok; recovered = dato illeggibile, copiato in `corruptKey` e si riparte */
  status: 'fresh' | 'loaded' | 'recovered'
  corruptKey?: string
}

export async function loadState(store: KeyValueStore, now: Date): Promise<LoadResult> {
  const raw = await store.get(STATE_KEY)
  if (raw === null) return { state: createInitialState(now), status: 'fresh' }

  let json: unknown = undefined
  let readable = true
  try {
    json = JSON.parse(raw)
  } catch {
    readable = false
  }

  if (readable) {
    const parsed = parseState(json)
    if (parsed.ok) return { state: { ...parsed.state, lastOpenAt: now.toISOString() }, status: 'loaded' }
  }

  // Corrotto, non valido o di una versione piu' recente: conserva una copia PRIMA di ripartire.
  const key = corruptKey(now)
  await store.set(key, raw)
  return { state: createInitialState(now), status: 'recovered', corruptKey: key }
}

export async function saveState(store: KeyValueStore, state: AppState): Promise<void> {
  await store.set(STATE_KEY, JSON.stringify(state))
}
