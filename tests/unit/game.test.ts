import { describe, expect, it } from 'vitest'
import {
  activeQuests,
  archiveQuest,
  completeOnboarding,
  createQuest,
  currentCount,
  progressQuest,
  renameProfile,
  reorderQuests,
  setCharacter,
  totalXp,
  updateQuest,
  updateSettings,
} from '../../core/game'
import { computeStats, periodProgress, questRows } from '../../core/selectors'
import { addDays } from '../../core/periods'
import type { AppState } from '../../core/types'
import { at, ctxAt, daily, onboarded, withQuests } from './helpers'

const DAY = at(2026, 11, 4, 10)

function idOf(state: AppState, title: string): string {
  const q = state.quests.find((x) => x.title === title)
  if (!q) throw new Error(`missione ${title} non trovata`)
  return q.id
}

describe('createQuest e tetti', () => {
  it('crea con target forzato dal periodo e order progressivo', () => {
    const base = onboarded()
    const r1 = createQuest(base, { ...daily('A'), target: 5 }, ctxAt(DAY))
    expect(r1.ok && r1.quest.target).toBe(1) // daily = 1
    const r2 = createQuest(base, { title: 'W', icon: 'star', difficulty: 'easy', period: 'weekly', target: 99 }, ctxAt(DAY))
    expect(r2.ok && r2.quest.target).toBe(7)
    const r3 = createQuest(base, { title: 'M', icon: 'star', difficulty: 'easy', period: 'monthly', target: 0 }, ctxAt(DAY))
    expect(r3.ok && r3.quest.target).toBe(1)
  })

  it('rispetta i tetti 7 daily / 4 weekly / 3 monthly (le archiviate non contano)', () => {
    let s = onboarded()
    for (let i = 0; i < 7; i++) s = withQuests(s, [daily(`D${i}`)])
    expect(createQuest(s, daily('troppo'), ctxAt(DAY))).toEqual({ ok: false, error: 'cap_reached' })
    s = archiveQuest(s, idOf(s, 'D0'), ctxAt(DAY)).state
    expect(createQuest(s, daily('ora si'), ctxAt(DAY)).ok).toBe(true)

    let w = onboarded()
    for (let i = 0; i < 4; i++) w = withQuests(w, [{ ...daily(`W${i}`), period: 'weekly' }])
    expect(createQuest(w, { ...daily('x'), period: 'weekly' }, ctxAt(DAY))).toEqual({ ok: false, error: 'cap_reached' })

    let m = onboarded()
    for (let i = 0; i < 3; i++) m = withQuests(m, [{ ...daily(`M${i}`), period: 'monthly' }])
    expect(createQuest(m, { ...daily('x'), period: 'monthly' }, ctxAt(DAY))).toEqual({ ok: false, error: 'cap_reached' })
  })

  it('titolo vuoto o troppo lungo rifiutato, spazi normalizzati', () => {
    const s = onboarded()
    expect(createQuest(s, daily('   '), ctxAt(DAY))).toEqual({ ok: false, error: 'invalid_title' })
    expect(createQuest(s, daily('x'.repeat(61)), ctxAt(DAY))).toEqual({ ok: false, error: 'invalid_title' })
    const r = createQuest(s, daily('  Letto   rifatto '), ctxAt(DAY))
    expect(r.ok && r.quest.title).toBe('Letto rifatto')
  })
})

