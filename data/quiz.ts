import type { Axis } from '../core/types'

export interface QuizQuestion {
  /** Chiave i18n: quiz.q{n}.text / quiz.q{n}.a{i} */
  id: number
  axis: Axis
  /** Peso di ciascuna risposta, nell'ordine ORIGINALE (la UI mescola solo la visualizzazione). */
  weights: readonly [number, number, number, number]
}

// Ordine fisso: O, M, S, A, O, M, S, A. Le prime 4 pesano di piu' (+-3/+-1), le altre 4 meno (+-2/+-1).
export const QUIZ: readonly QuizQuestion[] = [
  { id: 1, axis: 'O', weights: [3, 1, -1, -3] },
  { id: 2, axis: 'M', weights: [3, 1, -1, -3] },
  { id: 3, axis: 'S', weights: [3, 1, -1, -3] },
  { id: 4, axis: 'A', weights: [3, 1, -1, -3] },
  { id: 5, axis: 'O', weights: [2, 1, -1, -2] },
  { id: 6, axis: 'M', weights: [2, 1, -1, -2] },
  { id: 7, axis: 'S', weights: [2, 1, -1, -2] },
  { id: 8, axis: 'A', weights: [2, 1, -1, -2] },
]
