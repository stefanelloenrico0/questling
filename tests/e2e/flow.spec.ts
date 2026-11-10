import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

// Risposte che portano a Ser Valdo (O+ M- S+ A+): indici ORIGINALI delle risposte.
const VALDO_ANSWERS = [0, 3, 0, 0, 0, 3, 0, 0]

async function onboard(page: Page, name = 'Enrico', notify: 'notify-skip' | 'notify-enable' = 'notify-skip'): Promise<void> {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/onboarding/)
  await page.getByTestId('splash-start').click()
  await page.getByTestId('intro-skip').click()
  for (const a of VALDO_ANSWERS) await page.getByTestId(`quiz-answer-${a}`).click()
  await expect(page.getByTestId('reveal-name')).toHaveText('Ser Valdo')
  await expect(page.getByTestId('reveal-affinity')).toContainText('100%')
  await page.getByTestId('reveal-confirm').click()
  await page.getByTestId('name-input').fill(name)
  await page.getByTestId('name-next').click()
  await page.getByTestId('focus-next').click()
  await expect(page.getByTestId('suggested-item')).toHaveCount(4)
  await page.getByTestId('onboarding-finish').click()
  await page.getByTestId('rhythm-next').click()
  // permesso notifiche: contestuale, DOPO le prime missioni e nella voce dell'eroe
  await expect(page.getByTestId('step-notify')).toBeVisible()
  await expect(page.getByTestId('notify-voice')).toContainText('Prode')
  await page.getByTestId(notify).click()
  await expect(page.getByTestId('step-ready')).toBeVisible()
  await page.getByTestId('ready-start').click()
  await expect(page.getByTestId('page-today')).toBeVisible()
}

const xpText = (page: Page) => page.getByTestId('xp-text')

/** XP totali minimi per un livello (stessa curva di core/levels.ts). */
const xpForLevel = (level: number): number => {
  let sum = 0
  for (let l = 1; l < level; l++) sum += Math.round(50 * l ** 1.1)
  return sum
}

/** Aggiunge XP allo stato salvato PRIMA che l'app lo carichi, poi ricarica. */
async function boostXp(page: Page, xp: number): Promise<void> {
  await page.addInitScript((delta) => {
    const key = 'CapacitorStorage.questling:v1:state'
    const raw = localStorage.getItem(key)
    if (!raw || localStorage.getItem('boosted')) return
    const state = JSON.parse(raw)
    state.xpEvents.push({ id: 'E2EBOOST', at: new Date().toISOString(), delta, reason: 'adjustment' })
    localStorage.setItem(key, JSON.stringify(state))
    localStorage.setItem('boosted', '1')
  }, xp)
  await page.reload()
  await page.getByRole('link', { name: 'Oggi' }).click()
  await expect(page.getByTestId('page-today')).toBeVisible()
}