describe('completare e annullare', () => {
  it('daily: completa -> XP base e livello derivato; undo ritira esattamente l\'XP', () => {
    const s0 = withQuests(onboarded(), [daily('Allenamento', 'medium')])
    const id = idOf(s0, 'Allenamento')
    const done = progressQuest(s0, id, 1, ctxAt(DAY))
    expect(done.changed).toBe(true)
    expect(done.xpDelta).toBe(10)
    expect(totalXp(done.state)).toBe(10)
    expect(currentCount(done.state, done.state.quests[0]!, DAY)).toBe(1)

    const undone = progressQuest(done.state, id, -1, ctxAt(DAY))
    expect(undone.xpDelta).toBe(-10)
    expect(totalXp(undone.state)).toBe(0)
    expect(undone.state.completions[0]).toMatchObject({ count: 0, completedAt: null })
  })

  it('nessun farming: ri-tap oltre il target non da XP, undo+redo rida\' XP una sola volta', () => {
    const s0 = withQuests(onboarded(), [daily('A')])
    const id = idOf(s0, 'A')
    let s = progressQuest(s0, id, 1, ctxAt(DAY)).state
    expect(progressQuest(s, id, 1, ctxAt(DAY)).changed).toBe(false) // gia' al target
    s = progressQuest(s, id, -1, ctxAt(DAY)).state
    s = progressQuest(s, id, 1, ctxAt(DAY)).state
    expect(totalXp(s)).toBe(10)
    expect(progressQuest(s, id, -1, ctxAt(DAY)).state.xpEvents.at(-1)?.delta).toBe(-10)
  })

  it('weekly con target 3: l\'XP arriva solo al terzo tap (x4)', () => {
    const s0 = withQuests(onboarded(), [{ title: 'Corsa', icon: 'shoe', difficulty: 'medium', period: 'weekly', target: 3 }])
    const id = idOf(s0, 'Corsa')
    const t1 = progressQuest(s0, id, 1, ctxAt(DAY))
    const t2 = progressQuest(t1.state, id, 1, ctxAt(DAY))
    expect([t1.xpDelta, t2.xpDelta]).toEqual([0, 0])
    const t3 = progressQuest(t2.state, id, 1, ctxAt(DAY))
    expect(t3.xpDelta).toBe(40)
    // scendere sotto il target ritira l'XP, il progresso resta
    const back = progressQuest(t3.state, id, -1, ctxAt(DAY))
    expect(back.xpDelta).toBe(-40)
    expect(currentCount(back.state, back.state.quests[0]!, DAY)).toBe(2)
  })

  it('monthly: chiave di periodo mensile, XP x12', () => {
    const s0 = withQuests(onboarded(), [{ title: 'Libro', icon: 'book', difficulty: 'medium', period: 'monthly', target: 1 }])
    const r = progressQuest(s0, idOf(s0, 'Libro'), 1, ctxAt(DAY))
    expect(r.xpDelta).toBe(120)
    expect(r.state.completions[0]?.periodKey).toBe('2026-11')
  })

  it('il progresso e\' per periodo: domani una daily riparte da zero (e l\'XP si puo\' riguadagnare)', () => {
    const s0 = withQuests(onboarded(), [daily('A')])
    const id = idOf(s0, 'A')
    const s1 = progressQuest(s0, id, 1, ctxAt(DAY)).state
    const tomorrow = at(2026, 11, 5, 10)
    expect(currentCount(s1, s1.quests[0]!, tomorrow)).toBe(0)
    const s2 = progressQuest(s1, id, 1, ctxAt(tomorrow))
    expect(s2.xpDelta).toBe(10)
    expect(s2.state.completions).toHaveLength(2)
  })

  it('rollover alle 04:00: alle 03:00 si agisce ancora sul giorno precedente', () => {
    const s0 = withQuests(onboarded(), [daily('A')])
    const id = idOf(s0, 'A')
    const late = at(2026, 11, 5, 3, 0)
    const s1 = progressQuest(s0, id, 1, ctxAt(late)).state
    expect(s1.completions[0]?.periodKey).toBe('2026-11-04')
    const after = at(2026, 11, 5, 4, 0)
    expect(currentCount(s1, s1.quests[0]!, after)).toBe(0)
  })

  it('missione archiviata o inesistente: nessun effetto', () => {
    const s0 = withQuests(onboarded(), [daily('A')])
    expect(progressQuest(s0, 'nope', 1, ctxAt(DAY)).changed).toBe(false)
    const archived = archiveQuest(s0, idOf(s0, 'A'), ctxAt(DAY)).state
    expect(progressQuest(archived, idOf(s0, 'A'), 1, ctxAt(DAY)).changed).toBe(false)
  })
})

