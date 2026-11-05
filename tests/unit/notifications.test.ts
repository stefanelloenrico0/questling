import { describe, expect, it } from 'vitest'
import { levelUpLine, notificationTexts } from '../../data/notification-texts'
import { CHARACTER_IDS, type AppState, type CharacterId } from '../../core/types'
import { progressQuest, touchOpen, updateSettings, type QuestInput } from '../../core/game'
import {
  notificationId,
  pickVariantIndex,
  planNotifications,
  timeOnDay,
  type NotificationTexts,
  type PlannedNotification,
  type PoolKey,
} from '../../core/notifications-plan'
import { addDays, dayKey, daysUntilMonthEnd, weekdayOf } from '../../core/periods'
import { SFX, sfxDuration, type SfxName } from '../../core/sfx'
import { at, ctxAt, daily, onboarded, withQuests } from './helpers'

// Testi finti: la variante identifica lo slot, cosi' i test controllano le regole e non le frasi.
const fake: NotificationTexts = {
  title: (id) => `Eroe ${id}`,
  variants: (_id, key) => [`${key}-A {n} {name}`, `${key}-B {n} {name}`, `${key}-C {n} {name}`],
}

const weekly = (title: string): QuestInput => ({ ...daily(title), period: 'weekly', target: 1 })
const monthly = (title: string): QuestInput => ({ ...daily(title), period: 'monthly', target: 1 })

// 4 nov 2026 e' un mercoledi'
const WED = at(2026, 11, 4, 7, 0)

function setup(quests: QuestInput[] = [daily('A'), daily('B')], now = WED): AppState {
  let s = withQuests(onboarded('valdo', now), quests, at(2026, 10, 1))
  s = updateSettings(s, { notifications: { enabled: true } })
  return touchOpen(s, now)
}

const plan = (state: AppState, now = WED, texts = fake): PlannedNotification[] => planNotifications({ state, now, texts })
const dayOf = (n: PlannedNotification): string => dayKey(n.at)
const slotsOf = (list: PlannedNotification[], day: string): string[] => list.filter((n) => dayOf(n) === day).map((n) => n.slot)
const complete = (s: AppState, title: string, when: Date): AppState =>
  progressQuest(s, s.quests.find((q) => q.title === title)!.id, 1, ctxAt(when)).state

describe('regole di base', () => {
  it('disattivate o senza profilo: nessuna notifica', () => {
    const s = setup()
    expect(plan(updateSettings(s, { notifications: { enabled: false } }))).toEqual([])
    expect(plan({ ...s, profile: null })).toEqual([])
  })

  it('7 giorni x (mattina + sera), orari di default 09:00 e 20:30, ordinate nel tempo', () => {
    const full = plan(setup())
    // + il ritorno a 7 giorni, che cade fuori dall'orizzonte di pianificazione
    expect(full).toHaveLength(15)
    const list = full.filter((n) => dayOf(n) < '2026-11-11')
    expect(list).toHaveLength(14)
    expect(list.filter((n) => n.slot !== 'comeback').map((n) => n.slot)).toContain('evening')
    expect(list[0]!.at).toEqual(at(2026, 11, 4, 9, 0))
    expect(list[1]!.at).toEqual(at(2026, 11, 4, 20, 30))
    expect([...list].sort((a, b) => a.at.getTime() - b.at.getTime())).toEqual(list)
    expect(list.every((n) => n.route === '/' && n.title === 'Eroe valdo')).toBe(true)
  })

  it('max 2 al giorno e id unici, deterministici e in int32', () => {
    const list = plan(setup([daily('A'), weekly('W'), monthly('M')]))
    const perDay = new Map<string, number>()
    for (const n of list) perDay.set(dayOf(n), (perDay.get(dayOf(n)) ?? 0) + 1)
    expect(Math.max(...perDay.values())).toBeLessThanOrEqual(2)
    expect(new Set(list.map((n) => n.id)).size).toBe(list.length)
    expect(list.every((n) => Number.isInteger(n.id) && n.id < 2 ** 31)).toBe(true)
    expect(notificationId('2026-11-04', 'morning')).toBe(202611041)
    expect(list[0]!.id).toBe(202611041)
  })

  it('e\' una funzione pura e idempotente', () => {
    const s = setup()
    expect(plan(s)).toEqual(plan(s))
  })

  it('orari sempre entro 08:00-22:00', () => {
    const s = updateSettings(setup(), { notifications: { morningTime: '05:15', eveningTime: '23:45' } })
    const list = plan(s)
    for (const n of list) {
      const minutes = n.at.getHours() * 60 + n.at.getMinutes()
      expect(minutes).toBeGreaterThanOrEqual(8 * 60)
      expect(minutes).toBeLessThanOrEqual(22 * 60)
    }
    expect(timeOnDay('2026-11-04', '05:15')).toEqual(at(2026, 11, 4, 8, 0))
    expect(timeOnDay('2026-11-04', '23:45')).toEqual(at(2026, 11, 4, 22, 0))
  })

  it('orari non validi nelle impostazioni vengono ignorati', () => {
    const s = updateSettings(setup(), { notifications: { morningTime: '25:99', eveningTime: 'boh' } })
    expect(s.settings.notifications).toMatchObject({ morningTime: '09:00', eveningTime: '20:30' })
  })

  it('niente nel passato: a sera tarda quelle di oggi non ci sono', () => {
    const late = at(2026, 11, 4, 22, 30)
    const list = plan(setup([daily('A')], late), late)
    expect(list.every((n) => n.at.getTime() > late.getTime())).toBe(true)
    expect(slotsOf(list, '2026-11-04')).toEqual([])
  })

  it('senza daily non ci sono mattina ne sera', () => {
    const list = plan(setup([weekly('W')]))
    expect(list.some((n) => n.slot === 'morning' || n.slot === 'evening')).toBe(false)
  })

  it('ogni tipo di notifica si puo\' spegnere', () => {
    const s = setup([daily('A'), weekly('W')])
    const off = updateSettings(s, { notifications: { weeklyMonthly: false, streakRisk: false, comeback: false } })
    expect(plan(off).every((n) => n.slot === 'morning' || n.slot === 'evening')).toBe(true)
  })
})

