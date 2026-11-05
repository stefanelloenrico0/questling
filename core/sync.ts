// Sync opzionale (Fase 3): outbox locale + pull incrementale + unione deterministica.
// PURO: il backend (Firestore) arriva da fuori attraverso l'interfaccia RemoteStore.
//
// Modello: lo stato locale e' la fonte di verita', il cloud e' una replica.
//  - xpEvents      : log append-only, unione per id.
//  - completions   : id deterministico `${questId}_${periodKey}`, last-write-wins per updatedAt.
//  - quests/profile: last-write-wins per updatedAt, con tombstone (archivedAt).
//  - L'XP e' derivato dagli eventi: quando due dispositivi assegnano XP alla stessa cosa (stessa
//    daily completata offline su entrambi) l'unione conterebbe l'XP due volte. reconcileXp() la
//    riallinea con eventi correttivi DETERMINISTICI (stesso id ovunque -> si deduplicano).
import { activeDays, dailyBonusEligible, syncChapters } from './game'
import { dayKey } from './periods'
import { completionSchema, profileSchema, questSchema, xpEventSchema } from './schema'
import { computeStreak } from './streak'
import { ALL_DONE_BONUS, STREAK_MILESTONES, questXp } from './xp'
import type { AppState, Completion, Profile, Quest, XpEvent, XpReason } from './types'

// ── tipi del backend ─────────────────────────────────────────────────────────

export type SyncCollection = 'profile' | 'quests' | 'completions' | 'xpEvents'

export interface RemoteSnapshot {
  profile: Profile | null
  quests: Quest[]
  completions: Completion[]
  xpEvents: XpEvent[]
}

export interface OutDoc {
  collection: SyncCollection
  id: string
  data: Record<string, unknown>
}

export interface RemoteStore {
  /** Documenti con syncedAt (timestamp SERVER) > cursor; cursor null = tutto. Restituisce il nuovo cursor. */
  pull(cursor: string | null): Promise<{ snapshot: RemoteSnapshot; cursor: string | null; invalid?: number }>
  push(docs: OutDoc[]): Promise<void>
  /** Cancella tutti i dati dell'utente nel cloud (eliminazione account). */
  deleteAll(): Promise<void>
}

export interface SyncMeta {
  /** Account con cui questo dispositivo ha sincronizzato l'ultima volta. */
  uid: string | null
  cursor: string | null
  /** `${collection}/${id}` -> versione gia' presente nel cloud (updatedAt#hash; '1' per gli eventi). */
  versions: Record<string, string>
  lastSyncAt: string | null
}

export const emptySyncMeta = (): SyncMeta => ({ uid: null, cursor: null, versions: {}, lastSyncAt: null })

export const PROFILE_DOC_ID = 'main'
export const PUSH_CHUNK = 400 // Firestore: max 500 operazioni per batch

// ── utilita' ─────────────────────────────────────────────────────────────────

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

const ms = (iso: string): number => Date.parse(iso)

/**
 * Identita' di versione di un documento: updatedAt + hash del contenuto. Due dispositivi possono
 * produrre lo stesso updatedAt (orologi sfasati) con contenuto diverso: senza l'hash chi perde nel
 * cloud non ripubblicherebbe la variante che vince il tie-break e i dispositivi divergerebbero.
 */
const docVersion = (doc: { updatedAt: string }): string => `${doc.updatedAt}#${hash(canonical(doc))}`

function hash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}

/** Vince il piu' recente; a parita' un criterio deterministico (uguale su ogni dispositivo). */
function newer<T extends { updatedAt: string }>(a: T, b: T, tie: (a: T, b: T) => T): T {
  const diff = ms(a.updatedAt) - ms(b.updatedAt)
  if (diff > 0) return a
  if (diff < 0) return b
  return tie(a, b)
}

const tieCanonical = <T>(a: T, b: T): T => (canonical(a) >= canonical(b) ? a : b)

const pickQuest = (a: Quest, b: Quest): Quest =>
  newer(a, b, (x, y) => {
    if (!!x.archivedAt !== !!y.archivedAt) return x.archivedAt ? x : y // il tombstone vince
    return tieCanonical(x, y)
  })

const pickCompletion = (a: Completion, b: Completion): Completion =>
  newer(a, b, (x, y) => (x.count !== y.count ? (x.count > y.count ? x : y) : tieCanonical(x, y)))

const pickProfile = (a: Profile, b: Profile): Profile => newer(a, b, tieCanonical)

export interface CollectionStats {
  localOnly: number
  remoteOnly: number
  both: number
  /** Su quelli presenti in entrambi: quanti ha vinto la versione del cloud. */
  remoteWon: number
}

