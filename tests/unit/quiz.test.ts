import { describe, expect, it } from 'vitest'
import { quizOutcome, rankCharacters, scoreQuiz, shuffle, type Axes } from '../../core/quiz'
import { CHARACTERS } from '../../data/characters'
import { QUIZ } from '../../data/quiz'
import type { Axis, CharacterId } from '../../core/types'

/** Risposte che spingono ogni asse al massimo nella direzione indicata (indice 0 = +, indice 3 = -). */
function extremeAnswers(signs: Record<Axis, 1 | -1>): number[] {
  return QUIZ.map((q) => (signs[q.axis] === 1 ? 0 : 3))
}

describe('scoreQuiz', () => {
  it('gli assi stanno in -5..+5 e le risposte estreme li saturano', () => {
    const axes = scoreQuiz(extremeAnswers({ O: 1, M: -1, S: 1, A: -1 }))
    expect(axes).toEqual({ O: 5, M: -5, S: 5, A: -5 })
  })

  it('struttura del quiz: 8 domande, 2 per asse, ordine O M S A O M S A', () => {
    expect(QUIZ.map((q) => q.axis).join('')).toBe('OMSAOMSA')
    expect(QUIZ.slice(0, 4).every((q) => q.weights.join() === '3,1,-1,-3')).toBe(true)
    expect(QUIZ.slice(4).every((q) => q.weights.join() === '2,1,-1,-2')).toBe(true)
  })

  it('rifiuta risposte mancanti o fuori range', () => {
    expect(() => scoreQuiz([0, 0, 0])).toThrow(RangeError)
    expect(() => scoreQuiz([0, 0, 0, 0, 0, 0, 0, 4])).toThrow(RangeError)
    expect(() => scoreQuiz([0, 0, 0, 0, 0, 0, 0, -1])).toThrow(RangeError)
  })

  it('i pesi non cambiano mescolando l\'ordine di VISUALIZZAZIONE delle risposte', () => {
    // La UI mescola solo la visualizzazione e passa all'engine l'indice ORIGINALE.
    const rng = (): number => 0.37
    const original = [0, 1, 2, 3, 3, 2, 1, 0]
    const displayed = QUIZ.map(() => shuffle([0, 1, 2, 3], rng))
    // l'utente tocca la voce mostrata nella posizione p: l'indice originale e' displayed[q][p]
    const picks = original.map((orig, qi) => (displayed[qi] as number[]).indexOf(orig))
    const mapped = picks.map((p, qi) => (displayed[qi] as number[])[p] as number)
    expect(mapped).toEqual(original)
    expect(scoreQuiz(mapped)).toEqual(scoreQuiz(original))
  })
})

describe('rankCharacters / quizOutcome', () => {
  it('ogni combinazione estrema di 4 segni restituisce il personaggio atteso', () => {
    for (const c of CHARACTERS) {
      const axes = scoreQuiz(extremeAnswers(c.axes))
      const outcome = quizOutcome(axes, () => 0.5)
      expect(outcome.kind).toBe('winner')
      expect(outcome.finalists[0]?.id).toBe(c.id)
      expect(outcome.finalists[0]?.affinity).toBe(100)
      expect(outcome.neighbors).toHaveLength(2)
    }
  })

  it('affinita\' = round(50 + 50 * score / somma|assi|)', () => {
    const axes: Axes = { O: 3, M: -1, S: 2, A: 0 }
    const valdo = rankCharacters(axes).find((r) => r.id === 'valdo')
    // valdo: O+ M- S+ A+ -> 3 + 1 + 2 + 0 = 6; somma = 6 -> 100
    expect(valdo).toMatchObject({ score: 6, affinity: 100 })
    const kuro = rankCharacters(axes).find((r) => r.id === 'kuro') // O+ M- S- A- -> 3+1-2-0 = 2
    expect(kuro).toMatchObject({ score: 2, affinity: Math.round(50 + (50 * 2) / 6) })
  })

  it('pareggio al primo posto rilevato', () => {
    // O=3, resto 0: tutti gli eroi con O+ pareggiano (valdo, kuro, lumen, u404)
    const outcome = quizOutcome({ O: 3, M: 0, S: 0, A: 0 }, () => 0.5)
    expect(outcome.kind).toBe('tie')
    expect(outcome.finalists.map((f) => f.id).sort()).toEqual(['kuro', 'lumen', 'u404', 'valdo'])
    expect(outcome.neighbors).toEqual([])
  })

  it('somma zero: 3 personaggi a caso con pareggio dichiarato, affinita\' nulla', () => {
    const outcome = quizOutcome({ O: 0, M: 0, S: 0, A: 0 }, () => 0.1)
    expect(outcome.kind).toBe('zero')
    expect(outcome.finalists).toHaveLength(3)
    expect(new Set(outcome.finalists.map((f) => f.id)).size).toBe(3)
    expect(outcome.finalists.every((f) => f.affinity === null)).toBe(true)
  })

  it('somma zero: rng diversi danno scelte diverse ma sempre valide', () => {
    const a = quizOutcome({ O: 0, M: 0, S: 0, A: 0 }, () => 0).finalists.map((f) => f.id)
    const b = quizOutcome({ O: 0, M: 0, S: 0, A: 0 }, () => 0.99).finalists.map((f) => f.id)
    expect(a).not.toEqual(b)
  })

  it('simulazione sulle 65.536 combinazioni di somme per asse: pareggi al primo posto ~21,9% (spec §6)', () => {
    const sums = (a: readonly number[], b: readonly number[]): number[] => a.flatMap((x) => b.map((y) => x + y))
    const bySum = (axis: Axis): number[] => {
      const qs = QUIZ.filter((q) => q.axis === axis)
      return sums(qs[0]!.weights, qs[1]!.weights)
    }
    const [O, M, S, A] = (['O', 'M', 'S', 'A'] as const).map(bySum) as [number[], number[], number[], number[]]
    expect(O.length * M.length * S.length * A.length).toBe(65_536)

    let ties = 0
    const wins = new Map<CharacterId, number>()
    for (const o of O) for (const m of M) for (const s of S) for (const a of A) {
      const out = quizOutcome({ O: o, M: m, S: s, A: a }, () => 0.5)
      if (out.kind === 'tie') ties++
      if (out.kind === 'winner') wins.set(out.finalists[0]!.id, (wins.get(out.finalists[0]!.id) ?? 0) + 1)
    }
    expect(ties / 65_536).toBeGreaterThan(0.21)
    expect(ties / 65_536).toBeLessThan(0.23)
    // distribuzione simmetrica: nessun eroe e' favorito
    const counts = [...wins.values()]
    expect(counts).toHaveLength(8)
    expect(Math.max(...counts) - Math.min(...counts)).toBe(0)
  })
})