describe('completamento: la serale di oggi sparisce', () => {
  it('tutte le daily fatte oggi -> niente sera di oggi, ma domani si', () => {
    let s = setup([daily('A'), daily('B')])
    expect(slotsOf(plan(s), '2026-11-04')).toEqual(['morning', 'evening'])
    s = complete(s, 'A', WED)
    expect(slotsOf(plan(s), '2026-11-04')).toEqual(['morning', 'evening']) // ne manca una
    s = complete(s, 'B', WED)
    const list = plan(s)
    expect(slotsOf(list, '2026-11-04')).toEqual(['morning'])
    expect(slotsOf(list, '2026-11-05')).toEqual(['morning', 'evening'])
  })

  it('undo: la serale ricompare (il re-plan e\' la sola cosa che serve)', () => {
    let s = setup([daily('A')])
    s = complete(s, 'A', WED)
    expect(slotsOf(plan(s), '2026-11-04')).toEqual(['morning'])
    s = progressQuest(s, s.quests[0]!.id, -1, ctxAt(WED)).state
    expect(slotsOf(plan(s), '2026-11-04')).toEqual(['morning', 'evening'])
  })
})

describe('streak a rischio', () => {
  const streakState = (days: number): AppState => {
    let s = setup([daily('A')], at(2026, 10, 1))
    for (let i = days; i >= 1; i--) s = complete(s, 'A', new Date(2026, 10, 4 - i, 12)) // fino a ieri
    return touchOpen(s, WED)
  }

  it('streak >= 3 e nessuna daily oggi -> slot streak_risk alle 21:00 con {n}', () => {
    const list = plan(streakState(4))
    const today = list.filter((n) => dayOf(n) === '2026-11-04')
    expect(today.map((n) => n.slot)).toEqual(['morning', 'streak_risk'])
    expect(today[1]!.at).toEqual(at(2026, 11, 4, 21, 0))
    expect(today[1]!.body).toContain('4')
    expect(today[1]!.body).toContain('Enrico')
  })

  it('streak di 2 giorni: sera normale', () => {
    expect(slotsOf(plan(streakState(2)), '2026-11-04')).toEqual(['morning', 'evening'])
  })

  it('con l\'opzione spenta: sera normale', () => {
    const s = updateSettings(streakState(4), { notifications: { streakRisk: false } })
    expect(slotsOf(plan(s), '2026-11-04')).toEqual(['morning', 'evening'])
  })

  it('oggi fatto: domani sera a rischio (non lo e\' dopodomani: la striscia sarebbe gia\' rotta)', () => {
    const s = complete(streakState(4), 'A', WED)
    const list = plan(s)
    expect(slotsOf(list, '2026-11-04')).toEqual(['morning']) // tutte fatte: serale di oggi cancellata
    expect(slotsOf(list, '2026-11-05')).toEqual(['morning', 'streak_risk'])
    expect(slotsOf(list, '2026-11-06')).toEqual(['morning', 'evening'])
  })

  it('con uno scudo la striscia sopravvive a un giorno saltato', () => {
    let s = setup([daily('A')], at(2026, 10, 1))
    for (let d = 28; d <= 34; d++) s = complete(s, 'A', new Date(2026, 9, d, 12)) // 7 giorni -> 1 scudo
    s = touchOpen(s, WED) // 4 nov: salti 4 nov? oggi non ancora fatto, ultimo giorno attivo 3 nov
    const list = plan(s)
    expect(slotsOf(list, '2026-11-04')).toContain('streak_risk')
    expect(slotsOf(list, '2026-11-05')).toContain('streak_risk') // lo scudo copre oggi
    expect(slotsOf(list, '2026-11-06')).not.toContain('streak_risk') // senza altri scudi si azzera
  })
})

