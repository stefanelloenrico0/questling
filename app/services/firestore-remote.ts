// Adapter Firestore per il motore di sync (core/sync.ts). Nessun import da Nuxt: testabile su emulatore.
// Struttura: users/{uid}/profile/main · quests/{id} · completions/{id} · xpEvents/{id}
// Ogni documento ha `syncedAt` = timestamp SERVER (serverTimestamp): e' il cursore del pull incrementale
// (immune allo sfasamento degli orologi). L'ordine "chi vince" usa invece `updatedAt` del client.
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { sanitizeSnapshot, type OutDoc, type RemoteStore, type SyncCollection } from '../../core/sync'

const COLLECTIONS: readonly SyncCollection[] = ['profile', 'quests', 'completions', 'xpEvents']
const DELETE_CHUNK = 400

export const formatCursor = (ts: Timestamp): string => `${ts.seconds}.${String(ts.nanoseconds).padStart(9, '0')}`

export function parseCursor(cursor: string | null): Timestamp | null {
  const m = cursor ? /^(\d+)\.(\d{9})$/.exec(cursor) : null
  return m ? new Timestamp(Number(m[1]), Number(m[2])) : null
}

/** Confronto di due timestamp (compareTo non e' nell'API pubblica del SDK). */
export const compareTimestamps = (a: Timestamp, b: Timestamp): number =>
  a.seconds !== b.seconds ? a.seconds - b.seconds : a.nanoseconds - b.nanoseconds

/** Firestore rifiuta `undefined`: i campi opzionali assenti non vanno scritti. */
const clean = (data: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))

export class FirestoreRemoteStore implements RemoteStore {
  constructor(
    private readonly db: Firestore,
    private readonly uid: string,
  ) {}

  private col(name: SyncCollection) {
    return collection(this.db, 'users', this.uid, name)
  }

  async pull(cursor: string | null) {
    const since = parseCursor(cursor)
    let max: Timestamp | null = since
    const raw = { profile: null as unknown, quests: [] as unknown[], completions: [] as unknown[], xpEvents: [] as unknown[] }

    for (const name of COLLECTIONS) {
      const ref = this.col(name)
      const snap = await getDocs(since ? query(ref, where('syncedAt', '>', since)) : ref)
      for (const d of snap.docs) {
        const { syncedAt, ...data } = d.data()
        if (syncedAt instanceof Timestamp && (max === null || compareTimestamps(syncedAt, max) > 0)) max = syncedAt
        if (name === 'profile') raw.profile = data
        else raw[name].push(data)
      }
    }

    const { snapshot, invalid } = sanitizeSnapshot(raw)
    return { snapshot, invalid, cursor: max ? formatCursor(max) : cursor }
  }

  /** Un batch atomico: il core lo chiama a blocchi da 400 (limite Firestore: 500 operazioni). */
  async push(docs: OutDoc[]): Promise<void> {
    if (docs.length === 0) return
    const batch = writeBatch(this.db)
    for (const d of docs) {
      batch.set(doc(this.col(d.collection), d.id), { ...clean(d.data), syncedAt: serverTimestamp() })
    }
    await batch.commit()
  }

  /** Eliminazione account: cancella tutto cio' che sta sotto users/{uid}. */
  async deleteAll(): Promise<void> {
    for (const name of COLLECTIONS) {
      const snap = await getDocs(this.col(name))
      for (let i = 0; i < snap.docs.length; i += DELETE_CHUNK) {
        const batch = writeBatch(this.db)
        for (const d of snap.docs.slice(i, i + DELETE_CHUNK)) batch.delete(d.ref)
        await batch.commit()
      }
    }
  }
}
