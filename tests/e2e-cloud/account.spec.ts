import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test'

// Account e sync REALI (Firebase Auth + Firestore) contro gli EMULATORI, con due o piu' "dispositivi"
// (= contesti browser isolati: ognuno ha il proprio storage locale).
const FS = process.env.FIRESTORE_EMULATOR_HOST as string
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST as string
const PROJECT = 'Questling'
const PASSWORD = 'secret123'
const VALDO_ANSWERS = [0, 3, 0, 0, 0, 3, 0, 0]

let counter = 0
const uniqueEmail = (): string => `utente${Date.now()}n${++counter}@example.com`

// ── emulatori: reset e ispezione diretta (REST) ─────────────────────────────────────────────
test.beforeEach(async () => {
  await fetch(`http://${FS}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' })
  await fetch(`http://${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' })
})

async function uidOf(email: string, password = PASSWORD): Promise<string | null> {
  const res = await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  return ((await res.json()) as { localId?: string }).localId ?? null
}

async function remoteCount(uid: string, collection: string): Promise<number> {
  const res = await fetch(`http://${FS}/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}/${collection}?pageSize=500`, {
    headers: { Authorization: 'Bearer owner' }, // l'emulatore ignora le regole per il bearer "owner"
  })
  return ((await res.json()) as { documents?: unknown[] }).documents?.length ?? 0
}

// ── dispositivi ─────────────────────────────────────────────────────────────────────────────
async function device(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'it-IT', timezoneId: 'Europe/Rome', baseURL: 'http://localhost:4174' })
  const page = await ctx.newPage()
  return { ctx, page }
}

async function onboard(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByTestId('splash-start').click()
  await page.getByTestId('intro-skip').click()
  for (const a of VALDO_ANSWERS) await page.getByTestId(`quiz-answer-${a}`).click()
  await page.getByTestId('reveal-confirm').click()
  await page.getByTestId('name-input').fill('Enrico')
  await page.getByTestId('name-next').click()
  await page.getByTestId('onboarding-finish').click()
  await page.getByTestId('notify-skip').click()
  await expect(page.getByTestId('page-today')).toBeVisible()
}

const xp = (page: Page) => page.getByTestId('xp-text')
const goAccount = async (page: Page): Promise<void> => {
  await page.goto('/#/account')
  await expect(page.getByTestId('page-account')).toBeVisible()
}

async function syncCount(page: Page): Promise<number> {
  return Number((await page.getByTestId('sync-status').getAttribute('data-count')) ?? '0')
}
/** Preme "Sincronizza ora" e aspetta che ne sia COMPLETATA almeno una nuova. */
async function syncNow(page: Page): Promise<void> {
  const before = await syncCount(page)
  await expect(page.getByTestId('sync-now')).toBeEnabled()
  await page.getByTestId('sync-now').click()
  await expect.poll(() => syncCount(page), { timeout: 20_000 }).toBeGreaterThan(before)
}
const waitFirstSync = (page: Page) => expect.poll(() => syncCount(page), { timeout: 20_000 }).toBeGreaterThan(0)

async function signUp(page: Page, email: string): Promise<void> {
  await goAccount(page)
  await page.getByRole('radio', { name: 'Registrati' }).click()
  await page.getByTestId('account-email-input').fill(email)
  await page.getByTestId('account-password-input').fill(PASSWORD)
  await page.getByTestId('account-submit').click()
}

async function signIn(page: Page, email: string, password = PASSWORD): Promise<void> {
  await goAccount(page)
  await page.getByRole('radio', { name: 'Accedi' }).click() // il form puo' essere rimasto su "Registrati"
  await page.getByTestId('account-email-input').fill(email)
  await page.getByTestId('account-password-input').fill(password)
  await page.getByTestId('account-submit').click()
}