describe('riepiloghi settimanali e mensili', () => {
  it('domenica sera: weekly se ci sono settimanali incomplete; lunedi\' mattina: nuova settimana', () => {
    const list = plan(setup([daily('A'), weekly('W')]))
    expect(weekdayOf('2026-11-08')).toBe(0)
    expect(slotsOf(list, '2026-11-08')).toEqual(['morning', 'weekly'])
    expect(list.find((n) => n.slot === 'weekly' && dayOf(n) === '2026-11-08')!.at).toEqual(at(2026, 11, 8, 20, 30))
    expect(slotsOf(list, '2026-11-09')).toEqual(['weekly', 'evening']) // la mattina diventa "nuova settimana"
  })

  it('settimanale gia\' completata questa settimana: domenica sera e\' una sera normale', () => {
    let s = setup([daily('A'), weekly('W')])
    s = complete(s, 'W', WED)
    expect(slotsOf(plan(s), '2026-11-08')).toEqual(['morning', 'evening'])
    // ma la settimana dopo e' di nuovo da fare
    const later = plan(s, at(2026, 11, 9, 7))
    expect(later.some((n) => n.slot === 'weekly')).toBe(true)
  })

  it('ultimi 3 giorni del mese: monthly se incompleta; primo del mese: mattina monthly', () => {
    const now = at(2026, 11, 27, 7)
    const base = setup([daily('A'), monthly('M')], now)
    const list = plan(updateSettings(base, { notifications: { comeback: false } }), now)
    expect(daysUntilMonthEnd('2026-11-28')).toBe(2)
    expect(slotsOf(list, '2026-11-27')).toEqual(['morning', 'evening'])
    expect(slotsOf(list, '2026-11-28')).toEqual(['morning', 'monthly'])
    expect(slotsOf(list, '2026-11-30')).toEqual(['morning', 'monthly'])
    expect(slotsOf(list, '2026-12-01')).toEqual(['monthly', 'evening']) // primo del mese
  })

  it('priorita\': weekly batte monthly la domenica sera', () => {
    const now = at(2026, 11, 27, 7)
    const list = plan(setup([daily('A'), weekly('W'), monthly('M')], now), now)
    expect(weekdayOf('2026-11-29')).toBe(0)
    expect(slotsOf(list, '2026-11-29')).toEqual(['morning', 'weekly'])
  })
})

describe('ritorno (comeback)', () => {
  it('a +3 e +7 giorni dall\'ultima apertura, poi stop; sostituisce la mattina', () => {
    const list = plan(setup())
    const comebacks = list.filter((n) => n.slot === 'comeback')
    expect(comebacks.map(dayOf)).toEqual(['2026-11-07', '2026-11-11'])
    expect(comebacks.every((n) => n.at.getHours() === 9)).toBe(true)
    expect(slotsOf(list, '2026-11-07')).toEqual(['comeback', 'evening'])
    expect(list.some((n) => dayOf(n) > '2026-11-11')).toBe(false)
  })

  it('aprire l\'app sposta il ritorno in avanti (si annulla all\'apertura)', () => {
    const s = setup()
    const later = at(2026, 11, 6, 8)
    const reopened = touchOpen(s, later)
    const comebacks = plan(reopened, later).filter((n) => n.slot === 'comeback')
    expect(comebacks.map(dayOf)).toEqual(['2026-11-09', '2026-11-13'])
  })

  it('spento nelle impostazioni -> nessun ritorno', () => {
    const s = updateSettings(setup(), { notifications: { comeback: false } })
    expect(plan(s).some((n) => n.slot === 'comeback')).toBe(false)
  })
})