function mergeById<T extends { id: string }>(
  local: readonly T[],
  remote: readonly T[],
  pick: (a: T, b: T) => T,
): { merged: T[]; stats: CollectionStats } {
  const remoteById = new Map(remote.map((r) => [r.id, r]))
  const localIds = new Set(local.map((l) => l.id))
  const stats: CollectionStats = { localOnly: 0, remoteOnly: 0, both: 0, remoteWon: 0 }
  const merged: T[] = []
  for (const l of local) {
    const r = remoteById.get(l.id)
    if (!r) {
      stats.localOnly++
      merged.push(l)
    } else {
      stats.both++
      const winner = pick(l, r)
      if (winner === r && canonical(r) !== canonical(l)) stats.remoteWon++
      merged.push(winner)
    }
  }
  for (const r of remote) {
    if (!localIds.has(r.id)) {
      stats.remoteOnly++
      merged.push(r)
    }
  }
  return { merged: merged.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)), stats }
}

// ── riconciliazione dell'XP ──────────────────────────────────────────────────

const FIX_PREFIX = 'fix:'
const isFix = (e: XpEvent): boolean => e.id.startsWith(FIX_PREFIX)

/**
 * Dopo l'unione di piu' dispositivi l'XP di una stessa "cosa" (completamento, bonus del giorno,
 * traguardo streak) puo' essere contato due volte, o in modo incoerente con lo stato dei
 * completamenti. Genera gli eventi correttivi: id deterministico = funzione di (gruppo, XP atteso,
 * XP attuale), quindi due dispositivi che vedono la stessa unione producono lo STESSO evento.
 */
export function reconcileXp(state: AppState, now: Date, touchedDays: ReadonlySet<string> = new Set()): XpEvent[] {
  const groups = new Map<string, XpEvent[]>()
  for (const e of state.xpEvents) {
    if (!e.refId || e.reason === 'adjustment') continue
    const key = `${e.reason}|${e.refId}`
    groups.set(key, [...(groups.get(key) ?? []), e])
  }

  const questById = new Map(state.quests.map((q) => [q.id, q]))
  const completionById = new Map(state.completions.map((c) => [c.id, c]))
  const milestones = new Map<string, number>()
  const today = dayKey(now, state.settings.dayStartHour)
  for (const m of computeStreak(activeDays(state), today).milestones) {
    milestones.set(`${m.days}:${m.dayKey}`, STREAK_MILESTONES.find((s) => s.days === m.days)?.xp ?? 0)
  }
  // un traguardo atteso ma senza alcun evento (es. nato dall'unione) forma un gruppo vuoto
  for (const ref of milestones.keys()) if (!groups.has(`streak_milestone|${ref}`)) groups.set(`streak_milestone|${ref}`, [])

  for (const day of touchedDays) if (!groups.has(`daily_bonus|${day}`)) groups.set(`daily_bonus|${day}`, [])

  const fixes: XpEvent[] = []
  for (const [key, events] of groups) {
    const [reason, ...rest] = key.split('|')
    const refId = rest.join('|')
    const net = events.reduce((acc, e) => acc + e.delta, 0)
    const base = events.filter((e) => !isFix(e))
    let desired: number | null = null

    if (reason === 'quest') {
      const completion = completionById.get(refId)
      const quest = completion ? questById.get(completion.questId) : undefined
      if (completion) {
        const awarded = Math.max(0, ...base.map((e) => e.delta))
        const amount = awarded > 0 ? awarded : quest ? questXp(quest.difficulty, quest.period) : 0
        desired = completion.completedAt ? amount : 0
      }
    } else if (reason === 'daily_bonus') {
      // Un solo bonus al giorno, mai negativo. Se l'unione ha cambiato i completamenti di QUEL giorno
      // (magari su dispositivi diversi: nessuno vedeva "tutte fatte") si rivaluta se il bonus spetta.
      // Solo per i giorni toccati: niente bonus retroattivi su giorni vecchi a ogni sync.
      desired = touchedDays.has(refId)
        ? dailyBonusEligible(state, refId)
          ? ALL_DONE_BONUS
          : 0
        : Math.min(ALL_DONE_BONUS, Math.max(0, net))
    } else if (reason === 'streak_milestone') {
      desired = milestones.get(refId) ?? 0
    }
    if (desired === null || desired === net) continue

    const ids = base.map((e) => e.id).sort()
    fixes.push({
      id: `${FIX_PREFIX}${reason}:${refId}:${hash(ids.join(','))}:${desired}:${net}`,
      at: now.toISOString(),
      delta: desired - net,
      reason: reason as XpReason,
      refId,
    })
  }
  return fixes
}

// ── unione ───────────────────────────────────────────────────────────────────

