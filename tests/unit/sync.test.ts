import { describe, expect, it } from 'vitest'
import {
  archiveQuest,
  completeOnboarding,
  createQuest,
  progressQuest,
  renameProfile,
  stamp,
  totalXp,
  updateQuest,
} from '../../core/game'
import { createInitialState } from '../../core/schema'
import {
  PUSH_CHUNK,
  computeOutbox,
  emptySyncMeta,
  mergeRemote,
  parseSyncMeta,
  previewMerge,
  reconcileXp,
  runSync,
  sanitizeSnapshot,
  type OutDoc,
  type RemoteStore,
  type SyncMeta,
  type SyncReport,
} from '../../core/sync'
import { xpByRef, questXp } from '../../core/xp'
import type { AppState, XpEvent } from '../../core/types'
import { at, ctxAt, daily } from './helpers'

// ── backend finto: simula Firestore (timestamp server monotono, set per documento) ──
class FakeRemote implements RemoteStore {
  docs = new Map<string, { collection: string; id: string; data: Record<string, unknown>; syncedAt: number }>()
  clock = 0
  pulls = 0
  pushedBatches: number[] = []
  onPush: (() => void) | null = null
  /** come le regole di sicurezza: un documento non puo' essere sovrascritto da una versione piu' vecchia */
  enforceMonotonic = true

  async pull(cursor: string | null) {
    this.pulls++
    const since = cursor === null ? 0 : Number(cursor)
    const fresh = [...this.docs.values()].filter((d) => d.syncedAt > since)
    const bucket = (c: string): unknown[] => fresh.filter((d) => d.collection === c).map((d) => d.data)
    const { snapshot, invalid } = sanitizeSnapshot({
      profile: bucket('profile')[0] ?? null,
      quests: bucket('quests'),
      completions: bucket('completions'),
      xpEvents: bucket('xpEvents'),
    })
    return { snapshot, invalid, cursor: String(this.clock) }
  }

  async push(docs: OutDoc[]) {
    this.pushedBatches.push(docs.length)
    this.onPush?.()
    for (const d of docs) {
      const key = `${d.collection}/${d.id}`
      const prev = this.docs.get(key)
      const prevAt = prev?.data.updatedAt as string | undefined
      const nextAt = d.data.updatedAt as string | undefined
      if (this.enforceMonotonic && prevAt && nextAt && nextAt < prevAt) throw new Error('permission-denied: updatedAt piu\' vecchio')
      this.docs.set(key, { collection: d.collection, id: d.id, data: JSON.parse(JSON.stringify(d.data)), syncedAt: ++this.clock })
    }
  }

  async deleteAll() {
    this.docs.clear()
  }

  count(collection: string): number {
    return [...this.docs.values()].filter((d) => d.collection === collection).length
  }
}

class Device {
  state: AppState
  meta: SyncMeta = emptySyncMeta()
  constructor(
    public remote: RemoteStore,
    public name: string,
    state?: AppState,
    public clock = at(2026, 11, 4, 10),
  ) {
    this.state = state ?? createInitialState(clock)
  }
  ctx = () => ctxAt(this.clock)
  sync(now = new Date(this.clock.getTime() + 60_000)): Promise<SyncReport> {
    return runSync({
      remote: this.remote,
      getState: () => this.state,
      setState: (s) => (this.state = s),
      getMeta: () => this.meta,
      setMeta: (m) => (this.meta = m),
      now: () => now,
    })
  }
  id(title: string): string {
    const q = this.state.quests.find((x) => x.title === title && !x.archivedAt) ?? this.state.quests.find((x) => x.title === title)
    if (!q) throw new Error(`${this.name}: missione ${title} assente`)
    return q.id
  }
  complete(title: string, dir: 1 | -1 = 1): void {
    this.state = progressQuest(this.state, this.id(title), dir, this.ctx()).state
  }
  advance(minutes: number): void {
    this.clock = new Date(this.clock.getTime() + minutes * 60_000)
  }
}

