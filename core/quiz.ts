import { QUIZ_CHARACTERS, type QuizCharacter } from '../data/characters'
import { QUIZ, type QuizQuestion } from '../data/quiz'
import type { Axis, CharacterId } from './types'

export type Axes = Record<Axis, number> // somma pesi per asse, range -5..+5

export interface RankedCharacter {
  id: CharacterId
  score: number
  /** 0..100, solo cosmetica; null se tutte le risposte si annullano. */
  affinity: number | null
}

export type QuizOutcomeKind = 'winner' | 'tie' | 'zero'

export interface QuizOutcome {
  kind: QuizOutcomeKind
  axes: Axes
  /** winner: 1 elemento; tie: i pari merito al primo posto; zero: 3 eroi a caso. */
  finalists: RankedCharacter[]
  /** Solo con winner: 2o e 3o punteggio. */
  neighbors: RankedCharacter[]
  ranked: RankedCharacter[]
}

/** @param answers indice ORIGINALE della risposta scelta, per ogni domanda. */
export function scoreQuiz(answers: readonly number[], quiz: readonly QuizQuestion[] = QUIZ): Axes {
  if (answers.length !== quiz.length) {
    throw new RangeError(`Attese ${quiz.length} risposte, ricevute ${answers.length}`)
  }
  const axes: Axes = { O: 0, M: 0, S: 0, A: 0 }
  quiz.forEach((q, i) => {
    const a = answers[i] as number
    const w = q.weights[a]
    if (!Number.isInteger(a) || w === undefined) throw new RangeError(`Risposta non valida alla domanda ${q.id}`)
    axes[q.axis] += w
  })
  return axes
}

export function rankCharacters(axes: Axes, characters: readonly QuizCharacter[] = QUIZ_CHARACTERS): RankedCharacter[] {
  const total = Math.abs(axes.O) + Math.abs(axes.M) + Math.abs(axes.S) + Math.abs(axes.A)
  return characters
    .map((c, index) => {
      const score = axes.O * c.axes.O + axes.M * c.axes.M + axes.S * c.axes.S + axes.A * c.axes.A
      return {
        index,
        id: c.id,
        score,
        affinity: total > 0 ? Math.round(50 + (50 * score) / total) : null,
      }
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ id, score, affinity }) => ({ id, score, affinity }))
}

/** Fisher-Yates con rng iniettabile (rng() in [0,1)). Non modifica l'input. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}

export function quizOutcome(axes: Axes, rng: () => number = Math.random): QuizOutcome {
  const ranked = rankCharacters(axes)
  const top = ranked[0] as RankedCharacter
  const total = Math.abs(axes.O) + Math.abs(axes.M) + Math.abs(axes.S) + Math.abs(axes.A)

  if (total === 0) {
    return { kind: 'zero', axes, finalists: shuffle(ranked, rng).slice(0, 3), neighbors: [], ranked }
  }
  const tied = ranked.filter((r) => r.score === top.score)
  if (tied.length > 1) return { kind: 'tie', axes, finalists: tied, neighbors: [], ranked }
  return { kind: 'winner', axes, finalists: [top], neighbors: ranked.slice(1, 3), ranked }
}
