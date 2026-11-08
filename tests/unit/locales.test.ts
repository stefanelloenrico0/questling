import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { levelUpLine, textsFor, channelFor } from '../../data/notification-texts'
import { DEFAULT_LOCALE, LOCALES, detectLocale, isLocale } from '../../core/locale'
import { updateSettings } from '../../core/game'
import { createInitialState } from '../../core/schema'
import type { PoolKey } from '../../core/notifications-plan'
import { CHARACTER_IDS } from '../../core/types'
import { SUGGESTED_QUESTS } from '../../data/suggested-quests'
import { ACHIEVEMENTS } from '../../data/achievements'
import { QUIZ } from '../../data/quiz'
import { FOCUS_AREAS } from '../../data/focus-areas'

const FILES = ['ui', 'account', 'stats', 'quiz', 'characters', 'notifications', 'privacy'] as const
const read = (locale: string, file: string): unknown => JSON.parse(readFileSync(join('i18n', 'locales', locale, `${file}.json`), 'utf8'))

/** Elenca ogni foglia come "percorso -> testo" (gli array si indicizzano). */
function leaves(node: unknown, path = '', out = new Map<string, string>()): Map<string, string> {
  if (typeof node === 'string') out.set(path, node)
  else if (Array.isArray(node)) node.forEach((v, i) => leaves(v, `${path}[${i}]`, out))
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) leaves(v, path ? `${path}.${k}` : k, out)
  return out
}
const placeholders = (s: string): string => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')

