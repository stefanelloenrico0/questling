import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS } from '../../data/achievements'
import { progressQuest } from '../../core/game'
import {
  achievementMetrics,
  achievementsProgress,
  buildHeatmap,
  dailyCompletionsByDay,
  heatLevel,
  maxLevelEver,
  periodTotals,
} from '../../core/history'
import { weekdayOf } from '../../core/periods'
import type { AppState } from '../../core/types'
import { at, ctxAt, daily, onboarded, withQuests } from './helpers'

const NOW = at(2026, 11, 4, 12) // mercoledi'

function base(titles = ['A', 'B']): AppState {
  return withQuests(onboarded(), titles.map((t) => daily(t)), at(2026, 10, 1))
}
const id = (s: AppState, title: string): string => s.quests.find((q) => q.title === title)!.id
const complete = (s: AppState, title: string, when: Date, dir: 1 | -1 = 1): AppState =>
  progressQuest(s, id(s, title), dir, ctxAt(when)).state

describe('heatmap', () => {
  it('livelli di intensita\'', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 12].map(heatLevel)).toEqual([0, 1, 2, 2, 3, 3, 4, 4])
  })

  it('12 settimane da lunedi\' a domenica, l\'ultima contiene oggi, i giorni futuri sono vuoti', () => {
    const h = buildHeatmap(base(), NOW)
    expect(h.weeks).toHaveLength(12)
    expect(h.weeks.every((w) => w.length === 7)).toBe(true)
    expect(h.weeks.every((w) => weekdayOf(w[0]!.day) === 1)).toBe(true) // lunedi'
    const last = h.weeks[11]!
    expect(last.find((c) => c.today)?.day).toBe('2026-11-04')
    expect(last.filter((c) => c.future).map((c) => c.day)).toEqual(['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
    expect(h.weeks[0]![0]!.day).toBe('2026-08-17') // 11 settimane prima del lunedi' 2 nov
  })

  it('conta le daily completate per giorno logico (rollover 04:00 compreso)', () => {
    let s = base()
    s = complete(s, 'A', at(2026, 11, 4, 10))
    s = complete(s, 'B', at(2026, 11, 4, 11))
    s = complete(s, 'A', at(2026, 11, 3, 23)) // ieri
    s = complete(s, 'B', at(2026, 11, 2, 3, 30)) // 3:30 del 2 nov = ancora il 1 nov
    const h = buildHeatmap(s, NOW)
    const cell = (day: string) => h.weeks.flat().find((c) => c.day === day)!
    expect(cell('2026-11-04')).toMatchObject({ count: 2, level: 2, today: true })
    expect(cell('2026-11-03')).toMatchObject({ count: 1, level: 1 })
    expect(cell('2026-11-01')).toMatchObject({ count: 1 })
    expect(cell('2026-11-02').count).toBe(0)
    expect(h).toMatchObject({ total: 4, activeDays: 3, best: 2 })
  })

  it('l\'undo toglie il conteggio; le missioni archiviate contano ancora', () => {
    let s = base()
    s = complete(s, 'A', NOW)
    s = complete(s, 'A', NOW, -1)
    expect(buildHeatmap(s, NOW).total).toBe(0)
    s = complete(s, 'B', NOW)
    expect(dailyCompletionsByDay(s).get('2026-11-04')).toBe(1)
  })

  it('weekly e monthly non finiscono nella heatmap', () => {
    let s = withQuests(onboarded(), [{ ...daily('W'), period: 'weekly', target: 1 }], at(2026, 10, 1))
    s = complete(s, 'W', NOW)
    expect(buildHeatmap(s, NOW).total).toBe(0)
  })
})

describe('totali per periodo', () => {
  it('finestre di 7 e 30 giorni e totali per tipo', () => {
    let s = withQuests(
      onboarded(),
      [daily('A'), { ...daily('W'), period: 'weekly', target: 1 }, { ...daily('M'), period: 'monthly', target: 1 }],
      at(2026, 10, 1),
    )
    s = complete(s, 'A', at(2026, 11, 4, 10)) // oggi
    s = complete(s, 'A', at(2026, 10, 30, 10)) // 5 giorni fa
    s = complete(s, 'A', at(2026, 10, 20, 10)) // 15 giorni fa
    s = complete(s, 'A', at(2026, 9, 1, 10)) // 64 giorni fa
    s = complete(s, 'W', at(2026, 11, 3, 10))
    s = complete(s, 'M', at(2026, 11, 3, 10))
    const t = periodTotals(s, NOW)
    expect(t).toMatchObject({ completedDaily: 4, completedWeekly: 1, completedMonthly: 1, last7: 2, last30: 3 })
    expect(t.xpLast7).toBe(10 + 10 + 40 + 120) // oggi, 30 ott, weekly, monthly
    expect(t.xpLast30).toBe(t.xpLast7 + 10)
    expect(t.totalXp).toBe(10 * 4 + 40 + 120)
  })
})

