// Esporta/Importa backup JSON. L'import valida con Zod e restituisce un'anteprima:
// la sovrascrittura vera la decide e conferma l'utente nella UI.
import { levelFromXp } from './levels'
import { SCHEMA_VERSION, parseState } from './schema'
import type { AppState, CharacterId } from './types'
import { sumXp } from './xp'

export const BACKUP_FORMAT = 'questling-backup'

export interface BackupSummary {
  exportedAt: string | null
  displayName: string | null
  characterId: CharacterId | null
  level: number
  totalXp: number
  activeQuests: number
  completions: number
}

export type ImportFailure = 'not_json' | 'not_backup' | 'too_new' | 'invalid'

export type ImportResult =
  | { ok: true; state: AppState; summary: BackupSummary }
  | { ok: false; reason: ImportFailure; detail?: string }

export function exportBackup(state: AppState, now: Date): string {
  return JSON.stringify(
    { format: BACKUP_FORMAT, version: SCHEMA_VERSION, exportedAt: now.toISOString(), state },
    null,
    2,
  )
}

export function summarize(state: AppState, exportedAt: string | null): BackupSummary {
  const totalXp = sumXp(state.xpEvents)
  return {
    exportedAt,
    displayName: state.profile?.displayName ?? null,
    characterId: state.profile?.characterId ?? null,
    level: levelFromXp(totalXp).level,
    totalXp,
    activeQuests: state.quests.filter((q) => !q.archivedAt).length,
    completions: state.completions.length,
  }
}

export function parseBackup(text: string): ImportResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'not_json' }
  }
  if (typeof json !== 'object' || json === null) return { ok: false, reason: 'not_backup' }
  const envelope = json as { format?: unknown; exportedAt?: unknown; state?: unknown }
  if (envelope.format !== BACKUP_FORMAT || envelope.state === undefined) return { ok: false, reason: 'not_backup' }

  const parsed = parseState(envelope.state)
  if (!parsed.ok) {
    if (parsed.reason === 'too_new') return { ok: false, reason: 'too_new' }
    return { ok: false, reason: 'invalid', detail: parsed.detail ?? parsed.reason }
  }
  const exportedAt = typeof envelope.exportedAt === 'string' ? envelope.exportedAt : null
  return { ok: true, state: parsed.state, summary: summarize(parsed.state, exportedAt) }
}
