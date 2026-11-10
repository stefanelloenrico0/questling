import { describe, expect, it } from 'vitest'
import { CHARACTERS, QUIZ_CHARACTERS } from '../../data/characters'
import { heroProgress, setCharacter } from '../../core/game'
import { levelFromXp, xpToNext } from '../../core/levels'
import { appStateSchema, createInitialState, parseState } from '../../core/schema'
import { addDays } from '../../core/periods'
import { CHARACTER_IDS, type AppState, type Completion } from '../../core/types'
import { canChooseHero, isHeroUnlocked, newlyUnlockedHeroes, unlockedHeroIds } from '../../core/unlocks'
import { at, ctxAt, daily, onboarded, withQuests } from './helpers'

const NOW = at(2026, 12, 20, 10)

/** XP totali minimi per raggiungere un livello. */
function xpFor(level: number): number {
  let sum = 0
  for (let l = 1; l < level; l++) sum += xpToNext(l)
  return sum
}

function withXp(state: AppState, level: number): AppState {
  const xp = xpFor(level)
  return { ...state, xpEvents: [{ id: 'X1', at: at(2026, 12, 1).toISOString(), delta: xp, reason: 'adjustment' }] }
}

/** Una daily completata per `days` giorni consecutivi che finiscono oggi. */
function withStreak(state: AppState, days: number): AppState {
  const s = withQuests(state, [daily('A')])
  const questId = s.quests[0]!.id
  const today = '2026-12-20'
  const completions: Completion[] = Array.from({ length: days }, (_, i) => {
    const periodKey = addDays(today, -i)
    return { id: `${questId}_${periodKey}`, questId, periodKey, count: 1, completedAt: at(2026, 12, 1).toISOString(), updatedAt: at(2026, 12, 1).toISOString() }
  })
  return { ...s, completions }
}

describe('dati degli eroi sbloccabili', () => {
  it('ci sono 8 eroi del quiz e 5 sbloccabili, ognuno con la sua regola', () => {
    expect(CHARACTERS).toHaveLength(13)
    expect(QUIZ_CHARACTERS).toHaveLength(8)
    expect(CHARACTERS.map((c) => c.id).sort()).toEqual([...CHARACTER_IDS].sort())
    const rules = CHARACTERS.filter((c) => c.unlock).map((c) => [c.id, c.unlock])
    expect(rules).toEqual([
      ['salmastro', { kind: 'level', value: 10 }],
      ['plin', { kind: 'streak', value: 30 }],
      ['brace', { kind: 'level', value: 20 }],
      ['ulisse', { kind: 'level', value: 15 }],
      ['cometa', { kind: 'level', value: 30 }],
    ])
  })

  it('gli eroi sbloccabili non hanno assi (il quiz non puo\' mai assegnarli)', () => {
    for (const c of CHARACTERS.filter((x) => x.unlock)) expect(c.axes).toBeUndefined()
    for (const c of QUIZ_CHARACTERS) expect(c.unlock).toBeUndefined()
  })
})

