import { describe, expect, it } from 'vitest'
import { BACKUP_FORMAT, exportBackup, parseBackup } from '../../core/backup'
import { ulid } from '../../core/id'
import { STATE_KEY, loadState, saveState, type KeyValueStore } from '../../core/persistence'
import { SCHEMA_VERSION, createInitialState, migrateState, parseState, type Migration } from '../../core/schema'
import { progressQuest } from '../../core/game'
import { at, ctxAt, daily, onboarded, withQuests } from './helpers'

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>()
  get = async (k: string): Promise<string | null> => this.data.get(k) ?? null
  set = async (k: string, v: string): Promise<void> => void this.data.set(k, v)
  remove = async (k: string): Promise<void> => void this.data.delete(k)
}

const NOW = at(2026, 11, 4, 9)

function populated() {
  let s = withQuests(onboarded(), [daily('A'), daily('B')])
  s = progressQuest(s, s.quests[0]!.id, 1, ctxAt(NOW)).state
  return s
}

describe('schema e migrazioni', () => {
  it('lo stato iniziale e\' valido', () => {
    expect(parseState(createInitialState(NOW)).ok).toBe(true)
  })

  it('round trip JSON di uno stato popolato', () => {
    const s = populated()
    const parsed = parseState(JSON.parse(JSON.stringify(s)))
    expect(parsed.ok && parsed.state).toEqual(s)
  })

  it('rifiuta input non oggetto, senza versione, troppo nuovo', () => {
    expect(parseState(null)).toMatchObject({ ok: false, reason: 'not_object' })
    expect(parseState([])).toMatchObject({ ok: false, reason: 'not_object' })
    expect(parseState({})).toMatchObject({ ok: false, reason: 'no_version' })
    expect(parseState({ ...createInitialState(NOW), schemaVersion: SCHEMA_VERSION + 1 })).toMatchObject({
      ok: false,
      reason: 'too_new',
    })
  })

  it('rifiuta campi non validi con un dettaglio', () => {
    const bad = { ...createInitialState(NOW), settings: { ...createInitialState(NOW).settings, dayStartHour: 99 } }
    const r = parseState(bad)
    expect(r).toMatchObject({ ok: false, reason: 'invalid' })
    expect(!r.ok && r.detail).toContain('dayStartHour')
  })

  it('rifiuta target incoerente col periodo e enum non validi', () => {
    const s = populated()
    const badTarget = { ...s, quests: [{ ...s.quests[0]!, target: 5 }] } // daily con target 5
    expect(parseState(badTarget)).toMatchObject({ ok: false, reason: 'invalid' })
    const badEnum = { ...s, quests: [{ ...s.quests[0]!, difficulty: 'insane' }] }
    expect(parseState(badEnum)).toMatchObject({ ok: false, reason: 'invalid' })
  })

  it('migrazione a catena v1 -> v3', () => {
    const m1: Migration = (s) => ({ ...s, a: 1 })
    const m2: Migration = (s) => ({ ...s, b: (s.a as number) + 1 })
    const r = migrateState({ schemaVersion: 1 }, 3, { 1: m1, 2: m2 })
    expect(r).toEqual({ ok: true, value: { schemaVersion: 3, a: 1, b: 2 } })
    expect(migrateState({ schemaVersion: 1 }, 3, { 1: m1 })).toEqual({ ok: false, reason: 'missing_migration' })
    expect(migrateState({ schemaVersion: 3 }, 3, {})).toEqual({ ok: true, value: { schemaVersion: 3 } })
  })
})

describe('persistenza', () => {
  it('nessun dato -> stato fresco, nulla scritto', async () => {
    const store = new MemoryStore()
    const r = await loadState(store, NOW)
    expect(r.status).toBe('fresh')
    expect(store.data.size).toBe(0)
  })

  it('salva e ricarica (e aggiorna lastOpenAt)', async () => {
    const store = new MemoryStore()
    const s = populated()
    await saveState(store, s)
    const later = at(2026, 11, 5, 9)
    const r = await loadState(store, later)
    expect(r.status).toBe('loaded')
    expect(r.state).toEqual({ ...s, lastOpenAt: later.toISOString() })
  })

  it('JSON corrotto: NON si perde, copia in corrupt:<ts> e si riparte', async () => {
    const store = new MemoryStore()
    store.data.set(STATE_KEY, '{"schemaVersion":1, rotto')
    const r = await loadState(store, NOW)
    expect(r.status).toBe('recovered')
    expect(r.state.profile).toBeNull()
    expect(r.corruptKey).toBe(`questling:v1:corrupt:${NOW.getTime()}`)
    expect(store.data.get(r.corruptKey!)).toBe('{"schemaVersion":1, rotto')
    expect(store.data.get(STATE_KEY)).toBe('{"schemaVersion":1, rotto') // la chiave principale non e' toccata dal load
  })

  it('stato valido JSON ma non conforme allo schema: stessa protezione', async () => {
    const store = new MemoryStore()
    const raw = JSON.stringify({ ...populated(), quests: 'boom' })
    store.data.set(STATE_KEY, raw)
    const r = await loadState(store, NOW)
    expect(r.status).toBe('recovered')
    expect(store.data.get(r.corruptKey!)).toBe(raw)
  })

  it('stato di una versione piu\' nuova non viene sovrascritto alla cieca', async () => {
    const store = new MemoryStore()
    const raw = JSON.stringify({ ...populated(), schemaVersion: SCHEMA_VERSION + 1 })
    store.data.set(STATE_KEY, raw)
    const r = await loadState(store, NOW)
    expect(r.status).toBe('recovered')
    expect(store.data.get(r.corruptKey!)).toBe(raw)
  })
})

describe('backup export/import', () => {
  it('round trip con anteprima', () => {
    const s = populated()
    const text = exportBackup(s, NOW)
    const r = parseBackup(text)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.state).toEqual(s)
    expect(r.summary).toMatchObject({
      displayName: 'Enrico',
      characterId: 'valdo',
      level: 1,
      totalXp: 10,
      activeQuests: 2,
      completions: 1,
      exportedAt: NOW.toISOString(),
    })
    expect(JSON.parse(text).format).toBe(BACKUP_FORMAT)
  })

  it('import non valido: errori chiari e nessuno stato prodotto', () => {
    expect(parseBackup('non json')).toEqual({ ok: false, reason: 'not_json' })
    expect(parseBackup('42')).toEqual({ ok: false, reason: 'not_backup' })
    expect(parseBackup('{"format":"altro","state":{}}')).toEqual({ ok: false, reason: 'not_backup' })
    expect(parseBackup(`{"format":"${BACKUP_FORMAT}"}`)).toEqual({ ok: false, reason: 'not_backup' })
    expect(parseBackup(`{"format":"${BACKUP_FORMAT}","state":{"schemaVersion":1}}`)).toMatchObject({ ok: false, reason: 'invalid' })
    const tooNew = JSON.stringify({ format: BACKUP_FORMAT, state: { ...populated(), schemaVersion: 99 } })
    expect(parseBackup(tooNew)).toEqual({ ok: false, reason: 'too_new' })
  })
})

describe('ulid', () => {
  it('26 caratteri Crockford, ordinabile nel tempo', () => {
    const a = ulid(1_790_000_000_000, () => 0.1)
    const b = ulid(1_790_000_000_001, () => 0.1)
    expect(a).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)
    expect(a < b).toBe(true)
    expect(ulid(0, () => 0)).toBe('0'.repeat(26))
  })
})