function seeded(): { remote: FakeRemote; a: Device; b: Device; c: Device } {
  const remote = new FakeRemote()
  const base = completeOnboarding(
    createInitialState(at(2026, 11, 1)),
    { displayName: 'Enrico', characterId: 'valdo', quests: [daily('A'), daily('B'), { ...daily('W'), period: 'weekly', target: 2 }] },
    ctxAt(at(2026, 11, 1)),
  )!
  return { remote, a: new Device(remote, 'A', base), b: new Device(remote, 'B'), c: new Device(remote, 'C') }
}

const canon = (s: AppState) => ({
  profile: s.profile,
  quests: [...s.quests].sort((x, y) => (x.id < y.id ? -1 : 1)),
  completions: [...s.completions].sort((x, y) => (x.id < y.id ? -1 : 1)),
  xp: totalXp(s),
  events: s.xpEvents.map((e) => e.id).sort(),
})

async function settle(devices: Device[], rounds = 3, now?: Date): Promise<void> {
  for (let i = 0; i < rounds; i++) for (const d of devices) await d.sync(now)
}

describe('primo login e pull', () => {
  it('un dispositivo nuovo riceve tutto e non ripubblica nulla', async () => {
    const { a, b, remote } = seeded()
    a.complete('A')
    const first = await a.sync()
    expect(first.pushed).toBeGreaterThan(0)

    const report = await b.sync()
    expect(report.pushed).toBe(0) // i documenti arrivati dal cloud non tornano indietro
    expect(canon(b.state)).toEqual(canon(a.state))
    expect(b.state.profile?.displayName).toBe('Enrico')
    expect(remote.count('quests')).toBe(3)
    expect(totalXp(b.state)).toBe(10)
  })

  it('sincronizzare di nuovo non pubblica nulla (idempotente)', async () => {
    const { a } = seeded()
    await a.sync()
    expect((await a.sync()).pushed).toBe(0)
    expect((await a.sync()).pushed).toBe(0)
  })

  it('il pull e\' incrementale: la seconda volta arriva solo il nuovo', async () => {
    const { a, b } = seeded()
    a.complete('A')
    await a.sync()
    await b.sync()
    a.advance(5)
    a.complete('B')
    await a.sync()
    const report = await b.sync()
    expect(report.merge.xpEvents.remoteOnly).toBe(2) // solo il nuovo: XP di B + bonus "tutte fatte"
    expect(report.merge.completions.remoteOnly).toBe(1)
    expect(report.merge.quests.remoteOnly).toBe(0)
    expect(canon(b.state)).toEqual(canon(a.state))
  })

  it('anteprima del primo login: locale e cloud distinti si UNISCONO, niente sovrascrittura cieca', async () => {
    const { a, remote } = seeded()
    a.complete('A')
    await a.sync()
    // un altro dispositivo con dati propri e nessun legame col cloud
    const local = completeOnboarding(
      createInitialState(at(2026, 10, 30)),
      { displayName: 'Locale', characterId: 'kuro', quests: [daily('Solo mia')] },
      ctxAt(at(2026, 10, 30)),
    )!
    const snapshot = (await remote.pull(null)).snapshot
    const stats = previewMerge(local, snapshot, at(2026, 11, 5))
    expect(stats.quests).toMatchObject({ localOnly: 1, remoteOnly: 3, both: 0 })
    expect(stats.profile).toBe('remote') // il profilo del cloud e' piu' recente
    expect(stats.xpEvents.remoteOnly).toBe(1)
    // nessuna missione locale viene persa nell'unione
    const merged = mergeRemote(local, snapshot, at(2026, 11, 5)).state
    expect(merged.quests.map((q) => q.title).sort()).toEqual(['A', 'B', 'Solo mia', 'W'])
  })
})