describe('varianti dei testi', () => {
  it('scelta deterministica e mai la stessa frase in due giorni consecutivi (tutti i pool reali)', () => {
    for (const id of CHARACTER_IDS) {
      for (const key of ['morning', 'evening', 'streak', 'comeback', 'weekly', 'monthly'] as PoolKey[]) {
        const count = notificationTexts.variants(id, key).length
        let day = '2026-01-01'
        let prev = -1
        for (let i = 0; i < 400; i++) {
          const idx = pickVariantIndex(count, id, key, day)
          expect(idx).toBeGreaterThanOrEqual(0)
          expect(idx).toBeLessThan(count)
          expect(pickVariantIndex(count, id, key, day)).toBe(idx)
          expect(idx).not.toBe(prev)
          prev = idx
          day = addDays(day, 1)
        }
      }
    }
  })

  it('i pool vengono percorsi in modo ampio (nessuna frase dimenticata)', () => {
    const seen = new Set<number>()
    let day = '2026-01-01'
    for (let i = 0; i < 30; i++) {
      seen.add(pickVariantIndex(10, 'valdo', 'morning', day))
      day = addDays(day, 1)
    }
    expect(seen.size).toBe(10)
  })

  it('ogni eroe ha almeno 10 varianti per ognuno dei 7 slot', () => {
    for (const id of CHARACTER_IDS) {
      for (const key of ['morning', 'evening', 'streak', 'comeback', 'weekly', 'monthly', 'levelup'] as PoolKey[]) {
        expect(notificationTexts.variants(id, key).length, `${id}.${key}`).toBeGreaterThanOrEqual(10)
      }
    }
  })

  it('testi sani: nessun duplicato, lunghezza adatta a una notifica, segnaposto ammessi, streak con {n}', () => {
    const problems: string[] = []
    for (const id of CHARACTER_IDS) {
      for (const key of ['morning', 'evening', 'streak', 'comeback', 'weekly', 'monthly', 'levelup'] as PoolKey[]) {
        const list = notificationTexts.variants(id, key)
        if (new Set(list).size !== list.length) problems.push(`${id}.${key}: duplicati`)
        list.forEach((text, i) => {
          if (text.length < 8 || text.length > 130) problems.push(`${id}.${key}[${i}]: lunghezza ${text.length}`)
          const unknown = [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((p) => p !== 'n' && p !== 'name')
          if (unknown.length) problems.push(`${id}.${key}[${i}]: segnaposto ${unknown.join()}`)
          if (key === 'streak' && !text.includes('{n}')) problems.push(`${id}.streak[${i}]: manca {n}`)
          if (key !== 'streak' && text.includes('{n}')) problems.push(`${id}.${key}[${i}]: {n} fuori da streak`)
        })
      }
    }
    expect(problems).toEqual([])
  })

  it('Kuro non usa mai esclamativi (spec §5); l\'Unita\' 404 prefissa sempre con >', () => {
    for (const key of ['morning', 'evening', 'streak', 'comeback', 'weekly', 'monthly', 'levelup'] as PoolKey[]) {
      for (const t of notificationTexts.variants('kuro', key)) expect(t).not.toContain('!')
      for (const t of notificationTexts.variants('u404', key)) expect(t.startsWith('> ')).toBe(true)
    }
  })

  it('i primi testi sono i campioni di tono della spec', () => {
    expect(notificationTexts.variants('valdo', 'morning')[0]).toBe('Alba sul regno, prode! Le missioni di oggi attendono il tuo valore.')
    expect(notificationTexts.variants('kuro', 'evening')[0]).toBe("L'ombra cala. Ne resta una.")
    expect(notificationTexts.variants('lumen', 'streak')[0]).toBe('Hai costruito {n} giorni di luce. Ne basta uno piccolo anche stasera.')
  })

  it('il piano usa i testi reali e riempie {n}', () => {
    const real = plan(setup(), WED, notificationTexts)
    expect(real.every((n) => n.body.length > 0 && !n.body.includes('{'))).toBe(true)
    expect(levelUpLine('valdo' as CharacterId, 5).length).toBeGreaterThan(5)
  })

  it('pool vuoto per uno slot: la notifica viene saltata, non inventata', () => {
    const empty: NotificationTexts = { title: () => 'X', variants: () => [] }
    expect(plan(setup(), WED, empty)).toEqual([])
  })
})

describe('sfx (dati)', () => {
  it('ogni effetto ha note valide e dura meno di 1,5 s', () => {
    for (const name of Object.keys(SFX) as SfxName[]) {
      expect(SFX[name].length).toBeGreaterThan(0)
      for (const n of SFX[name]) {
        expect(n.freq).toBeGreaterThan(50)
        expect(n.dur).toBeGreaterThan(0)
        expect(n.gain).toBeGreaterThan(0)
        expect(n.gain).toBeLessThanOrEqual(0.2)
      }
      expect(sfxDuration(name)).toBeLessThan(1.5)
    }
  })
})