describe('lingue: italiano e inglese hanno la stessa struttura', () => {
  for (const file of FILES) {
    it(`${file}.json: stesse chiavi e stessi segnaposto`, () => {
      const it_ = leaves(read('it', file))
      const en = leaves(read('en', file))
      const missingInEn = [...it_.keys()].filter((k) => !en.has(k))
      const extraInEn = [...en.keys()].filter((k) => !it_.has(k))
      expect(missingInEn, 'chiavi mancanti in inglese').toEqual([])
      expect(extraInEn, 'chiavi in piu\' in inglese').toEqual([])
      const mismatched = [...it_.entries()].filter(([k, v]) => placeholders(v) !== placeholders(en.get(k) ?? '')).map(([k]) => k)
      expect(mismatched, 'segnaposto diversi').toEqual([])
    })
  }

  it('nessun testo inglese vuoto, e nessun carattere speciale di vue-i18n nei messaggi', () => {
    const offenders: string[] = []
    for (const file of FILES) {
      for (const [k, v] of leaves(read('en', file))) {
        if (v.trim().length === 0) offenders.push(`${file}:${k} vuoto`)
        if (file !== 'notifications' && file !== 'privacy' && /[|@$]/.test(v)) offenders.push(`${file}:${k} contiene | @ o $`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('l\'inglese non e\' rimasto italiano: i testi lunghi sono diversi da quelli italiani', () => {
    const it_ = leaves(read('it', 'characters'))
    const en = leaves(read('en', 'characters'))
    const same = [...it_.entries()].filter(([k, v]) => v.length > 40 && en.get(k) === v).map(([k]) => k)
    expect(same).toEqual([])
  })
})

describe('testi delle notifiche in inglese', () => {
  const en = textsFor('en')
  const SLOTS: PoolKey[] = ['morning', 'evening', 'streak', 'comeback', 'weekly', 'monthly', 'levelup']

  it('ogni eroe ha almeno 10 varianti per slot, senza duplicati, di lunghezza adatta', () => {
    const problems: string[] = []
    for (const id of CHARACTER_IDS) {
      for (const key of SLOTS) {
        const list = en.variants(id, key)
        if (list.length < 10) problems.push(`${id}.${key}: solo ${list.length}`)
        if (new Set(list).size !== list.length) problems.push(`${id}.${key}: duplicati`)
        list.forEach((text, i) => {
          if (text.length < 8 || text.length > 130) problems.push(`${id}.${key}[${i}]: lunghezza ${text.length}`)
          if (key === 'streak' && !text.includes('{n}')) problems.push(`${id}.streak[${i}]: manca {n}`)
          if (key !== 'streak' && text.includes('{n}')) problems.push(`${id}.${key}[${i}]: {n} fuori da streak`)
        })
      }
    }
    expect(problems).toEqual([])
  })

  it('la voce resta quella dell\'eroe: Kuro senza esclamativi, Unit 404 con prefisso >', () => {
    for (const key of SLOTS) {
      for (const t of en.variants('kuro', key)) expect(t).not.toContain('!')
      for (const t of en.variants('u404', key)) expect(t.startsWith('> ')).toBe(true)
    }
  })

  it('titolo, canale e frase di level-up sono in inglese', () => {
    expect(en.title('salmastro')).toBe('Captain Brine')
    expect(channelFor('en').name).toBe('Hero reminders')
    expect(channelFor('it').name).toBe('Promemoria dell\'eroe')
    expect(levelUpLine('valdo', 5, 'en').length).toBeGreaterThan(5)
    expect(levelUpLine('valdo', 5, 'en')).not.toBe(levelUpLine('valdo', 5, 'it'))
  })
})

describe('contenuti collegati alle chiavi: tutto esiste anche in inglese', () => {
  const en = leaves(read('en', 'characters'))
  const enStats = leaves(read('en', 'stats'))
  const enUi = leaves(read('en', 'ui'))
  const enQuiz = leaves(read('en', 'quiz'))

  it('missioni suggerite, traguardi, quiz e aree di interesse', () => {
    const missing: string[] = []
    for (const id of CHARACTER_IDS) for (const s of SUGGESTED_QUESTS[id]) if (!en.has(`${id}.quests.${s.key}`)) missing.push(`${id}.quests.${s.key}`)
    for (const a of ACHIEVEMENTS) for (const f of ['title', 'desc']) if (!enStats.has(`achievements.${a.id}.${f}`)) missing.push(`achievements.${a.id}.${f}`)
    for (const q of QUIZ) for (const f of ['text', 'a0', 'a1', 'a2', 'a3']) if (!enQuiz.has(`q${q.id}.${f}`)) missing.push(`quiz.q${q.id}.${f}`)
    for (const area of FOCUS_AREAS) for (const f of ['title', 'desc', 'q1', 'q2']) if (!enUi.has(`focus.areas.${area.id}.${f}`)) missing.push(`focus.${area.id}.${f}`)
    expect(missing).toEqual([])
  })
})

describe('scelta della lingua', () => {
  it('detectLocale prende la prima lingua supportata del dispositivo, altrimenti l\'italiano', () => {
    expect(detectLocale(['en-US', 'it'])).toBe('en')
    expect(detectLocale(['fr-FR', 'en-GB'])).toBe('en')
    expect(detectLocale(['it-IT'])).toBe('it')
    expect(detectLocale(['de', 'fr'])).toBe(DEFAULT_LOCALE)
    expect(detectLocale([])).toBe(DEFAULT_LOCALE)
    expect(detectLocale(undefined)).toBe(DEFAULT_LOCALE)
    expect(detectLocale(['EN_gb'])).toBe('en')
  })

  it('isLocale riconosce solo le lingue supportate', () => {
    for (const l of LOCALES) expect(isLocale(l)).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })

  it('updateSettings cambia la lingua e ignora valori non validi', () => {
    const s = createInitialState(new Date('2026-11-04T10:00:00Z'))
    expect(s.settings.locale).toBe('it')
    expect(updateSettings(s, { locale: 'en' }).settings.locale).toBe('en')
    expect(updateSettings(s, { locale: 'xx' as never }).settings.locale).toBe('it')
    expect(updateSettings(updateSettings(s, { locale: 'en' }), { sound: false }).settings.locale).toBe('en')
  })
})