describe('due dispositivi', () => {
  it('completamenti diversi offline: convergono senza perdere nulla', async () => {
    const { a, b } = seeded()
    await a.sync()
    await b.sync()
    a.complete('A')
    b.advance(2)
    b.complete('B')
    await settle([a, b])
    expect(canon(a.state)).toEqual(canon(b.state))
    expect(a.state.completions.filter((c) => c.completedAt)).toHaveLength(2)
    expect(totalXp(a.state)).toBe(20 + 10) // A + B + bonus "tutte fatte" (2 daily su 2)
  })

  it('la STESSA daily completata offline su entrambi: l\'XP conta UNA volta', async () => {
    const { a, b, c } = seeded()
    await a.sync()
    await b.sync()
    await c.sync()
    a.complete('A')
    b.advance(1)
    b.complete('A') // stessa missione, stesso giorno, evento XP con ULID diverso
    await settle([a, b, c])
    const completionId = `${a.id('A')}_2026-11-04`
    expect(xpByRef(a.state.xpEvents, 'quest', completionId)).toBe(10)
    expect(totalXp(a.state)).toBe(10)
    expect(canon(a.state)).toEqual(canon(b.state))
    expect(canon(a.state)).toEqual(canon(c.state))
    // l'evento correttivo e' uno solo (deterministico): non si moltiplica dopo altri giri
    const fixes = a.state.xpEvents.filter((e) => e.id.startsWith('fix:'))
    await settle([a, b, c], 2)
    expect(a.state.xpEvents.filter((e) => e.id.startsWith('fix:'))).toEqual(fixes)
  })

  it('bonus "tutte fatte" duplicato (due dispositivi completano tutto): resta +10', async () => {
    const { a, b } = seeded()
    await a.sync()
    await b.sync()
    for (const d of [a, b]) {
      d.complete('A')
      d.complete('B')
    }
    await settle([a, b])
    expect(xpByRef(a.state.xpEvents, 'daily_bonus', '2026-11-04')).toBe(10)
    expect(totalXp(a.state)).toBe(30)
    expect(canon(a.state)).toEqual(canon(b.state))
  })

  it('completa su A, annulla su B (piu\' recente): vince l\'annullamento e l\'XP torna a zero', async () => {
    const { a, b } = seeded()
    a.complete('A')
    await a.sync()
    await b.sync()
    b.advance(10)
    b.complete('A', -1)
    await settle([a, b])
    expect(totalXp(a.state)).toBe(0)
    expect(a.state.completions[0]).toMatchObject({ count: 0, completedAt: null })
    expect(canon(a.state)).toEqual(canon(b.state))
  })

  it('modifica su un dispositivo e archiviazione sull\'altro: vince la piu\' recente (tombstone compreso)', async () => {
    const { a, b } = seeded()
    await a.sync()
    await b.sync()
    a.advance(5)
    const edit = updateQuest(a.state, a.id('A'), { title: 'A rinominata' }, a.ctx())
    expect(edit.ok).toBe(true)
    if (edit.ok) a.state = edit.state
    b.advance(10) // dopo
    b.state = archiveQuest(b.state, b.id('A'), b.ctx()).state
    await settle([a, b])
    expect(a.state.quests.find((q) => q.id === b.id('A'))?.archivedAt).toBeTruthy()
    expect(canon(a.state)).toEqual(canon(b.state))
  })

  it('profilo: last-write-wins', async () => {
    const { a, b } = seeded()
    await a.sync()
    await b.sync()
    a.advance(5)
    a.state = renameProfile(a.state, 'Da A', a.ctx())
    b.advance(9)
    b.state = renameProfile(b.state, 'Da B', b.ctx())
    await settle([a, b])
    expect(a.state.profile?.displayName).toBe('Da B')
    expect(b.state.profile?.displayName).toBe('Da B')
  })

  it('una versione piu\' VECCHIA nel cloud non la fa perdere a chi ha la piu\' nuova (ripubblicata)', async () => {
    const { a, b, remote } = seeded()
    await a.sync()
    await b.sync()
    // A rinomina e pubblica; B (che non ha ancora visto la modifica) pubblica una sua versione piu' vecchia
    const questId = a.id('A')
    a.advance(20)
    const edit = updateQuest(a.state, questId, { title: 'Nuova' }, a.ctx())
    if (edit.ok) a.state = edit.state
    remote.enforceMonotonic = false // simula una corsa in cui il cloud finisce con la copia vecchia
    const old = b.state.quests.find((q) => q.id === questId)!
    await a.sync()
    await remote.push([{ collection: 'quests', id: old.id, data: { ...old } }])
    remote.enforceMonotonic = true
    await settle([a, b])
    expect(a.state.quests.find((q) => q.id === old.id)?.title).toBe('Nuova')
    expect(b.state.quests.find((q) => q.id === old.id)?.title).toBe('Nuova')
    expect(remote.docs.get(`quests/${old.id}`)?.data.title).toBe('Nuova')
  })

  it('modifiche dell\'utente DURANTE la sync non vanno perse: partono al ciclo dopo', async () => {
    const { a, b } = seeded()
    await a.sync()
    a.complete('A')
    a.advance(1)
    ;(a.remote as FakeRemote).onPush = () => {
      a.advance(1)
      a.complete('B') // tocco a meta' sync
      ;(a.remote as FakeRemote).onPush = null
    }
    await a.sync()
    expect(a.state.completions.filter((c) => c.completedAt)).toHaveLength(2)
    expect((await a.sync()).pushed).toBeGreaterThan(0) // la modifica "in volo" viene pubblicata ora
    await b.sync()
    expect(canon(b.state)).toEqual(canon(a.state))
  })
})