describe('bonus "tutte fatte"', () => {
  const setup = (): { s: AppState; a: string; b: string; c: string } => {
    const s = withQuests(onboarded(), [daily('A'), daily('B'), daily('C')])
    return { s, a: idOf(s, 'A'), b: idOf(s, 'B'), c: idOf(s, 'C') }
  }

  it('+10 quando tutte le daily sono fatte (>= 2), una volta sola', () => {
    const { s, a, b, c } = setup()
    let st = progressQuest(s, a, 1, ctxAt(DAY)).state
    st = progressQuest(st, b, 1, ctxAt(DAY)).state
    expect(totalXp(st)).toBe(20)
    const last = progressQuest(st, c, 1, ctxAt(DAY))
    expect(last.xpDelta).toBe(20) // 10 della missione + 10 bonus
    expect(totalXp(last.state)).toBe(40)
    expect(last.state.xpEvents.filter((e) => e.reason === 'daily_bonus')).toHaveLength(1)
  })

  it('si ritira se si annulla una missione, e torna se si rifa\'', () => {
    const { s, a, b, c } = setup()
    let st = s
    for (const id of [a, b, c]) st = progressQuest(st, id, 1, ctxAt(DAY)).state
    expect(totalXp(st)).toBe(40)
    const undo = progressQuest(st, c, -1, ctxAt(DAY))
    expect(undo.xpDelta).toBe(-20)
    expect(totalXp(undo.state)).toBe(20)
    expect(progressQuest(undo.state, c, 1, ctxAt(DAY)).xpDelta).toBe(20)
  })

  it('non c\'e\' con una sola daily', () => {
    const s = withQuests(onboarded(), [daily('Solo')])
    expect(progressQuest(s, idOf(s, 'Solo'), 1, ctxAt(DAY)).xpDelta).toBe(10)
  })
})

describe('traguardi streak', () => {
  it('7 giorni consecutivi: +25 XP al settimo; l\'undo del settimo li ritira', () => {
    let s = withQuests(onboarded(), [daily('A')], at(2026, 10, 1))
    const id = idOf(s, 'A')
    let lastDay = DAY
    for (let i = 0; i < 7; i++) {
      lastDay = new Date(2026, 10, 1 + i, 10)
      s = progressQuest(s, id, 1, ctxAt(lastDay)).state
    }
    expect(s.xpEvents.filter((e) => e.reason === 'streak_milestone')).toEqual([
      expect.objectContaining({ delta: 25, refId: '7:2026-11-07' }),
    ])
    expect(totalXp(s)).toBe(7 * 10 + 25)

    const undone = progressQuest(s, id, -1, ctxAt(lastDay))
    expect(undone.xpDelta).toBe(-35)
    expect(totalXp(undone.state)).toBe(6 * 10)
    expect(computeStats(undone.state, lastDay).streak.current).toBe(6)

    const redone = progressQuest(undone.state, id, 1, ctxAt(lastDay))
    expect(redone.xpDelta).toBe(35)
  })
})

describe('livello e capitoli', () => {
  it('level-up segnalato con tier/capitolo e capitoli sbloccati (per tutti gli eroi)', () => {
    let s = withQuests(onboarded(), [{ ...daily('Boss', 'hard'), period: 'monthly' }])
    const id = idOf(s, 'Boss') // hard monthly = 240 XP -> da Lv 1 a Lv 3 (50 + 107 = 157 < 240 < 324)
    const r = progressQuest(s, id, 1, ctxAt(DAY))
    expect(r.levelUp).toMatchObject({ from: 1, to: 3, tierChanged: false, chapter: null })
    s = r.state
    expect(s.unlockedChapters.valdo).toEqual([1])

    // portare l'XP oltre il Lv 5 (554) con piu' missioni mensili
    let s2 = withQuests(onboarded(), [
      { ...daily('M1', 'hard'), period: 'monthly' },
      { ...daily('M2', 'hard'), period: 'monthly' },
      { ...daily('M3', 'hard'), period: 'monthly' },
    ])
    let up = null
    for (const t of ['M1', 'M2', 'M3']) {
      const out = progressQuest(s2, idOf(s2, t), 1, ctxAt(DAY))
      s2 = out.state
      up = out.levelUp ?? up
    }
    expect(totalXp(s2)).toBe(720)
    expect(up).toMatchObject({ tierChanged: true, tier: 2, chapter: 2 })
    expect(s2.unlockedChapters.valdo).toEqual([1, 2])
    expect(s2.unlockedChapters.brunilde).toEqual([1, 2]) // il livello appartiene al giocatore (D5)
  })

  it('l\'undo puo\' far scendere il livello ma i capitoli sbloccati restano', () => {
    let s = withQuests(onboarded(), [
      { ...daily('M1', 'hard'), period: 'monthly' },
      { ...daily('M2', 'hard'), period: 'monthly' },
      { ...daily('M3', 'hard'), period: 'monthly' },
    ])
    for (const t of ['M1', 'M2', 'M3']) s = progressQuest(s, idOf(s, t), 1, ctxAt(DAY)).state
    const down = progressQuest(s, idOf(s, 'M3'), -1, ctxAt(DAY))
    expect(down.levelUp).toBeNull()
    expect(down.state.unlockedChapters.valdo).toEqual([1, 2])
  })
})

