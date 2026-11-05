import { describe, expect, it } from 'vitest'
import { addDays } from '../../core/periods'
import { computeStreak } from '../../core/streak'

const START = '2026-03-01'
const days = (from: string, n: number): string[] => Array.from({ length: n }, (_, i) => addDays(from, i))

describe('computeStreak', () => {
  it('nessun giorno attivo', () => {
    expect(computeStreak([], '2026-11-04')).toMatchObject({ current: 0, best: 0, shields: 0, atRisk: false })
  })

  it('giorni consecutivi incrementano la streak', () => {
    const r = computeStreak(days(START, 5), addDays(START, 4))
    expect(r).toMatchObject({ current: 5, best: 5, shields: 0, todayDone: true, atRisk: false })
  })

  it('7 giorni consecutivi -> +1 scudo', () => {
    const r = computeStreak(days(START, 7), addDays(START, 6))
    expect(r).toMatchObject({ current: 7, shields: 1 })
  })

  it('gli scudi hanno tetto 2', () => {
    const r = computeStreak(days(START, 28), addDays(START, 27))
    expect(r.shields).toBe(2)
    expect(r.current).toBe(28)
  })

  it('salto con scudo -> la streak continua (ma non cresce nel giorno saltato)', () => {
    const active = [...days(START, 7), ...days(addDays(START, 8), 2)] // salta il giorno 7
    const r = computeStreak(active, addDays(START, 9))
    expect(r.current).toBe(9)
    expect(r.shields).toBe(0)
  })

  it('salto senza scudo -> azzera', () => {
    const active = [...days(START, 3), ...days(addDays(START, 4), 2)] // salta il giorno 3
    const r = computeStreak(active, addDays(START, 5))
    expect(r.current).toBe(2)
    expect(r.best).toBe(3)
  })

  it('2 salti con 1 scudo -> azzera', () => {
    const active = [...days(START, 7), addDays(START, 9)] // salta i giorni 7 e 8
    const r = computeStreak(active, addDays(START, 9))
    expect(r.current).toBe(1)
    expect(r.shields).toBe(0)
  })

  it('oggi non ancora fatto: "a rischio" ma non persa', () => {
    const r = computeStreak(days(START, 5), addDays(START, 5))
    expect(r).toMatchObject({ current: 5, atRisk: true, todayDone: false })
  })

  it('oggi non fatto e ieri saltato: lo scudo/azzeramento scatta sul giorno finito, non su oggi', () => {
    const r = computeStreak(days(START, 3), addDays(START, 4)) // fatti 0..2, oggi = 4, il 3 e' saltato
    expect(r.current).toBe(0)
    expect(r.atRisk).toBe(false)
  })

  it('attraversa il cambio d\'ora senza perdere la streak', () => {
    const r = computeStreak(['2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30'], '2026-03-30')
    expect(r.current).toBe(4)
    const r2 = computeStreak(['2026-10-24', '2026-10-25', '2026-10-26'], '2026-10-26')
    expect(r2.current).toBe(3)
  })

  it('traguardi a 7, 30 e 100 giorni con il giorno in cui scattano', () => {
    const r = computeStreak(days(START, 101), addDays(START, 100))
    expect(r.milestones).toEqual([
      { days: 7, dayKey: addDays(START, 6) },
      { days: 30, dayKey: addDays(START, 29) },
      { days: 100, dayKey: addDays(START, 99) },
    ])
  })

  it('ignora giorni nel futuro', () => {
    expect(computeStreak(['2026-11-10'], '2026-11-04').current).toBe(0)
  })
})