describe('robustezza', () => {
  it('nessun cambiamento: setState non viene mai richiamato (niente cicli di sync nell\'app)', async () => {
    const { a } = seeded()
    a.complete('A')
    await a.sync()
    let calls = 0
    const original = a.state
    const report = await runSync({
      remote: a.remote,
      getState: () => a.state,
      setState: (s) => {
        if (s !== original) calls++
        a.state = s
      },
      getMeta: () => a.meta,
      setMeta: (m) => (a.meta = m),
      now: () => new Date(2026, 10, 10),
    })
    expect(report.pushed).toBe(0)
    expect(calls).toBe(0)
    expect(a.state).toBe(original)
  })

  it('push a blocchi da 400 con progresso salvato', async () => {
    const { a, remote } = seeded()
    const events: XpEvent[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `E${String(i).padStart(5, '0')}`,
      at: new Date(2026, 0, 1, 0, 0, i).toISOString(),
      delta: 0,
      reason: 'adjustment',
    }))
    a.state = { ...a.state, xpEvents: events }
    await a.sync()
    expect(remote.pushedBatches.every((n) => n <= PUSH_CHUNK)).toBe(true)
    expect(remote.count('xpEvents')).toBe(1000)
    expect((await a.sync()).pushed).toBe(0)
  })

  it('documenti non validi nel cloud vengono scartati e contati, senza rompere la sync', async () => {
    const { a, remote } = seeded()
    await a.sync()
    remote.docs.set('quests/bad', { collection: 'quests', id: 'bad', data: { id: 'bad', title: 42 }, syncedAt: ++remote.clock })
    remote.docs.set('xpEvents/bad', { collection: 'xpEvents', id: 'bad', data: { id: 'bad' }, syncedAt: ++remote.clock })
    const report = await a.sync()
    expect(report.merge.invalid).toBe(2)
    expect(a.state.quests).toHaveLength(3)
  })

  it('metadati di sync corrotti: si riparte da zero in sicurezza (nessun duplicato, nessuna perdita)', async () => {
    const { a, remote } = seeded()
    a.complete('A')
    await a.sync()
    const before = canon(a.state)
    a.meta = parseSyncMeta('{{non json')
    expect(a.meta).toEqual(emptySyncMeta())
    await a.sync()
    expect(canon(a.state)).toEqual(before)
    expect(remote.count('xpEvents')).toBe(1)
  })

  it('parseSyncMeta: valori mancanti o di tipo sbagliato', () => {
    expect(parseSyncMeta(null)).toEqual(emptySyncMeta())
    expect(parseSyncMeta('{"uid":5,"cursor":7,"versions":3}')).toEqual(emptySyncMeta())
    expect(parseSyncMeta('{"uid":"u1","cursor":"9","versions":{"quests/x":"1"},"lastSyncAt":"2026-01-01T00:00:00.000Z"}')).toMatchObject({ uid: 'u1', cursor: '9' })
  })

  it('computeOutbox: solo cio\' che il cloud non ha o ha in versione diversa', () => {
    const { a } = seeded()
    const first = computeOutbox(a.state, emptySyncMeta())
    expect(first.docs.map((d) => d.collection).sort()).toEqual(['profile', 'quests', 'quests', 'quests'])
    const meta: SyncMeta = { ...emptySyncMeta(), versions: first.versions }
    expect(computeOutbox(a.state, meta).docs).toHaveLength(0)
    a.complete('A')
    expect(computeOutbox(a.state, meta).docs.map((d) => d.collection).sort()).toEqual(['completions', 'xpEvents'])
  })

  it('reconcileXp e\' deterministico: due dispositivi con la stessa unione producono gli stessi eventi', async () => {
    const { a, b } = seeded()
    await a.sync()
    await b.sync()
    a.complete('A')
    b.advance(1)
    b.complete('A')
    const union = mergeRemote(a.state, { profile: null, quests: [], completions: b.state.completions, xpEvents: b.state.xpEvents }, at(2026, 11, 5)).state
    const union2 = mergeRemote(b.state, { profile: null, quests: [], completions: a.state.completions, xpEvents: a.state.xpEvents }, at(2026, 11, 5)).state
    expect(reconcileXp({ ...union, xpEvents: union.xpEvents.filter((e) => !e.id.startsWith('fix:')) }, at(2026, 11, 6)).map((e) => e.id))
      .toEqual(reconcileXp({ ...union2, xpEvents: union2.xpEvents.filter((e) => !e.id.startsWith('fix:')) }, at(2026, 11, 7)).map((e) => e.id))
  })

  it('traguardo streak nato dall\'unione: due dispositivi coprono giorni diversi', async () => {
    const { a, b } = seeded()
    await a.sync()
    await b.sync()
    // A completa i giorni 1-4, B i giorni 5-7 della stessa serie
    for (let d = 1; d <= 4; d++) {
      a.clock = at(2026, 11, d, 10)
      a.complete('A')
    }
    for (let d = 5; d <= 7; d++) {
      b.clock = at(2026, 11, d, 10)
      b.complete('A')
    }
    await settle([a, b], 4, new Date(2026, 10, 8)) // dopo l'ultimo giorno della serie
    const total = totalXp(a.state)
    expect(total).toBe(7 * 10 + 25) // 7 giorni + traguardo dei 7 giorni, una sola volta
    expect(canon(a.state)).toEqual(canon(b.state))
  })
})