describe('livello massimo mai raggiunto', () => {
  it('non scende con l\'undo', () => {
    let s = withQuests(onboarded(), [{ ...daily('Boss', 'hard'), period: 'monthly', target: 1 }], at(2026, 10, 1))
    expect(maxLevelEver(s)).toBe(1)
    s = complete(s, 'Boss', NOW) // 240 XP -> Lv 3
    expect(maxLevelEver(s)).toBe(3)
    s = complete(s, 'Boss', NOW, -1)
    expect(maxLevelEver(s)).toBe(3) // il livello attuale e' tornato a 1, il massimo no
  })
})

describe('traguardi', () => {
  it('stato vuoto: niente e\' raggiunto, progressi a zero', () => {
    const list = achievementsProgress(base(), NOW)
    expect(list).toHaveLength(ACHIEVEMENTS.length)
    expect(list.every((a) => !a.done)).toBe(true)
    // il livello parte da 1: i traguardi di livello hanno gia' progresso 1, tutti gli altri 0
    expect(list.filter((a) => a.def.group !== 'level').every((a) => a.current === 0)).toBe(true)
    expect(list.filter((a) => a.def.group === 'level').every((a) => a.current === 1)).toBe(true)
  })

  it('primo passo, giorno perfetto e striscia di 7 giorni', () => {
    let s = base(['A', 'B'])
    for (let d = 1; d <= 7; d++) {
      s = complete(s, 'A', at(2026, 11, d, 10))
      if (d === 3) s = complete(s, 'B', at(2026, 11, d, 11)) // giorno con tutte fatte
    }
    const done = new Set(achievementsProgress(s, at(2026, 11, 8)).filter((a) => a.done).map((a) => a.def.id))
    expect(done).toEqual(new Set(['first_step', 'perfect_day', 'streak_7']))
    const m = achievementMetrics(s, at(2026, 11, 8))
    expect(m).toMatchObject({ completions: 8, bestStreak: 7, perfectDays: 1 })
  })

  it('un traguardo raggiunto resta raggiunto anche dopo l\'undo (livello e streak migliore)', () => {
    let s = withQuests(onboarded(), [{ ...daily('Boss', 'hard'), period: 'monthly', target: 1 }], at(2026, 10, 1))
    for (const q of ['Boss']) s = complete(s, q, NOW)
    s = complete(s, 'Boss', NOW, -1)
    const lv = achievementsProgress(s, NOW).find((a) => a.def.id === 'level_5')!
    expect(lv).toMatchObject({ done: false, current: 3 }) // non e' arrivato a 5: il progresso e' il picco raggiunto, 3
  })

  it('weekly e monthly: primo completamento', () => {
    let s = withQuests(
      onboarded(),
      [{ ...daily('W'), period: 'weekly', target: 1 }, { ...daily('M'), period: 'monthly', target: 1 }],
      at(2026, 10, 1),
    )
    s = complete(s, 'W', NOW)
    s = complete(s, 'M', NOW)
    const done = achievementsProgress(s, NOW).filter((a) => a.done).map((a) => a.def.id)
    expect(done).toEqual(expect.arrayContaining(['weekly_first', 'monthly_first', 'first_step']))
  })

  it('progresso parziale e tetto al target', () => {
    let s = base(['A'])
    for (let d = 1; d <= 3; d++) s = complete(s, 'A', at(2026, 11, d, 10))
    const q25 = achievementsProgress(s, NOW).find((a) => a.def.id === 'quests_25')!
    expect(q25).toMatchObject({ current: 3, done: false })
  })

  it('id unici e target crescenti per gruppo', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
    for (const group of ['quests', 'streak', 'level'] as const) {
      const targets = ACHIEVEMENTS.filter((a) => a.group === group).map((a) => a.target)
      expect([...targets].sort((x, y) => x - y)).toEqual(targets)
    }
  })
})
