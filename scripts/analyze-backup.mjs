// Analizza un file di backup (Impostazioni > Esporta backup) per il playtest: nessun analytics nell'app (D13),
// quindi le metriche si ricavano dai dati che il tester ti invia volontariamente.
// Uso: node scripts/analyze-backup.mjs backup1.json [backup2.json ...]
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const DAY_MS = 86_400_000
const pad = (n) => String(n).padStart(2, '0')

/** Giorno logico locale (cambia alle dayStartHour), come core/periods.ts. */
function dayKey(iso, hour) {
  const d = new Date(iso)
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (d.getHours() < hour) day.setDate(day.getDate() - 1)
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
}
const utc = (key) => Date.UTC(...key.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))))
const diff = (a, b) => Math.round((utc(b) - utc(a)) / DAY_MS)

export function analyze(text) {
  const parsed = JSON.parse(text)
  const state = parsed.state ?? parsed
  if (!state?.profile || !Array.isArray(state.completions)) throw new Error('Non sembra un backup di Questling')
  const hour = state.settings?.dayStartHour ?? 4
  const first = dayKey(state.profile.onboardedAt, hour)
  const last = dayKey(parsed.exportedAt ?? state.lastOpenAt ?? new Date().toISOString(), hour)
  const spanDays = diff(first, last) + 1

  const questById = new Map(state.quests.map((q) => [q.id, q]))
  const activeDaily = new Set()
  let completions = 0
  for (const c of state.completions) {
    if (!c.completedAt) continue
    completions++
    if (questById.get(c.questId)?.period === 'daily') activeDaily.add(c.periodKey)
  }

  // retention "morbida": ha completato almeno una daily il giorno N dopo l'onboarding (N = 0 e' il primo giorno)
  const activeAt = (n) => [...activeDaily].some((d) => diff(first, d) === n)
  const within = (from, to) => [...activeDaily].filter((d) => diff(first, d) >= from && diff(first, d) <= to).length

  // striscia migliore (giorni consecutivi con almeno una daily)
  const days = [...activeDaily].sort()
  let best = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && diff(days[i - 1], days[i]) === 1 ? run + 1 : 1
    best = Math.max(best, run)
  }

  const xp = state.xpEvents.reduce((acc, e) => acc + e.delta, 0)
  const lastActive = days.at(-1) ?? null
  return {
    character: state.profile.characterId,
    quizTaken: Array.isArray(state.profile.quizAnswers),
    spanDays,
    questsActive: state.quests.filter((q) => !q.archivedAt).length,
    questsArchived: state.quests.filter((q) => q.archivedAt).length,
    completions,
    activeDays: activeDaily.size,
    activeShare: Math.round((100 * activeDaily.size) / Math.max(1, spanDays)),
    day1: activeAt(1),
    day7: within(7, 7) > 0 || within(6, 8) > 0,
    activeFirstWeek: within(0, 6),
    activeSecondWeek: within(7, 13),
    bestStreak: best,
    daysSinceLastActive: lastActive ? diff(lastActive, last) : null,
    totalXp: xp,
    xpPerActiveDay: activeDaily.size ? Math.round(xp / activeDaily.size) : 0,
    notificationsEnabled: !!state.settings?.notifications?.enabled,
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const files = process.argv.slice(2)
  if (files.length === 0) {
    console.error('Uso: node scripts/analyze-backup.mjs backup.json [altri.json...]')
    process.exit(2)
  }
  for (const f of files) {
    try {
      console.log(`\n== ${f}`)
      console.table(analyze(readFileSync(f, 'utf8')))
    } catch (e) {
      console.error(`${f}: ${e.message}`)
    }
  }
}
