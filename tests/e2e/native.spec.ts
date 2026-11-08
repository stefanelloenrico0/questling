import { expect, test, type Page } from '@playwright/test'
import { installNativeMock, nativeCalls, scheduledNotifications } from './native-mock'

// Questi test girano con un bridge Capacitor SIMULATO: verificano cosa l'app chiederebbe al telefono.
// Non sostituiscono la prova su un dispositivo reale (riavvio, risparmio energetico, ora legale...).

const VALDO_ANSWERS = [0, 3, 0, 0, 0, 3, 0, 0]
// mercoledi' 4 novembre 2026, 07:00 (fuso dei test: Europe/Rome)
const NOW = new Date('2026-11-04T06:00:00Z')

async function onboard(page: Page, notify: 'notify-enable' | 'notify-skip'): Promise<void> {
  await page.goto('/')
  await page.getByTestId('splash-start').click()
  await page.getByTestId('intro-skip').click()
  for (const a of VALDO_ANSWERS) await page.getByTestId(`quiz-answer-${a}`).click()
  await page.getByTestId('reveal-confirm').click()
  await page.getByTestId('name-input').fill('Enrico')
  await page.getByTestId('name-next').click()
  await page.getByTestId('focus-next').click()
  await page.getByTestId('onboarding-finish').click()
  await page.getByTestId('rhythm-next').click()
  await page.getByTestId(notify).click()
  await page.getByTestId('ready-start').click()
  await expect(page.getByTestId('page-today')).toBeVisible()
}

async function boot(page: Page, mock: Parameters<typeof installNativeMock>[1]): Promise<void> {
  await page.clock.setFixedTime(NOW)
  await installNativeMock(page, mock)
}

const lastSchedule = async (page: Page) => {
  const calls = await nativeCalls(page, 'LocalNotifications', 'schedule')
  return (calls.at(-1)?.options?.notifications ?? []) as { id: number; title: string; body: string }[]
}