export interface MergeStats {
  profile: 'none' | 'local' | 'remote' | 'same'
  quests: CollectionStats
  completions: CollectionStats
  xpEvents: { localOnly: number; remoteOnly: number }
  xpCorrections: number
  /** Documenti del cloud scartati perche' non validi. */
  invalid: number
}

/** Valida un'istantanea letta dal cloud: i documenti non conformi vengono scartati, mai importati. */
export function sanitizeSnapshot(raw: {
  profile: unknown
  quests: unknown[]
  completions: unknown[]
  xpEvents: unknown[]
}): { snapshot: RemoteSnapshot; invalid: number } {
  let invalid = 0
  const keep = <T>(items: unknown[], schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown } }): T[] =>
    items.flatMap((item) => {
      const r = schema.safeParse(item)
      if (r.success) return [r.data as T]
      invalid++
      return []
    })
  const profileResult = raw.profile ? profileSchema.safeParse(raw.profile) : null
  if (profileResult && !profileResult.success) invalid++
  return {
    snapshot: {
      profile: profileResult?.success ? (profileResult.data as Profile) : null,
      quests: keep<Quest>(raw.quests, questSchema),
      completions: keep<Completion>(raw.completions, completionSchema),
      xpEvents: keep<XpEvent>(raw.xpEvents, xpEventSchema),
    },
    invalid,
  }
}

export function mergeRemote(
  local: AppState,
  remote: RemoteSnapshot,
  now: Date,
  invalid = 0,
): { state: AppState; stats: MergeStats } {
  const quests = mergeById(local.quests, remote.quests, pickQuest)
  const completions = mergeById(local.completions, remote.completions, pickCompletion)

  const eventsById = new Map<string, XpEvent>(local.xpEvents.map((e) => [e.id, e]))
  let remoteOnly = 0
  for (const e of remote.xpEvents) {
    if (!eventsById.has(e.id)) {
      eventsById.set(e.id, e)
      remoteOnly++
    }
  }
  const remoteEventIds = new Set(remote.xpEvents.map((e) => e.id))
  const localOnly = local.xpEvents.filter((e) => !remoteEventIds.has(e.id)).length

  let profile = local.profile
  let profileStat: MergeStats['profile'] = 'none'
  if (local.profile && remote.profile) {
    profile = pickProfile(local.profile, remote.profile)
    profileStat = canonical(local.profile) === canonical(remote.profile) ? 'same' : profile === remote.profile ? 'remote' : 'local'
  } else if (remote.profile) {
    profile = remote.profile
    profileStat = 'remote'
  } else if (local.profile) {
    profileStat = 'local'
  }

  let merged: AppState = {
    ...local,
    profile,
    quests: quests.merged,
    completions: completions.merged,
    xpEvents: [...eventsById.values()].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : 1)),
  }
  // Giorni in cui l'unione ha portato completamenti daily nuovi o diversi dal cloud
  const dailyIds = new Set(merged.quests.filter((q) => q.period === 'daily').map((q) => q.id))
  const localCompletionById = new Map(local.completions.map((c) => [c.id, c]))
  const touchedDays = new Set<string>()
  for (const rc of remote.completions) {
    if (!dailyIds.has(rc.questId)) continue
    const lc = localCompletionById.get(rc.id)
    if (!lc || canonical(lc) !== canonical(rc)) touchedDays.add(rc.periodKey)
  }
  const fixes = reconcileXp(merged, now, touchedDays)
  if (fixes.length > 0) {
    merged = { ...merged, xpEvents: [...merged.xpEvents, ...fixes].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : 1)) }
  }
  merged = syncChapters(merged)

  // Se l'unione non ha cambiato nulla restituisco lo STESSO oggetto: chi osserva lo stato
  // (l'app ripianifica e risincronizza a ogni cambio) non deve scattare in un ciclo infinito.
  const changed =
    quests.stats.remoteOnly > 0 ||
    quests.stats.remoteWon > 0 ||
    completions.stats.remoteOnly > 0 ||
    completions.stats.remoteWon > 0 ||
    remoteOnly > 0 ||
    fixes.length > 0 ||
    canonical(profile) !== canonical(local.profile)

  return {
    state: changed ? merged : local,
    stats: {
      profile: profileStat,
      quests: quests.stats,
      completions: completions.stats,
      xpEvents: { localOnly, remoteOnly },
      xpCorrections: fixes.length,
      invalid,
    },
  }
}

// ── outbox (diff rispetto a cio' che il cloud ha gia') ───────────────────────

const path = (collection: SyncCollection, id: string): string => `${collection}/${id}`