test.describe('MVP: primo avvio -> Oggi, senza account', () => {
  test('onboarding completo con quiz, poi completa/annulla e persistenza', async ({ page }) => {
    await onboard(page)

    await expect(page.getByTestId('hero-name')).toHaveText('Ser Valdo')
    await expect(page.getByTestId('level-line')).toContainText('Lv 1 · Scudiero')
    await expect(page.getByTestId('quest-row')).toHaveCount(3) // 3 daily pre-selezionate, la settimanale no
    await expect(xpText(page)).toContainText('0/50 XP')

    const allenamento = page.getByRole('checkbox', { name: /Allenamento di 20 min/ })
    await allenamento.click()
    await expect(allenamento).toHaveAttribute('aria-checked', 'true')
    await expect(xpText(page)).toContainText('10/50 XP')

    // persiste dopo aver chiuso/riaperto l'app
    await page.reload()
    await expect(page.getByTestId('page-today')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /Allenamento di 20 min/ })).toHaveAttribute('aria-checked', 'true')
    await expect(xpText(page)).toContainText('10/50 XP')

    // annulla -> XP ritirati
    await page.getByRole('checkbox', { name: /Allenamento di 20 min/ }).click()
    await expect(xpText(page)).toContainText('0/50 XP')
  })

  test('tutte le daily fatte -> bonus +10 e frase "fatto" dell\'eroe; l\'undo lo ritira', async ({ page }) => {
    await onboard(page)
    for (const re of [/Allenamento/, /Letto rifatto/, /gesto gentile/]) {
      await page.getByRole('checkbox', { name: re }).click()
    }
    // 10 + 5 + 5 + bonus 10
    await expect(xpText(page)).toContainText('30/50 XP')
    await expect(page.getByTestId('balloon')).toContainText('Ogni missione è compiuta')
    await page.getByRole('checkbox', { name: /gesto gentile/ }).click()
    await expect(xpText(page)).toContainText('15/50 XP') // 10 + 5, senza bonus (-5 della missione, -10 del bonus)
  })

  test('missione mensile hard -> level-up con modale; cambiare eroe non altera XP/livello', async ({ page }) => {
    await onboard(page)

    await page.getByRole('link', { name: 'Missioni' }).click()
    await page.getByRole('radio', { name: 'Mese' }).click()
    await page.getByTestId('quest-add').click()
    await page.getByTestId('quest-title').fill('Impresa epica')
    await page.getByRole('radio', { name: 'Difficile' }).click()
    await page.getByTestId('quest-save').click()
    await expect(page.getByTestId('quest-item')).toHaveCount(1)

    await page.getByRole('link', { name: 'Oggi' }).click()
    await page.getByRole('button', { name: 'Aggiungi un progresso a Impresa epica' }).click()
    // hard x12 = 240 XP -> Lv 3
    await expect(page.getByTestId('levelup')).toBeVisible()
    await expect(page.getByTestId('levelup-line')).not.toBeEmpty() // frase dell'eroe
    await page.getByRole('button', { name: 'Avanti' }).click()
    await expect(page.getByTestId('level-line')).toContainText('Lv 3')
    const before = await xpText(page).innerText()

    await page.getByRole('link', { name: 'Eroe' }).click()
    await page.getByTestId('hero-change').click()
    await page.getByRole('radio', { name: 'Kuro' }).click()
    await page.getByTestId('hero-change-confirm').click()
    await expect(page.getByRole('heading', { name: 'Kuro', level: 1 })).toBeVisible()

    await page.getByRole('link', { name: 'Oggi' }).click()
    await expect(page.getByTestId('hero-name')).toHaveText('Kuro')
    await expect(page.getByTestId('level-line')).toContainText('Lv 3')
    expect(await xpText(page).innerText()).toBe(before)
  })

  test('capitoli bloccati finche\' il livello non basta', async ({ page }) => {
    await onboard(page)
    await page.getByRole('link', { name: 'Eroe' }).click()
    await expect(page.getByTestId('chapter-1')).toContainText('scudiero più sbadato')
    await expect(page.getByTestId('chapter-2')).toContainText('Si sblocca al livello 5')
  })

  test('eroi sbloccabili: misteriosi all\'inizio, scegliibili dal livello 10', async ({ page }) => {
    await onboard(page)
    await page.getByRole('link', { name: 'Eroe' }).click()
    await page.getByTestId('hero-change').click()
    const salmastro = page.getByTestId('hero-card-salmastro')
    await expect(salmastro).toBeDisabled()
    await expect(salmastro).toContainText('Eroe misterioso')
    await expect(salmastro).toContainText('livello 10 (ora 1)')
    await expect(page.getByTestId('hero-card-plin')).toContainText('Streak record di 30 giorni')
    await expect(page.getByTestId('hero-card-brace')).toContainText('livello 20')
    await page.getByRole('button', { name: 'Annulla' }).click()

    await boostXp(page, xpForLevel(10))
    await page.getByRole('link', { name: 'Eroe' }).click()
    await page.getByTestId('hero-change').click()
    await expect(page.getByTestId('hero-card-salmastro')).toBeEnabled()
    await expect(page.getByTestId('hero-card-brace')).toBeDisabled()
    await page.getByTestId('hero-card-salmastro').click()
    await page.getByTestId('hero-change-confirm').click()
    await expect(page.getByRole('heading', { name: 'Capitan Salmastro', level: 1 })).toBeVisible()
  })

  test('raggiungere il livello 10 annuncia il nuovo eroe dopo il level-up e permette di sceglierlo', async ({ page }) => {
    await onboard(page)
    await boostXp(page, xpForLevel(10) - 5) // a 5 XP dal livello 10
    await page.getByRole('checkbox', { name: /Allenamento/ }).click() // +10 XP
    await expect(page.getByTestId('levelup')).toBeVisible()
    await expect(page.getByTestId('hero-unlock')).toBeHidden() // prima il level-up
    await page.getByRole('button', { name: 'Avanti' }).click()
    await expect(page.getByTestId('hero-unlock')).toBeVisible()
    await expect(page.getByTestId('hero-unlock')).toContainText('Capitan Salmastro')
    await page.getByTestId('hero-unlock-choose').click()
    await expect(page.getByTestId('hero-name')).toHaveText('Capitan Salmastro')
    await expect(page.getByTestId('hero-unlock')).toBeHidden()
  })

  test('onboarding: l\'intro ha una mini-prova, e si puo\' scegliere l\'eroe senza quiz e tornare indietro', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('splash-start').click()
    // mini-prova: toccando la missione di esempio compare l'XP
    await page.getByTestId('intro-next').click()
    await expect(page.getByTestId('intro-demo')).toBeVisible()
    await page.getByTestId('intro-demo').click()
    await expect(page.getByText('+10 XP! Così si cresce')).toBeVisible()
    await page.getByTestId('intro-next').click()
    await page.getByTestId('intro-next').click()
    await expect(page.getByTestId('onb-step')).toHaveText('Passo 2 di 7')

    await page.getByTestId('quiz-choose').click()
    await expect(page.getByTestId('choose-confirm')).toBeDisabled()
    await page.getByTestId('hero-card-fenna').click()
    await expect(page.getByTestId('choose-name')).toHaveText('Fenna')
    await expect(page.getByTestId('choose-sample')).not.toBeEmpty()
    await page.getByTestId('choose-confirm').click()
    await expect(page.getByTestId('step-name')).toBeVisible()
    await expect(page.getByTestId('onb-step')).toHaveText('Passo 3 di 7')

    // indietro: si torna alla scelta con Fenna gia' selezionata, e la si puo' cambiare
    await page.getByTestId('onb-back').click()
    await expect(page.getByTestId('choose-name')).toHaveText('Fenna')
    await page.getByTestId('hero-card-kuro').click()
    await page.getByTestId('choose-confirm').click()
    await page.getByTestId('name-input').fill('Giulia')
    await page.getByTestId('name-next').click()
    await page.getByTestId('focus-next').click()
    await expect(page.getByTestId('suggested-item')).toHaveCount(4)
    await expect(page.getByText('Suggerite da Kuro')).toBeVisible()
  })

  test('onboarding: aree di interesse, orari e fine giornata finiscono nell\'app', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('splash-start').click()
    await page.getByTestId('intro-skip').click()
    for (const a of VALDO_ANSWERS) await page.getByTestId(`quiz-answer-${a}`).click()
    await page.getByTestId('reveal-confirm').click()
    await page.getByTestId('name-input').fill('Enrico')
    await page.getByTestId('name-next').click()

    // massimo 3 aree: la quarta si disattiva
    for (const id of ['move', 'money', 'home']) await page.getByTestId(`focus-area-${id}`).click()
    await expect(page.getByTestId('focus-area-mind')).toBeDisabled()
    await page.getByTestId('focus-area-home').click() // ne tolgo una
    await expect(page.getByTestId('focus-area-mind')).toBeEnabled()
    await page.getByTestId('focus-next').click()

    await expect(page.getByTestId('area-group')).toHaveCount(2)
    await expect(page.getByTestId('area-item')).toHaveCount(4)
    // giornaliere spuntate: 3 dell'eroe + 1 per area; le settimanali delle aree no
    await page.getByTestId('onboarding-finish').click()

    await page.getByTestId('rhythm-morning').fill('07:30')
    await page.getByTestId('rhythm-evening').fill('21:15')
    await page.getByRole('radio', { name: '3:00' }).click()
    await page.getByTestId('rhythm-next').click()
    await page.getByTestId('notify-enable').click()

    await expect(page.getByTestId('ready-title')).toHaveText('Tutto pronto, Enrico!')
    await expect(page.getByTestId('ready-line')).not.toBeEmpty()
    const summary = page.getByTestId('ready-summary')
    await expect(summary).toContainText('Missioni: 5 al giorno')
    await expect(summary).not.toContainText('0 a settimana')
    await expect(summary).toContainText('Promemoria alle 07:30 e alle 21:15')
    await expect(summary).toContainText('La giornata finisce alle 3:00')
    await page.getByTestId('ready-start').click()
    await expect(page.getByTestId('page-today')).toBeVisible()
    await expect(page.getByTestId('quest-row')).toHaveCount(5)

    await page.getByRole('link', { name: 'Impostazioni' }).click()
    await expect(page.getByTestId('notif-morning')).toHaveValue('07:30')
    await expect(page.getByTestId('notif-evening')).toHaveValue('21:15')
    await expect(page.getByRole('radio', { name: '3:00' })).toHaveAttribute('aria-checked', 'true')
  })

  test('Oggi: il suggerimento di primo avvio sparisce dopo la prima missione', async ({ page }) => {
    await onboard(page)
    await expect(page.getByTestId('first-hint')).toContainText('tocca una missione')
    await page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await expect(page.getByTestId('first-hint')).toBeHidden()
  })

  test('tetto missioni: dopo 3 mensili il pulsante e\' disabilitato con messaggio chiaro', async ({ page }) => {
    await onboard(page)
    await page.getByRole('link', { name: 'Missioni' }).click()
    await page.getByRole('radio', { name: 'Mese' }).click()
    for (const title of ['Uno', 'Due', 'Tre']) {
      await page.getByTestId('quest-add').click()
      await page.getByTestId('quest-title').fill(title)
      await page.getByTestId('quest-save').click()
      await expect(page.getByTestId('quest-sheet')).toBeHidden()
    }
    await expect(page.getByTestId('quest-add')).toBeDisabled()
    await expect(page.getByTestId('cap-message')).toContainText('massimo di 3')
  })

  test('backup: esporta, modifica, importa e ripristina; import non valido non tocca i dati', async ({ page }) => {
    await onboard(page)
    await page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await expect(xpText(page)).toContainText('10/50 XP')

    await page.getByRole('link', { name: 'Impostazioni' }).click()
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export').click()])
    const file = await download.path()
    expect(download.suggestedFilename()).toMatch(/^questling-backup-\d{4}-\d{2}-\d{2}\.json$/)
    const exported = JSON.parse(await readFile(file, 'utf8'))
    expect(exported.format).toBe('questling-backup')

    // file non valido: errore chiaro, dati intatti
    await page.getByTestId('import-file').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"foo":1}') })
    await expect(page.getByTestId('import-error')).toContainText('non è un backup di Questling')

    // cambia lo stato, poi importa il backup: torna a 10 XP
    await page.getByRole('link', { name: 'Oggi' }).click()
    await page.getByRole('checkbox', { name: /Letto rifatto/ }).click()
    await expect(xpText(page)).toContainText('15/50 XP')
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    await page.getByTestId('import-file').setInputFiles(file)
    await expect(page.getByTestId('import-summary')).toContainText('Enrico')
    await page.getByTestId('import-confirm').click()
    await page.getByRole('link', { name: 'Oggi' }).click()
    await expect(xpText(page)).toContainText('10/50 XP')
  })

  test('stato corrotto: non viene perso (copia conservata) e l\'app riparte', async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('seeded')) {
        localStorage.setItem('CapacitorStorage.questling:v1:state', '{"schemaVersion":1,"profile": rotto')
        localStorage.setItem('seeded', '1')
      }
    })
    await page.goto('/')
    await expect(page).toHaveURL(/#\/onboarding/)
    const keys = await page.evaluate(() => Object.keys(localStorage))
    const corrupt = keys.find((k) => k.startsWith('CapacitorStorage.questling:v1:corrupt:'))
    expect(corrupt).toBeTruthy()
    expect(await page.evaluate((k) => localStorage.getItem(k!), corrupt)).toBe('{"schemaVersion":1,"profile": rotto')
  })

  test('elimina tutti i dati locali -> torna all\'onboarding', async ({ page }) => {
    await onboard(page)
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    await page.getByTestId('wipe').click()
    await page.getByTestId('wipe-confirm').click()
    await expect(page).toHaveURL(/#\/onboarding/)
  })


  test('il permesso notifiche non viene chiesto al primo avvio: compare solo dopo le prime missioni', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('splash-start').click()
    await page.getByTestId('intro-skip').click()
    await expect(page.getByTestId('step-notify')).toHaveCount(0)
    for (const a of VALDO_ANSWERS) await page.getByTestId(`quiz-answer-${a}`).click()
    await page.getByTestId('reveal-confirm').click()
    await expect(page.getByTestId('step-notify')).toHaveCount(0)
    await page.getByTestId('name-input').fill('Enrico')
    await page.getByTestId('name-next').click()
    await expect(page.getByTestId('step-notify')).toHaveCount(0)
    await page.getByTestId('focus-next').click()
    await page.getByTestId('onboarding-finish').click()
    await expect(page.getByTestId('step-notify')).toHaveCount(0)
    await page.getByTestId('rhythm-next').click()
    await expect(page.getByTestId('step-notify')).toBeVisible()
    await expect(page.getByTestId('notify-sample')).toContainText('Alba sul regno')
  })

  test('rifiutare i promemoria: l\'app funziona uguale e si possono attivare dopo in Impostazioni', async ({ page }) => {
    await onboard(page, 'Enrico', 'notify-skip')
    await page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await expect(xpText(page)).toContainText('10/50 XP')
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    const enable = page.getByTestId('notif-enable')
    await expect(enable).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByTestId('notif-web')).toBeVisible() // nel browser: nessuna notifica reale
    await enable.click()
    await expect(enable).toHaveAttribute('aria-checked', 'true')
    await page.getByTestId('notif-morning').fill('07:30')
    await page.reload()
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    await expect(page.getByTestId('notif-enable')).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('notif-morning')).toHaveValue('07:30')
  })

  test('attivare i promemoria in onboarding salva la preferenza', async ({ page }) => {
    await onboard(page, 'Enrico', 'notify-enable')
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    await expect(page.getByTestId('notif-enable')).toHaveAttribute('aria-checked', 'true')
  })

  test('suoni: l\'interruttore si salva e non rompe nulla (audio sintetizzato)', async ({ page }) => {
    await onboard(page)
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    const sound = page.getByTestId('sound-switch')
    await expect(sound).toHaveAttribute('aria-checked', 'true')
    await sound.click()
    await expect(sound).toHaveAttribute('aria-checked', 'false')
    await page.reload()
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    await expect(page.getByTestId('sound-switch')).toHaveAttribute('aria-checked', 'false')
  })

  test('senza Firebase configurato: l\'app e\' solo locale e la pagina account lo dice con chiarezza', async ({ page }) => {
    await onboard(page)
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    // senza account configurati nelle Impostazioni non compare nessuna voce "Account"
    await expect(page.getByTestId('page-settings')).toBeVisible()
    await expect(page.getByTestId('settings-account')).toHaveCount(0)
    await page.goto('/#/account')
    await expect(page.getByTestId('account-unavailable')).toBeVisible()
    await expect(page.getByTestId('account-form')).toHaveCount(0)
    await page.getByTestId('account-back').click()
    await expect(page.getByTestId('page-settings')).toBeVisible()
  })

  test('l\'informativa privacy e\' pubblica: si apre anche senza profilo, con i segnaposto da completare visibili', async ({ page }) => {
    await page.goto('/#/privacy')
    await expect(page.getByTestId('page-privacy')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Informativa sulla privacy', level: 1 })).toBeVisible()
    await expect(page.getByText('Non ci sono pubblicità')).toBeVisible()
    await expect(page.getByText('DA COMPLETARE').first()).toBeVisible()
  })

  test('la pagina statica /privacy.html esiste ed e\' generata dalla stessa fonte', async ({ page }) => {
    await page.goto('/privacy.html')
    await expect(page.getByRole('heading', { name: 'Informativa sulla privacy', level: 1 })).toBeVisible()
    await expect(page.getByText('Titolare del trattamento')).toBeVisible()
  })

  test('statistiche: heatmap, totali e traguardi riflettono quanto completato (e l\'undo)', async ({ page }) => {
    await onboard(page)
    await page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await page.getByRole('link', { name: 'Eroe' }).click()
    await page.getByRole('link', { name: 'Statistiche' }).click()
    await expect(page.getByTestId('page-stats')).toBeVisible()

    await expect(page.getByTestId('heat-today')).toHaveAttribute('data-count', '1')
    await expect(page.getByTestId('heatmap-summary')).toContainText('1 daily completate in 1 giorni attivi')
    await expect(page.getByTestId('total-7')).toContainText('1 daily · 10 XP')
    await expect(page.getByTestId('ach-first_step')).toHaveAttribute('data-done', 'true')
    await expect(page.getByTestId('ach-streak_7')).toHaveAttribute('data-done', 'false')
    await expect(page.getByTestId('achievements-count')).toContainText('1 su 14')
    expect(await page.locator('[data-testid="heatmap"] [role="img"]').count()).toBe(84) // 12 settimane x 7 giorni

    // annullo il completamento: heatmap e totali tornano a zero (e il traguardo "primo passo", ricalcolato dai completamenti, si spegne)
    await page.getByRole('link', { name: 'Oggi' }).click()
    await page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await page.getByRole('link', { name: 'Eroe' }).click()
    await page.getByRole('link', { name: 'Statistiche' }).click()
    await expect(page.getByTestId('heat-today')).toHaveAttribute('data-count', '0')
    await expect(page.getByTestId('total-7')).toContainText('0 daily · 0 XP')
    await expect(page.getByTestId('ach-first_step')).toHaveAttribute('data-done', 'false')
  })

  test('nessuna richiesta esterna (offline-first) e nessun errore in console', async ({ page }) => {
    const external: string[] = []
    const errors: string[] = []
    page.on('request', (r) => {
      if (!r.url().startsWith('http://localhost')) external.push(r.url())
    })
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text())
    })
    await onboard(page)
    for (const link of ['Missioni', 'Eroe', 'Statistiche', 'Impostazioni', 'Oggi']) await page.getByRole('link', { name: link }).click()
    expect(external).toEqual([])
    expect(errors).toEqual([])
  })
})

