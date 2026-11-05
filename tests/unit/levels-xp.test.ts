import { describe, expect, it } from 'vitest'
import { levelFromXp, levelUpInfo, tierOf, unlockedChapterNumbers, xpToNext } from '../../core/levels'
import { QUEST_CAPS, questXp, sumXp, xpByRef } from '../../core/xp'
import type { XpEvent } from '../../core/types'

describe('levels', () => {
  it('xpToNext coincide con la tabella dell\'Appendice A', () => {
    const table: Record<number, number> = {
      1: 50, 2: 107, 3: 167, 4: 230, 5: 294, 6: 359, 7: 425, 8: 492, 9: 561, 10: 629,
      11: 699, 12: 769, 13: 840, 14: 911, 15: 983, 16: 1056, 17: 1128, 18: 1202, 19: 1275, 20: 1349,
    }
    for (const [lv, xp] of Object.entries(table)) expect(xpToNext(Number(lv))).toBe(xp)
  })

  it('XP cumulativi per raggiungere un livello (Appendice A)', () => {
    const cumulative: Record<number, number> = { 2: 50, 3: 157, 5: 554, 10: 2685, 15: 6533, 20: 12177 }
    for (const [lv, xp] of Object.entries(cumulative)) {
      expect(levelFromXp(xp).level).toBe(Number(lv))
      expect(levelFromXp(xp - 1).level).toBe(Number(lv) - 1)
    }
  })

  it('levelFromXp: resto e soglia', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, xpInLevel: 0, xpToNext: 50 })
    expect(levelFromXp(49)).toEqual({ level: 1, xpInLevel: 49, xpToNext: 50 })
    expect(levelFromXp(50)).toEqual({ level: 2, xpInLevel: 0, xpToNext: 107 })
    expect(levelFromXp(-30).level).toBe(1) // il livello non scende sotto 1
  })

  it('tier ai livelli 1/5/10/15/20', () => {
    expect([1, 4, 5, 9, 10, 14, 15, 19, 20, 35].map(tierOf)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
    expect(unlockedChapterNumbers(1)).toEqual([1])
    expect(unlockedChapterNumbers(10)).toEqual([1, 2, 3])
    expect(unlockedChapterNumbers(20)).toEqual([1, 2, 3, 4, 5])
  })

  it('levelUpInfo: tier/capitolo solo quando il tier cambia', () => {
    expect(levelUpInfo(3, 3)).toBeNull()
    expect(levelUpInfo(4, 3)).toBeNull()
    expect(levelUpInfo(2, 3)).toMatchObject({ to: 3, tierChanged: false, chapter: null })
    expect(levelUpInfo(4, 5)).toMatchObject({ to: 5, tier: 2, tierChanged: true, chapter: 2 })
    expect(levelUpInfo(4, 11)).toMatchObject({ tier: 3, chapter: 3 })
  })

  it('bilanciamento: l\'utente tipico (3 daily medium + bonus = 40 XP/giorno) arriva a Lv 2 il secondo giorno', () => {
    expect(levelFromXp(40).level).toBe(1)
    expect(levelFromXp(80).level).toBe(2)
  })
})

describe('xp', () => {
  it('XP = base x moltiplicatore periodo (esempi della spec)', () => {
    expect(questXp('easy', 'daily')).toBe(5)
    expect(questXp('medium', 'daily')).toBe(10)
    expect(questXp('hard', 'daily')).toBe(20)
    expect(questXp('medium', 'weekly')).toBe(40)
    expect(questXp('medium', 'monthly')).toBe(120)
  })

  it('riferimento di bilanciamento: mese a costanza 100% = 1480 XP', () => {
    expect(30 * (3 * 10 + 10) + 4 * 40 + 120).toBe(1480)
  })

  it('tetti missioni attive', () => {
    expect(QUEST_CAPS).toEqual({ daily: 7, weekly: 4, monthly: 3 })
  })

  it('sumXp e xpByRef', () => {
    const e = (delta: number, reason: XpEvent['reason'], refId?: string): XpEvent => ({
      id: `${delta}${reason}`, at: '2026-11-04T10:00:00.000Z', delta, reason, refId,
    })
    const events = [e(10, 'quest', 'a'), e(-10, 'quest', 'a'), e(10, 'quest', 'a'), e(5, 'quest', 'b'), e(10, 'daily_bonus', 'a')]
    expect(sumXp(events)).toBe(25)
    expect(xpByRef(events, 'quest', 'a')).toBe(10)
    expect(xpByRef(events, 'daily_bonus', 'a')).toBe(10)
    expect(xpByRef(events, 'quest', 'zzz')).toBe(0)
  })
})