test.describe('percorso nativo (bridge simulato)', () => {
  test('permesso concesso: canale Android, allarmi INESATTI, max 2 al giorno, orari 08-22', async ({ page }) => {
    await boot(page, { permission: 'prompt', requestResult: 'granted' })
    await onboard(page, 'notify-enable')

    await expect.poll(async () => (await nativeCalls(page, 'LocalNotifications', 'schedule')).length).toBeGreaterThan(0)
    const requests = await nativeCalls(page, 'LocalNotifications', 'requestPermissions')
    expect(requests).toHaveLength(1) // il permesso si chiede UNA volta, al momento contestuale

    const channel = (await nativeCalls(page, 'LocalNotifications', 'createChannel'))[0]
    expect(channel?.options).toMatchObject({ id: 'reminders', importance: 3 })

    const scheduled = await scheduledNotifications(page)
    // 7 giorni x (mattina + sera) + ritorno a +7 giorni (fuori orizzonte); quello a +3 sostituisce la mattina
    expect(scheduled.length).toBe(15)
    expect(new Set(scheduled.map((n) => n.id)).size).toBe(scheduled.length)
    for (const n of scheduled) {
      expect(n.isExactNotification).toBe(false) // niente "Sveglie e promemoria" su Android 12+
      expect(n.schedule.allowWhileIdle).toBe(true)
      expect(n.channelId).toBe('reminders')
      expect(n.title).toBe('Ser Valdo')
      expect(n.body.length).toBeGreaterThan(5)
      expect(n.body).not.toContain('{')
      expect(n.extra?.route).toBe('/')
      const at = new Date(n.schedule.at)
      const minutes = at.getUTCHours() * 60 + at.getUTCMinutes() + 60 // Rome = UTC+1 a novembre
      expect(minutes).toBeGreaterThanOrEqual(8 * 60)
      expect(minutes).toBeLessThanOrEqual(22 * 60)
    }
    const perDay = new Map<string, number>()
    for (const n of scheduled) {
      const day = n.schedule.at.slice(0, 10)
      perDay.set(day, (perDay.get(day) ?? 0) + 1)
    }
    expect(Math.max(...perDay.values())).toBeLessThanOrEqual(2)
    expect(scheduled[0]).toMatchObject({ id: 202611041 }) // mattina del 4 nov
    expect(new Date(scheduled[0]!.schedule.at).toISOString()).toBe('2026-11-04T08:00:00.000Z') // 09:00 locali
  })

  test('completare tutte le daily: il piano viene rifatto e la serale di oggi sparisce', async ({ page }) => {
    await boot(page, { permission: 'granted' })
    await onboard(page, 'notify-enable')
    await expect.poll(async () => (await nativeCalls(page, 'LocalNotifications', 'schedule')).length).toBe(1)
    const before = await lastSchedule(page)
    expect(before.map((n) => n.id)).toContain(202611042) // sera di oggi

    for (const re of [/Allenamento/, /Letto rifatto/, /gesto gentile/]) await page.getByRole('checkbox', { name: re }).click()
    await expect.poll(async () => (await nativeCalls(page, 'LocalNotifications', 'schedule')).length).toBeGreaterThan(1)

    const after = await lastSchedule(page)
    expect(after.map((n) => n.id)).not.toContain(202611042) // serale di oggi cancellata
    expect(after.map((n) => n.id)).toContain(202611051) // domani resta
    // e prima di riprogrammare ha cancellato il pendente
    const cancels = await nativeCalls(page, 'LocalNotifications', 'cancel')
    expect(cancels.length).toBeGreaterThan(0)
    const pending = await page.evaluate(() => window.__native.pending)
    expect(pending).not.toContain(202611042)
    expect(new Set(pending).size).toBe(pending.length) // nessun duplicato dopo piu' riprogrammazioni
  })

  test('permesso negato: l\'app funziona uguale, niente notifiche, invito discreto in Impostazioni', async ({ page }) => {
    await boot(page, { permission: 'prompt', requestResult: 'denied' })
    await onboard(page, 'notify-enable')
    await page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await expect(page.getByTestId('xp-text')).toContainText('10/50 XP')
    await page.waitForTimeout(1500)
    expect(await nativeCalls(page, 'LocalNotifications', 'schedule')).toHaveLength(0)

    await page.getByRole('link', { name: 'Impostazioni' }).click()
    await expect(page.getByTestId('notif-enable')).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByTestId('notif-denied')).toBeVisible()
    await page.getByTestId('notif-enable').click() // riprova: il sistema nega ancora, resta spento
    await expect(page.getByTestId('notif-enable')).toHaveAttribute('aria-checked', 'false')
  })

  test('rifiutato in onboarding e attivato dopo: chiede il permesso e programma', async ({ page }) => {
    await boot(page, { permission: 'prompt', requestResult: 'granted' })
    await onboard(page, 'notify-skip')
    expect(await nativeCalls(page, 'LocalNotifications', 'requestPermissions')).toHaveLength(0)
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    await expect(page.getByTestId('notif-ask')).toBeVisible()
    await page.getByTestId('notif-enable').click()
    await expect(page.getByTestId('notif-enable')).toHaveAttribute('aria-checked', 'true')
    await expect.poll(async () => (await nativeCalls(page, 'LocalNotifications', 'schedule')).length).toBeGreaterThan(0)
  })

  test('spegnere i promemoria cancella tutto il pendente', async ({ page }) => {
    await boot(page, { permission: 'granted' })
    await onboard(page, 'notify-enable')
    await expect.poll(async () => (await page.evaluate(() => window.__native.pending)).length).toBeGreaterThan(0)
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    await page.getByTestId('notif-enable').click()
    await expect(page.getByTestId('notif-enable')).toHaveAttribute('aria-checked', 'false')
    await expect.poll(async () => (await page.evaluate(() => window.__native.pending)).length).toBe(0)
  })

  test('cambiare l\'orario della mattina riprogramma con il nuovo orario', async ({ page }) => {
    await boot(page, { permission: 'granted' })
    await onboard(page, 'notify-enable')
    await expect.poll(async () => (await scheduledNotifications(page)).length).toBeGreaterThan(0)
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    // 07:30 e' fuori dalla fascia 08:00-22:00: viene portato alle 08:00
    await page.getByTestId('notif-morning').fill('07:30')
    await expect.poll(async () => (await nativeCalls(page, 'LocalNotifications', 'schedule')).length).toBeGreaterThan(1)
    let mornings = (await scheduledNotifications(page)).filter((n) => n.id === 202611051)
    expect(new Date(mornings.at(-1)!.schedule.at).toISOString()).toBe('2026-11-05T07:00:00.000Z') // 08:00 locali
    // 10:15 viene rispettato
    const calls = (await nativeCalls(page, 'LocalNotifications', 'schedule')).length
    await page.getByTestId('notif-morning').fill('10:15')
    await expect.poll(async () => (await nativeCalls(page, 'LocalNotifications', 'schedule')).length).toBeGreaterThan(calls)
    mornings = (await scheduledNotifications(page)).filter((n) => n.id === 202611051)
    expect(new Date(mornings.at(-1)!.schedule.at).toISOString()).toBe('2026-11-05T09:15:00.000Z') // 10:15 locali
  })

  test('toccare una notifica apre la route indicata', async ({ page }) => {
    await boot(page, { permission: 'granted' })
    await onboard(page, 'notify-enable')
    await expect.poll(async () => (await nativeCalls(page, 'LocalNotifications', 'addListener')).length).toBeGreaterThan(0)
    await page.evaluate(() =>
      window.__native.emit('LocalNotifications', 'localNotificationActionPerformed', {
        actionId: 'tap',
        notification: { id: 1, extra: { route: '/quests' } },
      }),
    )
    await expect(page).toHaveURL(/#\/quests/)
  })

  test('haptics: impatto leggero al completamento, "success" al level-up', async ({ page }) => {
    await boot(page, { permission: 'granted' })
    await onboard(page, 'notify-skip')
    await page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await expect.poll(async () => (await nativeCalls(page, 'Haptics', 'impact')).length).toBe(1)
    expect((await nativeCalls(page, 'Haptics', 'impact'))[0]?.options).toMatchObject({ style: 'LIGHT' })

    // un'impresa mensile hard (240 XP) porta al Lv 3
    await page.getByRole('link', { name: 'Missioni' }).click()
    await page.getByRole('radio', { name: 'Mese' }).click()
    await page.getByTestId('quest-add').click()
    await page.getByTestId('quest-title').fill('Impresa')
    await page.getByRole('radio', { name: 'Difficile' }).click()
    await page.getByTestId('quest-save').click()
    await page.getByRole('link', { name: 'Oggi' }).click()
    await page.getByRole('button', { name: 'Aggiungi un progresso a Impresa' }).click()
    await expect(page.getByTestId('levelup')).toBeVisible()
    await expect.poll(async () => (await nativeCalls(page, 'Haptics', 'notification')).length).toBe(1)
    expect((await nativeCalls(page, 'Haptics', 'notification'))[0]?.options).toMatchObject({ type: 'SUCCESS' })
  })

  test('haptics spenti: nessuna vibrazione', async ({ page }) => {
    await boot(page, { permission: 'granted' })
    await onboard(page, 'notify-skip')
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    await page.getByRole('switch', { name: /Vibrazione/ }).click()
    await page.getByRole('link', { name: 'Oggi' }).click()
    await page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await expect(page.getByTestId('xp-text')).toContainText('10/50 XP')
    expect(await nativeCalls(page, 'Haptics', 'impact')).toHaveLength(0)
  })

  test('il rientro in primo piano non rompe nulla e ripianifica senza duplicati', async ({ page }) => {
    await boot(page, { permission: 'granted' })
    await onboard(page, 'notify-enable')
    await expect.poll(async () => (await page.evaluate(() => window.__native.pending)).length).toBeGreaterThan(0)
    await page.evaluate(() => {
      window.__native.emit('App', 'appStateChange', { isActive: false })
      window.__native.emit('App', 'appStateChange', { isActive: true })
    })
    await page.waitForTimeout(1500)
    const pending = await page.evaluate(() => window.__native.pending)
    expect(new Set(pending).size).toBe(pending.length)
    expect(pending.length).toBe(15)
  })

  test('nessun errore in console nel percorso nativo', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text())
    })
    await boot(page, { permission: 'prompt', requestResult: 'granted' })
    await onboard(page, 'notify-enable')
    for (const link of ['Missioni', 'Eroe', 'Statistiche', 'Impostazioni', 'Oggi']) await page.getByRole('link', { name: link }).click()
    await page.waitForTimeout(1000)
    expect(errors).toEqual([])
  })
})