describe('cambio eroe (D5)', () => {
  it('non altera XP, livello, streak, completamenti', () => {
    let s = withQuests(onboarded('valdo'), [daily('A'), daily('B')])
    s = progressQuest(s, idOf(s, 'A'), 1, ctxAt(DAY)).state
    const before = computeStats(s, DAY)
    const changed = setCharacter(s, 'kuro', ctxAt(DAY))
    const after = computeStats(changed, DAY)
    expect(changed.profile?.characterId).toBe('kuro')
    expect(after).toEqual(before)
    expect(changed.xpEvents).toBe(s.xpEvents)
    expect(changed.completions).toBe(s.completions)
  })

  it('senza profilo non fa nulla', () => {
    const s = onboarded()
    expect(setCharacter({ ...s, profile: null }, 'kuro', ctxAt(DAY)).profile).toBeNull()
  })
})

describe('modifica, archivio, ordine', () => {
  it('updateQuest: titolo, difficolta\'; il periodo non cambia', () => {
    const s0 = withQuests(onboarded(), [daily('Vecchio')])
    const r = updateQuest(s0, idOf(s0, 'Vecchio'), { title: 'Nuovo', difficulty: 'hard' }, ctxAt(DAY))
    expect(r.ok && r.quest).toMatchObject({ title: 'Nuovo', difficulty: 'hard', period: 'daily' })
    expect(updateQuest(s0, idOf(s0, 'Vecchio'), { title: ' ' }, ctxAt(DAY))).toEqual({ ok: false, error: 'invalid_title' })
    expect(updateQuest(s0, 'nope', { title: 'x' }, ctxAt(DAY))).toEqual({ ok: false, error: 'not_found' })
  })

  it('cambiare difficolta\' non riscrive l\'XP gia\' dato; l\'undo ritira esattamente quanto dato', () => {
    let s = withQuests(onboarded(), [daily('A', 'easy')])
    const id = idOf(s, 'A')
    s = progressQuest(s, id, 1, ctxAt(DAY)).state // +5
    const r = updateQuest(s, id, { difficulty: 'hard' }, ctxAt(DAY))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(totalXp(r.state)).toBe(5)
    expect(progressQuest(r.state, id, -1, ctxAt(DAY)).xpDelta).toBe(-5)
  })

  it('abbassare il target sotto il progresso lo completa e assegna l\'XP', () => {
    let s = withQuests(onboarded(), [{ title: 'W', icon: 'star', difficulty: 'medium', period: 'weekly', target: 3 }])
    const id = idOf(s, 'W')
    s = progressQuest(s, id, 1, ctxAt(DAY)).state
    s = progressQuest(s, id, 1, ctxAt(DAY)).state
    const r = updateQuest(s, id, { target: 2 }, ctxAt(DAY))
    expect(r.ok && totalXp(r.state)).toBe(40)
  })

  it('archiviare e\' un soft delete: completamenti e XP restano', () => {
    let s = withQuests(onboarded(), [daily('A')])
    s = progressQuest(s, idOf(s, 'A'), 1, ctxAt(DAY)).state
    const out = archiveQuest(s, idOf(s, 'A'), ctxAt(DAY))
    expect(out.state.quests[0]?.archivedAt).toBeTruthy()
    expect(activeQuests(out.state)).toHaveLength(0)
    expect(totalXp(out.state)).toBe(10)
    expect(out.state.completions).toHaveLength(1)
    expect(archiveQuest(out.state, idOf(s, 'A'), ctxAt(DAY)).changed).toBe(false)
  })

  it('reorderQuests e questRows ordinano per order', () => {
    const s0 = withQuests(onboarded(), [daily('A'), daily('B'), daily('C')])
    const ids = [idOf(s0, 'C'), idOf(s0, 'A'), idOf(s0, 'B')]
    const s1 = reorderQuests(s0, 'daily', ids, ctxAt(DAY))
    expect(questRows(s1, 'daily', DAY).map((r) => r.quest.title)).toEqual(['C', 'A', 'B'])
  })
})