describe('regole di sblocco', () => {
  it('a inizio partita sono disponibili solo gli otto di base', () => {
    const ids = unlockedHeroIds({ level: 1, bestStreak: 0 })
    expect(ids).toHaveLength(8)
    expect(ids).not.toContain('salmastro')
  })

  it('livello 10 sblocca Salmastro, livello 20 Brace, streak 30 Plin', () => {
    expect(isHeroUnlocked('salmastro', { level: 9, bestStreak: 99 })).toBe(false)
    expect(isHeroUnlocked('salmastro', { level: 10, bestStreak: 0 })).toBe(true)
    expect(isHeroUnlocked('brace', { level: 19, bestStreak: 0 })).toBe(false)
    expect(isHeroUnlocked('brace', { level: 20, bestStreak: 0 })).toBe(true)
    expect(isHeroUnlocked('plin', { level: 50, bestStreak: 29 })).toBe(false)
    expect(isHeroUnlocked('plin', { level: 1, bestStreak: 30 })).toBe(true)
    expect(isHeroUnlocked('valdo', { level: 1, bestStreak: 0 })).toBe(true)
  })

  it('newlyUnlockedHeroes segnala solo i passaggi nuovi', () => {
    expect(newlyUnlockedHeroes({ level: 9, bestStreak: 0 }, { level: 10, bestStreak: 0 })).toEqual(['salmastro'])
    expect(newlyUnlockedHeroes({ level: 10, bestStreak: 0 }, { level: 11, bestStreak: 0 })).toEqual([])
    expect(newlyUnlockedHeroes({ level: 19, bestStreak: 29 }, { level: 20, bestStreak: 30 })).toEqual(['plin', 'brace'])
    expect(newlyUnlockedHeroes({ level: 12, bestStreak: 0 }, { level: 5, bestStreak: 0 })).toEqual([])
  })

  it('canChooseHero: l\'eroe in uso resta sempre scegliibile anche se i progressi calano', () => {
    const low = { level: 2, bestStreak: 0 }
    expect(canChooseHero('brace', 'valdo', low)).toBe(false)
    expect(canChooseHero('brace', 'brace', low)).toBe(true)
    expect(canChooseHero('kuro', 'valdo', low)).toBe(true)
  })
})

describe('progressi derivati dallo stato', () => {
  it('heroProgress legge livello e record di streak', () => {
    const s = withStreak(withXp(onboarded(), 10), 30)
    expect(heroProgress(s, NOW)).toEqual({ level: 10, bestStreak: 30 })
    expect(levelFromXp(xpFor(10)).level).toBe(10)
  })
})

describe('setCharacter con eroi bloccati', () => {
  it('rifiuta un eroe bloccato e lo concede una volta raggiunto il livello', () => {
    const locked = onboarded('valdo')
    expect(setCharacter(locked, 'salmastro', ctxAt(NOW))).toBe(locked)
    const ok = setCharacter(withXp(locked, 10), 'salmastro', ctxAt(NOW))
    expect(ok.profile?.characterId).toBe('salmastro')
  })

  it('Plin richiede lo streak, non il livello', () => {
    const highLevel = withXp(onboarded('valdo'), 25)
    expect(setCharacter(highLevel, 'plin', ctxAt(NOW))).toBe(highLevel)
    const streaky = withStreak(onboarded('valdo'), 30)
    expect(setCharacter(streaky, 'plin', ctxAt(NOW)).profile?.characterId).toBe('plin')
  })

  it('chi ha gia\' l\'eroe e perde livello (undo) non viene bloccato fuori dal proprio eroe', () => {
    const s = onboarded('brace')
    expect(setCharacter(s, 'brace', ctxAt(NOW)).profile?.characterId).toBe('brace')
  })

  it('i capitoli si sbloccano anche per gli eroi nuovi', () => {
    const s = setCharacter(withXp(onboarded('valdo'), 20), 'brace', ctxAt(NOW))
    expect(s.unlockedChapters.brace).toEqual([1, 2, 3, 4, 5])
  })
})

describe('compatibilita\' con i salvataggi esistenti', () => {
  it('uno stato salvato con i soli 8 eroi di base si legge ancora', () => {
    const legacy = createInitialState(NOW)
    const eight = ['valdo', 'kuro', 'fenna', 'zeffiro', 'lumen', 'rondo', 'u404', 'brunilde']
    const raw = { ...legacy, unlockedChapters: Object.fromEntries(eight.map((id) => [id, [1]])) }
    expect(appStateSchema.safeParse(raw).success).toBe(true)
    const parsed = parseState(JSON.parse(JSON.stringify(raw)))
    expect(parsed.ok).toBe(true)
  })

  it('un profilo con un eroe sbloccabile e\' valido', () => {
    const s = onboarded('plin')
    expect(appStateSchema.safeParse(s).success).toBe(true)
  })
})
