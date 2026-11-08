import { describe, expect, it } from 'vitest'
import { CHARACTERS, CHARACTER_BY_ID, QUIZ_CHARACTERS } from '../../data/characters'
import { CHARACTER_IDS } from '../../core/types'

describe('data/characters', () => {
  it('definisce gli 8 personaggi del quiz e i 3 sbloccabili', () => {
    expect(CHARACTERS).toHaveLength(11)
    expect(QUIZ_CHARACTERS).toHaveLength(8)
    expect(CHARACTERS.map((c) => c.id).sort()).toEqual([...CHARACTER_IDS].sort())
  })

  it('ogni personaggio ha un accent esadecimale valido e segni ±1', () => {
    for (const c of CHARACTERS) expect(c.accent).toMatch(/^#[0-9a-f]{6}$/)
    for (const c of QUIZ_CHARACTERS) for (const sign of Object.values(c.axes)) expect([1, -1]).toContain(sign)
  })

  it('i vettori di segni sono tutti distinti (8 su 16 combinazioni)', () => {
    const keys = QUIZ_CHARACTERS.map((c) => `${c.axes.O}${c.axes.M}${c.axes.S}${c.axes.A}`)
    expect(new Set(keys).size).toBe(8)
  })

  it('CHARACTER_BY_ID indicizza tutti gli id', () => {
    for (const id of CHARACTER_IDS) expect(CHARACTER_BY_ID[id].id).toBe(id)
  })
})