test.describe('account e sincronizzazione (emulatori Firebase)', () => {
  test('registrazione su un dispositivo con dati locali: nessuna domanda, tutto finisce nel cloud', async ({ browser }) => {
    const { page } = await device(browser)
    await onboard(page)
    await page.getByRole('checkbox', { name: /Allenamento/ }).click()
    const email = uniqueEmail()
    await signUp(page, email)
    await expect(page.getByTestId('account-signed-in')).toBeVisible()
    await expect(page.getByTestId('merge-dialog')).toHaveCount(0) // il cloud e' vuoto: niente da unire
    await waitFirstSync(page)

    const uid = (await uidOf(email))!
    expect(uid).toBeTruthy()
    await expect.poll(() => remoteCount(uid, 'quests')).toBe(3)
    expect(await remoteCount(uid, 'completions')).toBe(1)
    expect(await remoteCount(uid, 'xpEvents')).toBe(1)
    expect(await remoteCount(uid, 'profile')).toBe(1)
  })

  test('dispositivo nuovo: accedendo ritrova tutto (profilo, missioni, XP) e va dritto a Oggi', async ({ browser }) => {
    const A = await device(browser)
    await onboard(A.page)
    await A.page.getByRole('checkbox', { name: /Allenamento/ }).click()
    const email = uniqueEmail()
    await signUp(A.page, email)
    await waitFirstSync(A.page)

    const B = await device(browser)
    await B.page.goto('/')
    await expect(B.page.getByTestId('step-splash')).toBeVisible()
    await B.page.getByTestId('splash-account').click()
    await signIn(B.page, email)

    await expect(B.page.getByTestId('page-today')).toBeVisible({ timeout: 20_000 })
    await expect(B.page.getByTestId('hero-name')).toHaveText('Ser Valdo')
    await expect(B.page.getByTestId('quest-row')).toHaveCount(3)
    await expect(xp(B.page)).toContainText('10/50 XP')
    await expect(B.page.getByRole('checkbox', { name: /Allenamento/ })).toHaveAttribute('aria-checked', 'true')
  })

  test('due dispositivi offline completano la STESSA missione: dopo la sync l\'XP conta una volta e coincidono', async ({ browser }) => {
    const email = uniqueEmail()
    const A = await device(browser)
    await onboard(A.page)
    await signUp(A.page, email)
    await waitFirstSync(A.page)
    const B = await device(browser)
    await B.page.goto('/#/account')
    await signIn(B.page, email)
    await expect(B.page.getByTestId('page-today')).toBeVisible({ timeout: 20_000 })

    // entrambi offline
    await A.ctx.setOffline(true)
    await B.ctx.setOffline(true)
    await A.page.goto('/#/') .catch(() => {})
    await A.page.getByRole('link', { name: 'Oggi' }).click().catch(() => {})
    await A.page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await B.page.getByRole('link', { name: 'Oggi' }).click().catch(() => {})
    await B.page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await B.page.getByRole('checkbox', { name: /Letto rifatto/ }).click()
    await expect(xp(A.page)).toContainText('10/50 XP')
    await expect(xp(B.page)).toContainText('15/50 XP')

    // di nuovo online: sync a giri
    await A.ctx.setOffline(false)
    await B.ctx.setOffline(false)
    for (const p of [A.page, B.page, A.page, B.page]) {
      await p.getByRole('link', { name: 'Altro' }).click()
      await p.getByTestId('settings-account-link').click()
      await syncNow(p)
      await p.getByRole('button', { name: 'Indietro' }).click()
      await p.getByRole('link', { name: 'Oggi' }).click()
    }
    // Allenamento (10, contato una volta) + Letto rifatto (5) = 15 su entrambi
    await expect(xp(A.page)).toContainText('15/50 XP')
    await expect(xp(B.page)).toContainText('15/50 XP')
    await expect(A.page.getByRole('checkbox', { name: /Letto rifatto/ })).toHaveAttribute('aria-checked', 'true')
  })

  test('primo accesso con dati da entrambe le parti: riepilogo, conferma, unione senza perdere nulla', async ({ browser }) => {
    const email = uniqueEmail()
    const A = await device(browser)
    await onboard(A.page)
    await signUp(A.page, email)
    await waitFirstSync(A.page)

    const C = await device(browser)
    await onboard(C.page) // dati locali propri (altre 3 missioni con id diversi)
    await signIn(C.page, email)

    const dialog = C.page.getByTestId('merge-dialog')
    await expect(dialog).toBeVisible({ timeout: 20_000 })
    const quests = C.page.locator('[data-row="quests"] td')
    await expect(quests.nth(0)).toHaveText('3') // solo qui
    await expect(quests.nth(1)).toHaveText('3') // solo nel cloud
    await expect(quests.nth(2)).toHaveText('0') // in entrambi
    await C.page.getByTestId('merge-confirm').click()
    await expect(dialog).toHaveCount(0)
    await waitFirstSync(C.page)

    // nulla e' andato perso: 3 + 3 missioni giornaliere
    await C.page.goto('/#/quests')
    await expect(C.page.getByTestId('quest-item')).toHaveCount(6)
    // e le liste di A, dopo la sync, vedono lo stesso
    await goAccount(A.page)
    await syncNow(A.page)
    await A.page.goto('/#/quests')
    await expect(A.page.getByTestId('quest-item')).toHaveCount(6)
  })

  test('annullare l\'unione: si esce dall\'account e i dati locali restano intatti', async ({ browser }) => {
    const email = uniqueEmail()
    const A = await device(browser)
    await onboard(A.page)
    await signUp(A.page, email)
    await waitFirstSync(A.page)

    const D = await device(browser)
    await onboard(D.page)
    await D.page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await signIn(D.page, email)
    await expect(D.page.getByTestId('merge-dialog')).toBeVisible({ timeout: 20_000 })
    await D.page.getByTestId('merge-cancel').click()

    await expect(D.page.getByTestId('account-form')).toBeVisible() // scollegato
    await D.page.goto('/#/')
    await expect(D.page.getByTestId('quest-row')).toHaveCount(3)
    await expect(xp(D.page)).toContainText('10/50 XP')
    // e il cloud non e' stato toccato
    const uid = (await uidOf(email))!
    expect(await remoteCount(uid, 'xpEvents')).toBe(0)
  })

  test('esci e rientra con lo stesso account: nessuna domanda, i dati restano', async ({ browser }) => {
    const email = uniqueEmail()
    const { page } = await device(browser)
    await onboard(page)
    await page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await signUp(page, email)
    await waitFirstSync(page)

    await page.getByTestId('account-signout').click()
    await expect(page.getByTestId('account-form')).toBeVisible()
    await page.goto('/#/')
    await expect(xp(page)).toContainText('10/50 XP') // i dati restano sul dispositivo

    await signIn(page, email)
    await expect(page.getByTestId('account-signed-in')).toBeVisible()
    await expect(page.getByTestId('merge-dialog')).toHaveCount(0) // stesso account: sync incrementale
    await waitFirstSync(page)
  })

  test('la sessione sopravvive al riavvio dell\'app', async ({ browser }) => {
    const { page } = await device(browser)
    await onboard(page)
    await signUp(page, uniqueEmail())
    await expect(page.getByTestId('account-signed-in')).toBeVisible()
    await page.reload()
    await expect(page.getByTestId('account-signed-in')).toBeVisible({ timeout: 20_000 })
  })

  test('errori chiari: password sbagliata, email gia\' usata, password debole', async ({ browser }) => {
    const email = uniqueEmail()
    const A = await device(browser)
    await onboard(A.page)
    await signUp(A.page, email)
    await expect(A.page.getByTestId('account-signed-in')).toBeVisible()
    await A.page.getByTestId('account-signout').click()

    await signIn(A.page, email, 'sbagliata1')
    await expect(A.page.getByTestId('account-error')).toContainText('non corrette')

    await A.page.getByRole('radio', { name: 'Registrati' }).click()
    await A.page.getByTestId('account-email-input').fill(email)
    await A.page.getByTestId('account-password-input').fill(PASSWORD)
    await A.page.getByTestId('account-submit').click()
    await expect(A.page.getByTestId('account-error')).toContainText('Esiste già un account')

    await A.page.getByTestId('account-email-input').fill(uniqueEmail())
    await A.page.getByTestId('account-password-input').fill('123')
    await A.page.getByTestId('account-submit').click()
    await expect(A.page.getByTestId('account-error')).toContainText('troppo debole')
  })

  test('password dimenticata: messaggio neutro (non rivela se l\'account esiste)', async ({ browser }) => {
    const { page } = await device(browser)
    await onboard(page)
    await goAccount(page)
    await page.getByTestId('account-forgot').click()
    await expect(page.getByTestId('account-reset')).toContainText('Scrivi prima la tua email')
    await page.getByTestId('account-email-input').fill(uniqueEmail())
    await page.getByTestId('account-forgot').click()
    await expect(page.getByTestId('account-reset')).toContainText('Se esiste un account')
  })

  test('elimina account: dati nel cloud e account cancellati, quelli sul dispositivo restano', async ({ browser }) => {
    const email = uniqueEmail()
    const { page } = await device(browser)
    await onboard(page)
    await page.getByRole('checkbox', { name: /Allenamento/ }).click()
    await signUp(page, email)
    await waitFirstSync(page)
    const uid = (await uidOf(email))!
    await expect.poll(() => remoteCount(uid, 'quests')).toBe(3)

    await page.getByTestId('account-delete').click()
    // password sbagliata: errore e NIENTE cancellato
    await page.getByTestId('delete-password').fill('sbagliata1')
    await page.getByTestId('delete-confirm').click()
    await expect(page.getByTestId('delete-error')).toBeVisible()
    expect(await remoteCount(uid, 'quests')).toBe(3)
    expect(await uidOf(email)).toBe(uid)

    // password giusta
    await page.getByTestId('delete-password').fill(PASSWORD)
    await page.getByTestId('delete-confirm').click()
    await expect(page.getByTestId('account-form')).toBeVisible({ timeout: 20_000 })

    await expect.poll(() => remoteCount(uid, 'quests')).toBe(0)
    for (const c of ['completions', 'xpEvents', 'profile']) expect(await remoteCount(uid, c)).toBe(0)
    expect(await uidOf(email)).toBeNull() // l'account non esiste piu'

    // i dati locali sono ancora li'
    await page.goto('/#/')
    await expect(xp(page)).toContainText('10/50 XP')
    await expect(page.getByTestId('quest-row')).toHaveCount(3)

    // e con la stessa email si puo' creare un account NUOVO: ricarica i dati locali nel cloud
    await signUp(page, email)
    await expect(page.getByTestId('account-signed-in')).toBeVisible()
    await waitFirstSync(page)
    const newUid = (await uidOf(email))!
    expect(newUid).not.toBe(uid)
    await expect.poll(() => remoteCount(newUid, 'quests')).toBe(3)
  })

  test('l\'app parla solo con localhost e con gli emulatori (nessun altro servizio)', async ({ browser }) => {
    const allowed = new Set(['localhost', new URL(`http://${FS}`).hostname])
    const external: string[] = []
    const { page } = await device(browser)
    page.on('request', (r) => {
      const u = new URL(r.url())
      if (!allowed.has(u.hostname) && u.protocol.startsWith('http')) external.push(r.url())
    })
    await onboard(page)
    await signUp(page, uniqueEmail())
    await waitFirstSync(page)
    expect(external).toEqual([])
  })
})
