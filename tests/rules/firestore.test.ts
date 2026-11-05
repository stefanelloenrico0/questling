import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import {
  Timestamp,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { completeOnboarding, progressQuest, totalXp } from '../../core/game'
import { createInitialState } from '../../core/schema'
import { emptySyncMeta, runSync, type SyncMeta } from '../../core/sync'
import type { AppState } from '../../core/types'
import { FirestoreRemoteStore, formatCursor, parseCursor } from '../../app/services/firestore-remote'
import { at, ctxAt, daily } from '../unit/helpers'

const PROJECT = 'Questling'
// emulators:exec esporta gli host reali negli env: niente porte scritte a mano
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8282'
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9299'
const [FS_NAME, FS_PORT] = FS_HOST.split(':') as [string, string]
const apps: FirebaseApp[] = []
let seq = 0

interface Client {
  app: FirebaseApp
  db: Firestore
  uid: string | null
}

async function client(email?: string): Promise<Client> {
  const app = initializeApp({ apiKey: 'fake-key', projectId: PROJECT, authDomain: 'localhost' }, `c${++seq}`)
  apps.push(app)
  const auth = getAuth(app)
  connectAuthEmulator(auth, `http://${AUTH_HOST}`, { disableWarnings: true })
  const db = getFirestore(app)
  connectFirestoreEmulator(db, FS_NAME, Number(FS_PORT))
  let uid: string | null = null
  if (email) uid = (await createUserWithEmailAndPassword(auth, email, 'secret123')).user.uid
  return { app, db, uid }
}

async function reset(): Promise<void> {
  await fetch(`http://${FS_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' })
  await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' })
}

beforeEach(reset)
afterEach(async () => {
  await Promise.all(apps.splice(0).map((a) => deleteApp(a)))
})
afterAll(reset)

const NOW = '2026-11-04T10:00:00.000Z'
const quest = (over: Record<string, unknown> = {}) => ({
  id: 'q1', title: 'Allenamento', icon: 'star', difficulty: 'medium', period: 'daily', target: 1, order: 0,
  createdAt: NOW, updatedAt: NOW, archivedAt: null, ...over,
})
const completion = (over: Record<string, unknown> = {}) => ({
  id: 'q1_2026-11-04', questId: 'q1', periodKey: '2026-11-04', count: 1, completedAt: NOW, updatedAt: NOW, ...over,
})
const event = (over: Record<string, unknown> = {}) => ({ id: 'e1', at: NOW, delta: 10, reason: 'quest', refId: 'q1_2026-11-04', ...over })
const profile = (over: Record<string, unknown> = {}) => ({
  displayName: 'Enrico', characterId: 'valdo', onboardedAt: NOW, updatedAt: NOW, ...over,
})

const write = (c: Client, path: string[], data: Record<string, unknown>, stamp: unknown = serverTimestamp()) =>
  setDoc(doc(c.db, 'users', c.uid as string, ...(path as [string, string])), { ...data, syncedAt: stamp })

const ok = async (p: Promise<unknown>) => expect(await p.then(() => 'ok', (e: Error) => e.message)).toBe('ok')
const denied = async (p: Promise<unknown>) =>
  expect(await p.then(() => 'ok', (e: { code?: string }) => e.code)).toBe('permission-denied')

describe('regole di sicurezza: accesso', () => {
  it('senza login: niente lettura ne scrittura', async () => {
    const owner = await client('a@example.com')
    await ok(write(owner, ['quests', 'q1'], quest()))
    const anon = await client()
    await denied(getDoc(doc(anon.db, 'users', owner.uid as string, 'quests', 'q1')))
    await denied(setDoc(doc(anon.db, 'users', owner.uid as string, 'quests', 'q2'), { ...quest({ id: 'q2' }), syncedAt: serverTimestamp() }))
  })

  it('ognuno vede e scrive SOLO sotto il proprio uid', async () => {
    const alice = await client('alice@example.com')
    const bob = await client('bob@example.com')
    await ok(write(alice, ['quests', 'q1'], quest()))
    await ok(getDoc(doc(alice.db, 'users', alice.uid as string, 'quests', 'q1')))
    await denied(getDoc(doc(bob.db, 'users', alice.uid as string, 'quests', 'q1')))
    await denied(getDocs(collection(bob.db, 'users', alice.uid as string, 'quests')))
    await denied(setDoc(doc(bob.db, 'users', alice.uid as string, 'quests', 'q9'), { ...quest({ id: 'q9' }), syncedAt: serverTimestamp() }))
    await denied(deleteDoc(doc(bob.db, 'users', alice.uid as string, 'quests', 'q1')))
  })

  it('collezioni non previste sono negate', async () => {
    const alice = await client('alice@example.com')
    await denied(write(alice, ['secrets', 'x'], { a: 1 }))
    await denied(setDoc(doc(alice.db, 'altro', 'x'), { a: 1 }))
  })

  it('dopo il logout non si legge piu\' nulla', async () => {
    const alice = await client('alice@example.com')
    await ok(write(alice, ['quests', 'q1'], quest()))
    await signOut(getAuth(alice.app))
    await denied(getDoc(doc(alice.db, 'users', alice.uid as string, 'quests', 'q1')))
  })
})

describe('regole di sicurezza: validazione dei campi', () => {
  it('documenti validi di ogni tipo sono accettati', async () => {
    const c = await client('a@example.com')
    await ok(write(c, ['profile', 'main'], profile()))
    await ok(write(c, ['profile', 'main'], profile({ quizAnswers: [0, 1, 2, 3, 0, 1, 2, 3] })))
    await ok(write(c, ['quests', 'q1'], quest()))
    await ok(write(c, ['quests', 'q2'], quest({ id: 'q2', period: 'weekly', target: 7, archivedAt: NOW })))
    await ok(write(c, ['completions', 'q1_2026-11-04'], completion()))
    await ok(write(c, ['completions', 'q2_2026-W45'], completion({ id: 'q2_2026-W45', questId: 'q2', periodKey: '2026-W45', completedAt: null, count: 0 })))
    await ok(write(c, ['completions', 'q2_2026-11'], completion({ id: 'q2_2026-11', questId: 'q2', periodKey: '2026-11' })))
    await ok(write(c, ['xpEvents', 'e1'], event()))
    await ok(write(c, ['xpEvents', 'fix:quest:q1:abc:10:20'], event({ id: 'fix:quest:q1:abc:10:20', delta: -10 })))
  })

  it('missioni non valide: titolo, enum, target, campi extra, id che non combacia', async () => {
    const c = await client('a@example.com')
    await denied(write(c, ['quests', 'q1'], quest({ title: 'x'.repeat(81) })))
    await denied(write(c, ['quests', 'q1'], quest({ title: '' })))
    await denied(write(c, ['quests', 'q1'], quest({ difficulty: 'insane' })))
    await denied(write(c, ['quests', 'q1'], quest({ period: 'yearly' })))
    await denied(write(c, ['quests', 'q1'], quest({ target: 2 }))) // daily = 1
    await denied(write(c, ['quests', 'q1'], quest({ period: 'weekly', target: 8 })))
    await denied(write(c, ['quests', 'q1'], quest({ period: 'monthly', target: 32 })))
    await denied(write(c, ['quests', 'q1'], quest({ target: 1.5 })))
    await denied(write(c, ['quests', 'q1'], quest({ admin: true }))) // campo extra
    await denied(write(c, ['quests', 'q1'], quest({ id: 'altro' }))) // id != path
    await denied(write(c, ['quests', 'q1'], quest({ updatedAt: '2026-11-04' }))) // non ISO
    await denied(write(c, ['quests', 'q1'], quest({ createdAt: 12345 })))
    const { title: _t, ...missing } = quest()
    await denied(write(c, ['quests', 'q1'], missing)) // campo obbligatorio mancante
  })

  it('completamenti non validi', async () => {
    const c = await client('a@example.com')
    await denied(write(c, ['completions', 'q1_2026-11-04'], completion({ count: 32 })))
    await denied(write(c, ['completions', 'q1_2026-11-04'], completion({ count: -1 })))
    await denied(write(c, ['completions', 'q1_2026-11-04'], completion({ periodKey: 'oggi', id: 'q1_oggi' })))
    await denied(write(c, ['completions', 'altro'], completion())) // id != questId_periodKey
    await denied(write(c, ['completions', 'q1_2026-11-05'], completion())) // path != contenuto
  })

  it('eventi XP non validi', async () => {
    const c = await client('a@example.com')
    await denied(write(c, ['xpEvents', 'e1'], event({ delta: 5001 })))
    await denied(write(c, ['xpEvents', 'e1'], event({ delta: 1.5 })))
    await denied(write(c, ['xpEvents', 'e1'], event({ reason: 'hack' })))
    await denied(write(c, ['xpEvents', 'e1'], event({ id: 'e2' })))
    await denied(write(c, ['xpEvents', 'e1'], event({ at: 'ieri' })))
    await denied(write(c, ['xpEvents', 'e1'], event({ extra: 1 })))
  })

  it('profilo non valido: id diverso da main, eroe sconosciuto, nome troppo lungo', async () => {
    const c = await client('a@example.com')
    await denied(write(c, ['profile', 'altro'], profile()))
    await denied(write(c, ['profile', 'main'], profile({ characterId: 'drago' })))
    await denied(write(c, ['profile', 'main'], profile({ displayName: 'x'.repeat(41) })))
    await denied(write(c, ['profile', 'main'], profile({ quizAnswers: Array(9).fill(0) })))
    await denied(write(c, ['profile', 'main'], profile({ isAdmin: true })))
  })

  it('syncedAt deve essere il timestamp del SERVER (non un orario scelto dal client)', async () => {
    const c = await client('a@example.com')
    await denied(write(c, ['quests', 'q1'], quest(), Timestamp.fromDate(new Date('2030-01-01'))))
    await denied(write(c, ['quests', 'q1'], quest(), 'adesso'))
    await denied(setDoc(doc(c.db, 'users', c.uid as string, 'quests', 'q1'), quest())) // manca
    await ok(write(c, ['quests', 'q1'], quest()))
  })
})

describe('regole di sicurezza: aggiornamenti', () => {
  it('last-write-wins sicuro: una versione piu\' vecchia non sovrascrive; pari o piu\' nuova si', async () => {
    const c = await client('a@example.com')
    await ok(write(c, ['quests', 'q1'], quest({ updatedAt: '2026-11-04T10:00:00.000Z' })))
    await denied(write(c, ['quests', 'q1'], quest({ title: 'vecchia', updatedAt: '2026-11-04T09:00:00.000Z' })))
    await ok(write(c, ['quests', 'q1'], quest({ title: 'pari', updatedAt: '2026-11-04T10:00:00.000Z' })))
    await ok(write(c, ['quests', 'q1'], quest({ title: 'nuova', updatedAt: '2026-11-04T11:00:00.000Z' })))
    const d = await getDoc(doc(c.db, 'users', c.uid as string, 'quests', 'q1'))
    expect(d.data()?.title).toBe('nuova')
  })

  it('gli eventi XP sono immutabili: ripubblicarli identici si, cambiarli no', async () => {
    const c = await client('a@example.com')
    await ok(write(c, ['xpEvents', 'e1'], event()))
    await ok(write(c, ['xpEvents', 'e1'], event())) // re-push (solo syncedAt cambia)
    await denied(write(c, ['xpEvents', 'e1'], event({ delta: 20 })))
    await denied(write(c, ['xpEvents', 'e1'], event({ reason: 'adjustment' })))
  })

  it('l\'utente puo\' cancellare i propri dati (eliminazione account)', async () => {
    const c = await client('a@example.com')
    await ok(write(c, ['xpEvents', 'e1'], event()))
    await ok(deleteDoc(doc(c.db, 'users', c.uid as string, 'xpEvents', 'e1')))
    expect((await getDoc(doc(c.db, 'users', c.uid as string, 'xpEvents', 'e1'))).exists()).toBe(false)
  })
})

// ── adapter + motore di sync contro un Firestore REALE (emulato) ────────────────────────────────
function fresh(): { state: AppState; meta: SyncMeta } {
  return { state: createInitialState(at(2026, 11, 1)), meta: emptySyncMeta() }
}
const deviceSync = (store: FirestoreRemoteStore, d: { state: AppState; meta: SyncMeta }, now = new Date(2026, 10, 10)) =>
  runSync({
    remote: store,
    getState: () => d.state,
    setState: (s) => (d.state = s),
    getMeta: () => d.meta,
    setMeta: (m) => (d.meta = m),
    now: () => now,
  })

describe('sync reale su Firestore emulato', () => {
  it('cursor: formato e parsing', () => {
    const ts = new Timestamp(1790000000, 123456000)
    expect(formatCursor(ts)).toBe('1790000000.123456000')
    expect(parseCursor('1790000000.123456000')?.isEqual(ts)).toBe(true)
    expect(parseCursor(null)).toBeNull()
    expect(parseCursor('rotto')).toBeNull()
  })

  it('push -> pull restituisce gli stessi dati; il pull incrementale arriva solo col nuovo', async () => {
    const c = await client('a@example.com')
    const store = new FirestoreRemoteStore(c.db, c.uid as string)
    const a = fresh()
    a.state = completeOnboarding(a.state, { displayName: 'Enrico', characterId: 'valdo', quests: [daily('A'), daily('B')] }, ctxAt(at(2026, 11, 1)))!
    a.state = progressQuest(a.state, a.state.quests[0]!.id, 1, ctxAt(at(2026, 11, 4, 10))).state
    const first = await deviceSync(store, a)
    expect(first.pushed).toBeGreaterThan(0)
    expect((await deviceSync(store, a)).pushed).toBe(0)

    const full = await store.pull(null)
    expect(full.snapshot.quests).toHaveLength(2)
    expect(full.snapshot.xpEvents).toHaveLength(1)
    expect(full.snapshot.profile?.displayName).toBe('Enrico')
    expect(full.invalid).toBe(0)

    const next = await store.pull(full.cursor)
    expect(next.snapshot.xpEvents).toHaveLength(0)
    expect(next.snapshot.quests).toHaveLength(0)

    a.state = progressQuest(a.state, a.state.quests[1]!.id, 1, ctxAt(at(2026, 11, 4, 11))).state
    await deviceSync(store, a)
    const inc = await store.pull(full.cursor)
    expect(inc.snapshot.completions).toHaveLength(1)
    expect(inc.snapshot.completions[0]?.questId).toBe(a.state.quests[1]!.id)
  })

  it('due dispositivi (stesso account) convergono; la stessa daily su entrambi conta una volta', async () => {
    const c1 = await client('a@example.com')
    // secondo "dispositivo": app separata, stesso utente (login con le stesse credenziali)
    const app2 = initializeApp({ apiKey: 'fake-key', projectId: PROJECT, authDomain: 'localhost' }, `c${++seq}`)
    apps.push(app2)
    const auth2 = getAuth(app2)
    connectAuthEmulator(auth2, `http://${AUTH_HOST}`, { disableWarnings: true })
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    await signInWithEmailAndPassword(auth2, 'a@example.com', 'secret123')
    const db2 = getFirestore(app2)
    connectFirestoreEmulator(db2, FS_NAME, Number(FS_PORT))

    const sA = new FirestoreRemoteStore(c1.db, c1.uid as string)
    const sB = new FirestoreRemoteStore(db2, c1.uid as string)
    const a = fresh()
    const b = fresh()
    a.state = completeOnboarding(a.state, { displayName: 'Enrico', characterId: 'valdo', quests: [daily('A'), daily('B')] }, ctxAt(at(2026, 11, 1)))!
    await deviceSync(sA, a)
    await deviceSync(sB, b)
    expect(b.state.quests).toHaveLength(2)

    // offline entrambi: stessa daily
    const questId = a.state.quests[0]!.id
    a.state = progressQuest(a.state, questId, 1, ctxAt(at(2026, 11, 4, 10))).state
    b.state = progressQuest(b.state, questId, 1, ctxAt(at(2026, 11, 4, 10, 5))).state
    for (let i = 0; i < 3; i++) {
      await deviceSync(sA, a)
      await deviceSync(sB, b)
    }
    expect(totalXp(a.state)).toBe(10)
    expect(totalXp(b.state)).toBe(10)
    expect(a.state.completions).toEqual(b.state.completions)
    expect(a.state.xpEvents.map((e) => e.id).sort()).toEqual(b.state.xpEvents.map((e) => e.id).sort())
  })

  it('un altro account non vede nulla; deleteAll svuota solo i dati dell\'utente', async () => {
    const alice = await client('alice@example.com')
    const bob = await client('bob@example.com')
    const sa = new FirestoreRemoteStore(alice.db, alice.uid as string)
    const sb = new FirestoreRemoteStore(bob.db, bob.uid as string)
    const a = fresh()
    const b = fresh()
    a.state = completeOnboarding(a.state, { displayName: 'Alice', characterId: 'kuro', quests: [daily('A')] }, ctxAt(at(2026, 11, 1)))!
    b.state = completeOnboarding(b.state, { displayName: 'Bob', characterId: 'fenna', quests: [daily('B')] }, ctxAt(at(2026, 11, 1)))!
    await deviceSync(sa, a)
    await deviceSync(sb, b)
    expect((await sa.pull(null)).snapshot.profile?.displayName).toBe('Alice')
    expect((await sb.pull(null)).snapshot.profile?.displayName).toBe('Bob')

    await sa.deleteAll()
    const after = await sa.pull(null)
    expect(after.snapshot.quests).toHaveLength(0)
    expect(after.snapshot.profile).toBeNull()
    expect((await sb.pull(null)).snapshot.quests).toHaveLength(1) // Bob intatto
  })

  it('1000 eventi: il push a blocchi funziona sotto i limiti dei batch', async () => {
    const c = await client('a@example.com')
    const store = new FirestoreRemoteStore(c.db, c.uid as string)
    const a = fresh()
    a.state = completeOnboarding(a.state, { displayName: 'Enrico', characterId: 'valdo', quests: [daily('A')] }, ctxAt(at(2026, 11, 1)))!
    a.state = {
      ...a.state,
      xpEvents: Array.from({ length: 1000 }, (_, i) => ({
        id: `E${String(i).padStart(5, '0')}`,
        at: new Date(2026, 0, 1, 0, 0, i).toISOString(),
        delta: 0,
        reason: 'adjustment' as const,
      })),
    }
    const report = await deviceSync(store, a)
    expect(report.pushed).toBe(1002) // 1000 eventi + 1 missione + profilo
    expect((await store.pull(null)).snapshot.xpEvents).toHaveLength(1000)
  })
})
