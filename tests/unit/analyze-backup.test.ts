import { describe, expect, it } from 'vitest'
// @ts-expect-error script .mjs senza tipi
import { analyze } from '../../scripts/analyze-backup.mjs'
import { exportBackup } from '../../core/backup'
import { progressQuest } from '../../core/game'
import { at, ctxAt, daily, onboarded, withQuests } from './helpers'

describe('scripts/analyze-backup', () => {
  it('ricava retention, striscia e XP da un backup reale', () => {
    let s = withQuests(onboarded('valdo', at(2026, 11, 1, 9)), [daily('A'), daily('B')], at(2026, 11, 1, 9))
    const days = [1, 2, 3, 5, 8, 9] // giorno 0 = 1 nov: attivo il 1, 2, 3, 5, 8, 9
    for (const d of days) s = progressQuest(s, s.quests[0]!.id, 1, ctxAt(at(2026, 11, d, 10))).state
    const r = analyze(exportBackup(s, at(2026, 11, 12, 10)))
    expect(r).toMatchObject({
      character: 'valdo',
      spanDays: 12,
      completions: 6,
      activeDays: 6,
      activeShare: 50,
      day1: true,
      bestStreak: 3,
      activeFirstWeek: 4, // giorni 0..6 dopo l'onboarding: 1, 2, 3, 5 nov
      activeSecondWeek: 2, // 8 e 9 nov
      daysSinceLastActive: 3,
      totalXp: 60,
      xpPerActiveDay: 10,
      questsActive: 2,
    })
  })

  it('rifiuta file che non sono un backup', () => {
    expect(() => analyze('{"foo":1}')).toThrow(/backup/)
    expect(() => analyze('non json')).toThrow()
  })
})