export function computeOutbox(state: AppState, meta: SyncMeta): { docs: OutDoc[]; versions: Record<string, string> } {
  const docs: OutDoc[] = []
  const versions: Record<string, string> = {}
  const add = (collection: SyncCollection, id: string, data: object, version: string): void => {
    const p = path(collection, id)
    if (meta.versions[p] === version) return
    docs.push({ collection, id, data: { ...data } as Record<string, unknown> })
    versions[p] = version
  }
  if (state.profile) add('profile', PROFILE_DOC_ID, state.profile, docVersion(state.profile))
  for (const q of state.quests) add('quests', q.id, q, docVersion(q))
  for (const c of state.completions) add('completions', c.id, c, docVersion(c))
  for (const e of state.xpEvents) add('xpEvents', e.id, e, '1') // gli eventi sono immutabili
  return { docs, versions }
}

// ── motore ───────────────────────────────────────────────────────────────────

export interface SyncDeps {
  remote: RemoteStore
  getState(): AppState
  setState(next: AppState): void
  getMeta(): SyncMeta
  setMeta(next: SyncMeta): void
  now(): Date
}

export interface SyncReport {
  pushed: number
  merge: MergeStats
}

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size))

/**
 * Versioni che il cloud ha DAVVERO per i documenti appena letti. Se la copia locale e' piu' nuova
 * la differenza fa scattare il push; se e' uguale non serve nulla. Registrare la versione remota
 * anche quando diverge dalla locale e' essenziale: un altro dispositivo potrebbe aver
 * sovrascritto nel cloud una versione piu' vecchia, che altrimenti non ripubblicheremmo mai.
 */
function pulledVersions(remote: RemoteSnapshot): Record<string, string> {
  const out: Record<string, string> = {}
  for (const q of remote.quests) out[path('quests', q.id)] = docVersion(q)
  for (const c of remote.completions) out[path('completions', c.id)] = docVersion(c)
  if (remote.profile) out[path('profile', PROFILE_DOC_ID)] = docVersion(remote.profile)
  for (const e of remote.xpEvents) out[path('xpEvents', e.id)] = '1'
  return out
}

/**
 * Un ciclo di sync: pull incrementale -> unione -> push di cio' che manca nel cloud.
 * Lo stato viene letto/scritto tramite getState/setState AL MOMENTO giusto, cosi' le modifiche
 * dell'utente durante le chiamate di rete non vengono mai perse (finiscono nel ciclo successivo).
 */
export async function runSync(deps: SyncDeps): Promise<SyncReport> {
  const meta = deps.getMeta()
  const pulled = await deps.remote.pull(meta.cursor)
  const snapshot = pulled.snapshot

  const { state, stats } = mergeRemote(deps.getState(), snapshot, deps.now(), pulled.invalid ?? 0)
  deps.setState(state)

  let versions = { ...meta.versions, ...pulledVersions(snapshot) }
  const outbox = computeOutbox(deps.getState(), { ...meta, versions })
  for (const part of chunk(outbox.docs, PUSH_CHUNK)) {
    await deps.remote.push(part)
    for (const d of part) {
      const p = path(d.collection, d.id)
      versions = { ...versions, [p]: outbox.versions[p] as string }
    }
    deps.setMeta({ ...deps.getMeta(), versions }) // progresso salvato a ogni blocco: un'interruzione non rifa tutto
  }

  deps.setMeta({
    ...deps.getMeta(),
    versions,
    cursor: pulled.cursor ?? meta.cursor,
    lastSyncAt: deps.now().toISOString(),
  })
  return { pushed: outbox.docs.length, merge: stats }
}

/** Anteprima del PRIMO login: cosa succederebbe unendo locale e cloud, senza toccare nulla. */
export function previewMerge(local: AppState, remote: RemoteSnapshot, now: Date): MergeStats {
  return mergeRemote(local, remote, now).stats
}

export const isRemoteEmpty = (r: RemoteSnapshot): boolean =>
  !r.profile && r.quests.length === 0 && r.completions.length === 0 && r.xpEvents.length === 0

// ── persistenza dei metadati di sync ─────────────────────────────────────────

export const SYNC_META_KEY = 'questling:v1:sync'

export function parseSyncMeta(raw: string | null): SyncMeta {
  if (!raw) return emptySyncMeta()
  try {
    const v = JSON.parse(raw) as Partial<SyncMeta>
    if (typeof v !== 'object' || v === null) return emptySyncMeta()
    return {
      uid: typeof v.uid === 'string' ? v.uid : null,
      cursor: typeof v.cursor === 'string' ? v.cursor : null,
      versions: v.versions && typeof v.versions === 'object' ? (v.versions as Record<string, string>) : {},
      lastSyncAt: typeof v.lastSyncAt === 'string' ? v.lastSyncAt : null,
    }
  } catch {
    // Metadati illeggibili: si riparte da zero. E' sicuro (tutto e' idempotente): rifa pull e push completi.
    return emptySyncMeta()
  }
}