test.describe('Inglese', () => {
  test.use({ locale: 'en-US' })

  test('il primo avvio segue la lingua del dispositivo: onboarding e Oggi in inglese; il cambio lingua resta salvato', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('splash-start')).toHaveText('Let\'s begin')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await page.getByTestId('splash-start').click()
    await page.getByTestId('intro-skip').click()
    await expect(page.getByTestId('quiz-progress')).toHaveText('Question 1 of 8')
    for (const a of VALDO_ANSWERS) await page.getByTestId(`quiz-answer-${a}`).click()
    await expect(page.getByTestId('reveal-name')).toHaveText('Ser Valdo')
    await expect(page.getByTestId('reveal-affinity')).toHaveText('100% match')
    await page.getByTestId('reveal-confirm').click()
    await page.getByTestId('name-input').fill('Alex')
    await page.getByTestId('name-next').click()
    await page.getByTestId('focus-next').click()
    await expect(page.getByTestId('suggested-item')).toHaveCount(4)
    await expect(page.getByText('Suggested by Ser Valdo')).toBeVisible()
    await page.getByTestId('onboarding-finish').click()
    await page.getByTestId('rhythm-next').click()
    await expect(page.getByTestId('notify-voice')).toContainText('Brave one')
    await expect(page.getByTestId('notify-sample')).toContainText('Dawn over the realm')
    await page.getByTestId('notify-skip').click()
    await expect(page.getByTestId('ready-title')).toHaveText('All set, Alex!')
    await page.getByTestId('ready-start').click()

    await expect(page.getByTestId('hero-name')).toHaveText('Ser Valdo')
    await expect(page.getByTestId('level-line')).toContainText('Lv 1 · Squire')
    await expect(page.getByRole('checkbox', { name: /Make the bed before 9/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible()

    // cambio lingua dalle impostazioni: tutto passa all'italiano e resta cosi' dopo il ricaricamento
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('radio', { name: 'Italiano' }).click()
    await expect(page.getByRole('link', { name: 'Oggi' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'it')
    await page.reload()
    await expect(page.getByRole('link', { name: 'Oggi' })).toBeVisible()
    await page.getByRole('link', { name: 'Oggi' }).click()
    // l'eroe parla italiano; le missioni gia' create sono dati dell'utente e non si traducono
    await expect(page.getByTestId('level-line')).toContainText('Lv 1 · Scudiero')
    await expect(page.getByRole('checkbox', { name: /Make the bed before 9/ })).toBeVisible()

    // ... e di nuovo in inglese
    await page.getByRole('link', { name: 'Impostazioni' }).click()
    await page.getByRole('radio', { name: 'English' }).click()
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible()
  })

  test('privacy in inglese: pagina in-app e pagina statica generata', async ({ page, request }) => {
    await page.goto('/#/privacy')
    await expect(page.getByRole('heading', { name: 'Privacy policy', level: 1 })).toBeVisible()
    const res = await request.get('/privacy-en.html')
    expect(res.ok()).toBe(true)
    expect(await res.text()).toContain('<html lang="en">')
  })
})

test('lingua sconosciuta del dispositivo: si parte in italiano', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto('/')
  await expect(page.getByTestId('splash-start')).toHaveText('Cominciamo')
  await expect(page.locator('html')).toHaveAttribute('lang', 'it')
  await ctx.close()
})
