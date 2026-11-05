import { describe, expect, it } from 'vitest'
import { addDays, dayDiff, dayKey, isoWeekKey, monthKey, periodKey, weekKey } from '../../core/periods'

describe('fuso dei test', () => {
  it('e\' Europe/Rome (ora legale attiva in luglio, +2h)', () => {
    expect(new Date(2026, 6, 1, 12).getTimezoneOffset()).toBe(-120)
    expect(new Date(2026, 0, 1, 12).getTimezoneOffset()).toBe(-60)
  })
})

describe('dayKey', () => {
  it('il giorno cambia alle 04:00 locali', () => {
    expect(dayKey(new Date(2026, 10, 4, 3, 59))).toBe('2026-11-03')
    expect(dayKey(new Date(2026, 10, 4, 4, 0))).toBe('2026-11-04')
    expect(dayKey(new Date(2026, 10, 4, 23, 59))).toBe('2026-11-04')
  })

  it('passaggio mezzanotte -> 04:00 appartiene ancora al giorno prima', () => {
    expect(dayKey(new Date(2026, 10, 5, 0, 0))).toBe('2026-11-04')
    expect(dayKey(new Date(2026, 10, 5, 1, 30))).toBe('2026-11-04')
  })

  it('rispetta dayStartHour configurabile', () => {
    expect(dayKey(new Date(2026, 10, 4, 5, 0), 6)).toBe('2026-11-03')
    expect(dayKey(new Date(2026, 10, 4, 0, 0), 0)).toBe('2026-11-04')
  })

  it('cambio anno e mese', () => {
    expect(dayKey(new Date(2027, 0, 1, 2, 0))).toBe('2026-12-31')
    expect(dayKey(new Date(2026, 2, 1, 3, 0))).toBe('2026-02-28')
  })

  it('ora legale primaverile (29 mar 2026, 02:00 -> 03:00): nessun salto di giorno', () => {
    expect(dayKey(new Date(2026, 2, 29, 1, 59))).toBe('2026-03-28')
    expect(dayKey(new Date(2026, 2, 29, 3, 30))).toBe('2026-03-28') // 03:30 < 04:00
    expect(dayKey(new Date(2026, 2, 29, 4, 0))).toBe('2026-03-29')
    expect(dayKey(new Date(2026, 2, 30, 4, 0))).toBe('2026-03-30')
  })

  it('ora legale autunnale (25 ott 2026, 03:00 -> 02:00): il giorno dura 25 ore ma la chiave e\' una sola', () => {
    expect(dayKey(new Date(2026, 9, 25, 12, 0))).toBe('2026-10-25')
    expect(dayKey(new Date(2026, 9, 26, 3, 59))).toBe('2026-10-25')
    expect(dayKey(new Date(2026, 9, 26, 4, 0))).toBe('2026-10-26')
  })
})

describe('addDays / dayDiff (UTC, a prova di DST)', () => {
  it('attraversa i cambi d\'ora senza saltare ne ripetere giorni', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30')
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('dayDiff', () => {
    expect(dayDiff('2026-03-28', '2026-03-30')).toBe(2)
    expect(dayDiff('2026-10-26', '2026-10-24')).toBe(-2)
    expect(dayDiff('2026-01-01', '2027-01-01')).toBe(365)
  })
})

describe('chiavi di periodo', () => {
  it('4 nov 2026 e\' in W45 (esempio della spec)', () => {
    expect(isoWeekKey('2026-11-04')).toBe('2026-W45')
  })

  it('settimana ISO da lunedi\' a domenica', () => {
    expect(isoWeekKey('2026-11-02')).toBe('2026-W45') // lunedi'
    expect(isoWeekKey('2026-11-08')).toBe('2026-W45') // domenica
    expect(isoWeekKey('2026-11-09')).toBe('2026-W46')
  })

  it('casi limite di anno ISO', () => {
    expect(isoWeekKey('2026-01-01')).toBe('2026-W01')
    expect(isoWeekKey('2027-01-01')).toBe('2026-W53')
    expect(isoWeekKey('2024-12-30')).toBe('2025-W01')
    expect(isoWeekKey('2021-01-03')).toBe('2020-W53')
  })

  it('weekKey/monthKey/periodKey usano il giorno logico', () => {
    const lateSunday = new Date(2026, 10, 9, 2, 0) // lun 9 nov, 02:00 -> ancora dom 8
    expect(weekKey(lateSunday)).toBe('2026-W45')
    expect(monthKey(new Date(2026, 11, 1, 3, 0))).toBe('2026-11')
    expect(periodKey('daily', new Date(2026, 10, 4, 10))).toBe('2026-11-04')
    expect(periodKey('weekly', new Date(2026, 10, 4, 10))).toBe('2026-W45')
    expect(periodKey('monthly', new Date(2026, 10, 4, 10))).toBe('2026-11')
  })
})
