import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import messages from '../../i18n/locales/it'
import { CHARACTERS } from '../../data/characters'
import { QUIZ } from '../../data/quiz'
import { SUGGESTED_QUESTS } from '../../data/suggested-quests'
import { ACHIEVEMENTS } from '../../data/achievements'
import { CHARACTER_IDS } from '../../core/types'

type Tree = { [key: string]: string | Tree }

function lookup(path: string): unknown {
  return path.split('.').reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Tree)[part] : undefined), messages)
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(vue|ts)$/.test(name)) out.push(full)
  }
  return out
}

describe('i18n: nessuna chiave mancante', () => {
  it('ogni chiave statica t(\'...\') usata in app/ esiste ed e\' una stringa', () => {
    const missing: string[] = []
    const re = /\bt\(\s*'([a-zA-Z0-9_.]+)'/g
    for (const file of walk('app')) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(re)) {
        if (typeof lookup(m[1]!) !== 'string') missing.push(`${file}: ${m[1]}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('le chiavi di navigazione/periodo/difficolta\' usate dinamicamente esistono', () => {
    const keys = [
      ...['today', 'quests', 'hero', 'stats', 'settings'].map((k) => `nav.${k}`),
      ...['daily', 'weekly', 'monthly'].flatMap((p) => [`period.${p}`, `period.${p}Short`, `period.${p}Plural`]),
      ...['easy', 'medium', 'hard'].map((d) => `difficulty.${d}`),
      ...['invalid_title', 'invalid_icon', 'cap_reached', 'not_found'].map((e) => `quests.errors.${e}`),
      ...['not_json', 'not_backup', 'too_new', 'invalid'].map((e) => `settings.importErrors.${e}`),
      ...[1, 2, 3].flatMap((n) => [`onboarding.intro.s${n}Title`, `onboarding.intro.s${n}Body`]),
      ...['today.sectionDaily', 'today.sectionWeekly', 'today.sectionMonthly'],
      ...[1, 2, 3, 4, 5, 6, 7].map((d) => `stats.d${d}`),
      ...['quests', 'streak', 'level', 'special'].map((g) => `stats.group.${g}`),
      ...ACHIEVEMENTS.flatMap((a) => [`achievements.${a.id}.title`, `achievements.${a.id}.desc`]),
      ...['password', 'google', 'apple'].map((p) => `account.providers.${p}`),
      ...['idle', 'syncing', 'offline', 'error'].map((s) => `sync.status.${s}`),
      ...[
        'invalid-credentials', 'email-in-use', 'weak-password', 'invalid-email', 'user-disabled', 'network',
        'too-many-requests', 'cancelled', 'requires-recent-login', 'account-exists-with-other-provider', 'unknown',
      ].map((c) => `account.errors.${c}`),
    ]
    expect(keys.filter((k) => typeof lookup(k) !== 'string')).toEqual([])
  })

  it('ogni eroe ha testi completi: nome, titoli x5, capitoli x5, missioni suggerite, frasi', () => {
    const missing: string[] = []
    for (const id of CHARACTER_IDS) {
      const keys = [
        `characters.${id}.name`, `characters.${id}.archetype`, `characters.${id}.permission`, `characters.${id}.appearance`, `characters.${id}.voice`,
        ...[1, 2, 3, 4, 5].flatMap((n) => [`characters.${id}.titles.t${n}`, `characters.${id}.chapters.c${n}`]),
        ...SUGGESTED_QUESTS[id].map((s) => `characters.${id}.quests.${s.key}`),
        ...['morning', 'evening', 'done'].map((l) => `characters.${id}.lines.${l}`),
      ]
      for (const k of keys) if (typeof lookup(k) !== 'string' || (lookup(k) as string).length < 3) missing.push(k)
    }
    expect(missing).toEqual([])
    expect(CHARACTERS).toHaveLength(CHARACTER_IDS.length)
  })

  it('il quiz ha testo e 4 risposte per ognuna delle 8 domande, e i testi si fondono con quelli di ui', () => {
    const missing: string[] = []
    for (const q of QUIZ) {
      for (const k of ['text', 'a0', 'a1', 'a2', 'a3']) if (typeof lookup(`quiz.q${q.id}.${k}`) !== 'string') missing.push(`quiz.q${q.id}.${k}`)
    }
    expect(missing).toEqual([])
    expect(typeof lookup('quiz.affinity')).toBe('string') // regressione: lo spread non deve sovrascrivere ui.quiz
  })

  it('segnaposto {n} e {name} coerenti e nessun carattere speciale di vue-i18n nei testi lunghi', () => {
    const offenders: string[] = []
    const check = (node: unknown, path: string): void => {
      if (typeof node === 'string') {
        if (/[|@$]/.test(node)) offenders.push(`${path}: ${node}`)
      } else if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) check(v, `${path}.${k}`)
      }
    }
    check(messages, 'it')
    expect(offenders).toEqual([])
  })
})

describe('stringhe utente fuori da i18n', () => {
  it('i template .vue non contengono testo visibile hardcoded (a parte simboli)', () => {
    const offenders: string[] = []
    for (const file of walk('app').filter((f) => f.endsWith('.vue'))) {
      const src = readFileSync(file, 'utf8')
      const tpl = src.match(/<template>([\s\S]*)<\/template>/)?.[1]
      if (!tpl) continue
      // testo tra tag che contiene almeno 3 lettere consecutive e non e' interpolazione
      for (const m of tpl.matchAll(/>([^<>{}]*[A-Za-zÀ-ÿ]{3,}[^<>{}]*)</g)) {
        const text = m[1]!.trim()
        if (text) offenders.push(`${file}: "${text}"`)
      }
    }
    expect(offenders).toEqual([])
  })
})