describe('onboarding, profilo, impostazioni', () => {
  it('completeOnboarding crea profilo e missioni (rispettando i tetti)', () => {
    const s = completeOnboarding(
      onboarded() && { ...onboarded(), profile: null },
      { displayName: '  Enrico ', characterId: 'fenna', quizAnswers: [0, 1, 2, 3, 0, 1, 2, 3], quests: [daily('A'), daily('B')] },
      ctxAt(DAY),
    )
    expect(s?.profile).toMatchObject({ displayName: 'Enrico', characterId: 'fenna', quizAnswers: [0, 1, 2, 3, 0, 1, 2, 3] })
    expect(s?.quests).toHaveLength(2)
  })

  it('nome vuoto -> null; nome troncato a 24 caratteri', () => {
    const base = { ...onboarded(), profile: null }
    expect(completeOnboarding(base, { displayName: '   ', characterId: 'fenna', quests: [] }, ctxAt(DAY))).toBeNull()
    const s = completeOnboarding(base, { displayName: 'x'.repeat(40), characterId: 'fenna', quests: [] }, ctxAt(DAY))
    expect(s?.profile?.displayName).toHaveLength(24)
  })

  it('renameProfile e updateSettings (dayStartHour limitato a 0..6)', () => {
    const s = onboarded()
    expect(renameProfile(s, ' Nuovo ', ctxAt(DAY)).profile?.displayName).toBe('Nuovo')
    expect(renameProfile(s, '  ', ctxAt(DAY))).toBe(s)
    expect(updateSettings(s, { dayStartHour: 9 }).settings.dayStartHour).toBe(6)
    expect(updateSettings(s, { dayStartHour: -3 }).settings.dayStartHour).toBe(0)
    expect(updateSettings(s, { sound: false }).settings).toMatchObject({ sound: false, dayStartHour: 4 })
  })

  it('cambiare dayStartHour sposta il giorno logico (la stessa ora cade in un altro giorno)', () => {
    const s0 = withQuests(onboarded(), [daily('A')])
    const s1 = updateSettings(s0, { dayStartHour: 6 })
    const r = progressQuest(s1, idOf(s1, 'A'), 1, ctxAt(at(2026, 11, 4, 5, 0)))
    expect(r.state.completions[0]?.periodKey).toBe('2026-11-03')
  })
})

describe('selectors', () => {
  it('questRows / periodProgress / computeStats', () => {
    let s = withQuests(onboarded(), [daily('A'), daily('B')])
    s = progressQuest(s, idOf(s, 'A'), 1, ctxAt(DAY)).state
    const rows = questRows(s, 'daily', DAY)
    expect(rows.map((r) => [r.quest.title, r.done, r.xp])).toEqual([['A', true, 10], ['B', false, 10]])
    expect(periodProgress(rows)).toEqual({ done: 1, total: 2 })
    expect(computeStats(s, DAY)).toMatchObject({
      totalXp: 10,
      tier: 1,
      questsCompleted: 1,
      streak: { current: 1, todayDone: true },
    })
    expect(computeStats(s, addDaysDate(DAY, 1)).streak).toMatchObject({ current: 1, atRisk: true })
  })
})

function addDaysDate(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}
void addDays