// ── proprieta': molte sequenze casuali di azioni su 3 dispositivi convergono ──
function rng(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

describe('convergenza (proprieta\')', () => {
  for (let seed = 1; seed <= 150; seed++) {
    it(`seed ${seed}: 3 dispositivi con azioni e sync casuali convergono allo stesso stato`, async () => {
      const r = rng(seed)
      const pick = <T>(list: T[]): T => list[Math.floor(r() * list.length)] as T
      const { a, b, c } = seeded()
      const devices = [a, b, c]
      await a.sync()
      await b.sync()
      await c.sync()
      let extra = 0

      for (let step = 0; step < 40; step++) {
        const d = pick(devices)
        d.clock = at(2026, 11, 1 + Math.floor(r() * 9), 8 + Math.floor(r() * 12), Math.floor(r() * 60))
        const roll = r()
        const live = d.state.quests.filter((q) => !q.archivedAt)
        if (roll < 0.5 && live.length > 0) {
          const q = pick(live)
          d.state = progressQuest(d.state, q.id, r() < 0.75 ? 1 : -1, d.ctx()).state
        } else if (roll < 0.62) {
          const res = createQuest(d.state, { ...daily(`X${seed}-${extra++}`), icon: 'star' }, d.ctx())
          if (res.ok) d.state = res.state
        } else if (roll < 0.7 && live.length > 0) {
          const res = updateQuest(d.state, pick(live).id, { title: `T${Math.floor(r() * 1000)}`, difficulty: pick(['easy', 'medium', 'hard'] as const) }, d.ctx())
          if (res.ok) d.state = res.state
        } else if (roll < 0.74 && live.length > 3) {
          d.state = archiveQuest(d.state, pick(live).id, d.ctx()).state
        } else if (roll < 0.78) {
          d.state = renameProfile(d.state, `N${Math.floor(r() * 100)}`, d.ctx())
        } else {
          await d.sync(new Date(2026, 11, 1))
        }
      }
      // sync finale a giri: tutti vedono tutto
      for (let i = 0; i < 4; i++) for (const d of devices) await d.sync(new Date(2026, 11, 1))

      expect(canon(b.state)).toEqual(canon(a.state))
      expect(canon(c.state)).toEqual(canon(a.state))

      // invarianti dell'XP rispetto allo stato dei completamenti
      const state = a.state
      for (const comp of state.completions) {
        const quest = state.quests.find((q) => q.id === comp.questId)!
        const net = xpByRef(state.xpEvents, 'quest', comp.id)
        const awarded = Math.max(0, ...state.xpEvents.filter((e) => e.reason === 'quest' && e.refId === comp.id && !e.id.startsWith('fix:')).map((e) => e.delta))
        // la difficolta' puo' essere stata modificata tra un'assegnazione e l'altra: conta quanto e' stato assegnato
        expect([0, awarded, questXp(quest.difficulty, quest.period)]).toContain(net)
        if (!comp.completedAt) expect(net).toBe(0)
      }
      for (const e of state.xpEvents.filter((x) => x.reason === 'daily_bonus')) {
        const net = xpByRef(state.xpEvents, 'daily_bonus', e.refId as string)
        expect(net).toBeGreaterThanOrEqual(0)
        expect(net).toBeLessThanOrEqual(10)
      }
    })
  }
})

describe('rete instabile', () => {
  /** Backend che fallisce a caso (anche a meta' di una sequenza di batch). */
  class Flaky extends FakeRemote {
    constructor(private fail: () => boolean) {
      super()
    }
    override async pull(cursor: string | null) {
      if (this.fail()) throw new Error('offline')
      return super.pull(cursor)
    }
    override async push(docs: OutDoc[]) {
      if (this.fail()) throw new Error('offline')
      return super.push(docs)
    }
  }

  for (let seed = 1; seed <= 40; seed++) {
    it(`seed ${seed}: errori casuali durante la sync non corrompono ne perdono dati; alla fine convergono`, async () => {
      const r = rng(1000 + seed)
      let flaky = true
      const remote = new Flaky(() => flaky && r() < 0.25)
      const base = completeOnboarding(
        createInitialState(at(2026, 11, 1)),
        { displayName: 'Enrico', characterId: 'valdo', quests: [daily('A'), daily('B'), daily('C')] },
        ctxAt(at(2026, 11, 1)),
      )!
      const devices = [new Device(remote, 'A', base), new Device(remote, 'B'), new Device(remote, 'C')]
      const tryTick = async (d: Device): Promise<void> => {
        try {
          await d.sync(new Date(2026, 11, 1))
        } catch {
          /* rete assente: l'app riprova al prossimo giro */
        }
      }
      for (let step = 0; step < 50; step++) {
        const d = devices[Math.floor(r() * 3)] as Device
        d.clock = at(2026, 11, 1 + Math.floor(r() * 6), 9, Math.floor(r() * 60))
        const live = d.state.quests.filter((q) => !q.archivedAt)
        if (r() < 0.65 && live.length) {
          d.state = progressQuest(d.state, (live[Math.floor(r() * live.length)] as { id: string }).id, r() < 0.8 ? 1 : -1, d.ctx()).state
        } else await tryTick(d)
      }
      flaky = false
      for (let i = 0; i < 4; i++) for (const d of devices) await tryTick(d)
      expect(canon((devices[1] as Device).state)).toEqual(canon((devices[0] as Device).state))
      expect(canon((devices[2] as Device).state)).toEqual(canon((devices[0] as Device).state))
      // nessun completamento locale e' andato perso: tutti gli ID creati da qualunque dispositivo esistono ancora
      expect((devices[0] as Device).state.quests.length).toBe(3)
    })
  }
})

describe('stamp (updatedAt strettamente crescente)', () => {
  it('non torna mai indietro, neanche se l\'orologio e\' indietro', () => {
    const now = new Date('2026-11-04T10:00:00.000Z')
    expect(stamp(now, null)).toBe('2026-11-04T10:00:00.000Z')
    expect(stamp(now, '2026-11-04T09:00:00.000Z')).toBe('2026-11-04T10:00:00.000Z')
    expect(stamp(now, '2026-11-04T10:00:00.000Z')).toBe('2026-11-04T10:00:00.001Z')
    expect(stamp(now, '2026-11-09T10:00:00.000Z')).toBe('2026-11-09T10:00:00.001Z') // orologio indietro di 5 giorni
  })
})
