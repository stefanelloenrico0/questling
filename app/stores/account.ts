import { defineStore } from 'pinia'
import {
  SYNC_META_KEY,
  emptySyncMeta,
  isRemoteEmpty,
  parseSyncMeta,
  previewMerge,
  runSync,
  type MergeStats,
  type SyncMeta,
} from '../../core/sync'
import { createAccountService, mapAuthError, type AccountUser, type AuthErrorCode, type SocialProvider } from '../services/account'
import { isConfigured, type FirebaseConfig } from '../services/firebase'

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error'

/** Primo accesso di questo account su questo dispositivo, con dati da unire: si chiede conferma. */
export interface PendingMerge {
  uid: string
  stats: MergeStats
  /** Il dispositivo era collegato a un ALTRO account: l'unione mescolerebbe i dati dei due. */
  otherAccount: boolean
}

const SYNC_DEBOUNCE_MS = 4000
const SYNC_INTERVAL_MS = 5 * 60 * 1000

export const useAccountStore = defineStore('account', () => {
  const game = useGameStore()
  const config = useRuntimeConfig().public.firebase as FirebaseConfig
  const available = isConfigured(config)
  const service = available ? createAccountService(config) : null

  const user = ref<AccountUser | null>(null)
  const ready = ref(!available) // lo stato di login e' stato risolto
  const busy = ref(false) // un'operazione di login/registrazione/eliminazione e' in corso
  const authError = ref<AuthErrorCode | null>(null)
  const syncStatus = ref<SyncStatus>('idle')
  const syncError = ref<AuthErrorCode | null>(null)
  const lastSyncAt = ref<string | null>(null)
  const syncCount = ref(0) // sync completate con successo (serve ai test e all'interfaccia)
  const pendingMerge = shallowRef<PendingMerge | null>(null)

  let meta: SyncMeta = emptySyncMeta()
  let syncing = false
  let again = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let started = false

  const signedIn = computed(() => user.value !== null)

  function persistMeta(): void {
    void capacitorStore.set(SYNC_META_KEY, JSON.stringify(meta))
  }
  function setMeta(next: SyncMeta): void {
    meta = next
    lastSyncAt.value = meta.lastSyncAt
    persistMeta()
  }

  // ── sync ───────────────────────────────────────────────────────────────────
  async function syncNow(): Promise<void> {
    if (!service || !user.value || pendingMerge.value) return
    if (syncing) {
      again = true
      return
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      syncStatus.value = 'offline'
      return
    }
    syncing = true
    syncStatus.value = 'syncing'
    syncError.value = null
    try {
      const remote = await service.remote()
      if (!remote) return
      await runSync({
        remote,
        getState: () => game.state,
        setState: (s) => game.replaceState(s),
        getMeta: () => meta,
        setMeta,
        now: () => new Date(),
      })
      syncStatus.value = 'idle'
      syncCount.value++
    } catch (e) {
      const code = mapAuthError(e)
      syncError.value = code
      syncStatus.value = code === 'network' ? 'offline' : 'error'
      console.warn('[sync] fallita', e)
    } finally {
      syncing = false
      if (again) {
        again = false
        scheduleSync()
      }
    }
  }

  function scheduleSync(): void {
    if (!service || !user.value || pendingMerge.value) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => void syncNow(), SYNC_DEBOUNCE_MS)
  }

  // ── login ──────────────────────────────────────────────────────────────────
  const hasLocalData = (): boolean => game.state.profile !== null

  async function onSignedIn(u: AccountUser): Promise<void> {
    if (meta.uid === u.uid) {
      await syncNow() // stesso account di sempre: sync incrementale silenziosa
      return
    }
    // Primo accesso di questo account su questo dispositivo: si guarda cosa c'e' nel cloud.
    try {
      const remote = await service!.remote()
      if (!remote) return
      const pulled = await remote.pull(null)
      if (isRemoteEmpty(pulled.snapshot) || !hasLocalData()) {
        await applyMerge(u.uid) // niente da unire davvero: nessun rischio, nessuna domanda
        return
      }
      pendingMerge.value = {
        uid: u.uid,
        stats: previewMerge(game.state, pulled.snapshot, new Date()),
        otherAccount: meta.uid !== null && meta.uid !== u.uid,
      }
    } catch (e) {
      syncStatus.value = 'error'
      syncError.value = mapAuthError(e)
    }
  }

  /** Collega il dispositivo all'account e sincronizza. Prima conserva una copia dei dati locali. */
  async function applyMerge(uid: string): Promise<void> {
    if (hasLocalData()) {
      await capacitorStore.set(`questling:v1:pre-sync:${Date.now()}`, JSON.stringify(game.state))
    }
    setMeta({ ...emptySyncMeta(), uid })
    pendingMerge.value = null
    await syncNow()
  }

  const confirmMerge = async (): Promise<void> => {
    if (pendingMerge.value) await applyMerge(pendingMerge.value.uid)
  }

  /** Annulla l'unione: si esce dall'account e i dati locali restano esattamente com'erano. */
  async function cancelMerge(): Promise<void> {
    pendingMerge.value = null
    await signOut()
  }

  async function handleUser(u: AccountUser | null): Promise<void> {
    user.value = u
    ready.value = true
    if (!u) {
      syncStatus.value = 'idle'
      return
    }
    await onSignedIn(u)
  }

  // ── azioni esposte alla UI ───────────────────────────────────────────────────
  async function run(action: () => Promise<void>): Promise<boolean> {
    if (!service) return false
    busy.value = true
    authError.value = null
    try {
      await action()
      return true
    } catch (e) {
      authError.value = mapAuthError(e)
      return false
    } finally {
      busy.value = false
    }
  }

  const signUp = (email: string, password: string): Promise<boolean> => run(() => service!.signUp(email, password))
  const signIn = (email: string, password: string): Promise<boolean> => run(() => service!.signIn(email, password))
  const signInWith = (provider: SocialProvider): Promise<boolean> => run(() => service!.signInWith(provider))
  const sendPasswordReset = (email: string): Promise<boolean> => run(() => service!.sendPasswordReset(email))

  async function signOut(): Promise<void> {
    if (!service) return
    // Il dispositivo resta collegato (meta.uid): al prossimo accesso con lo stesso account la sync e' incrementale.
    await game.flush()
    await service.signOut()
    user.value = null
    syncStatus.value = 'idle'
  }

  /** Elimina l'account: ri-autentica, cancella i dati nel cloud e l'account. I dati locali restano. */
  async function deleteAccount(password?: string): Promise<boolean> {
    const ok = await run(() => service!.deleteAccount({ password }))
    if (ok) {
      setMeta(emptySyncMeta())
      user.value = null
      syncStatus.value = 'idle'
    }
    return ok
  }

  // ── avvio (dal plugin, dopo il primo render) ───────────────────────────────────
  async function init(): Promise<void> {
    if (!service || started) return
    started = true
    setMeta(parseSyncMeta(await capacitorStore.get(SYNC_META_KEY)))
    // Ogni cambiamento dello stato (azioni, ritorno in primo piano...) fa partire una sync a bassa frequenza
    watch(() => game.state, scheduleSync)
    window.addEventListener('online', () => void syncNow())
    window.setInterval(() => void syncNow(), SYNC_INTERVAL_MS)
    try {
      await service.onAuthChange((u) => void handleUser(u))
    } catch (e) {
      // Impossibile caricare Firebase: l'app resta pienamente utilizzabile in locale
      console.warn('[account] Firebase non disponibile', e)
      ready.value = true
    }
  }

  return {
    available,
    ready,
    busy,
    user,
    signedIn,
    authError,
    syncStatus,
    syncError,
    lastSyncAt,
    syncCount,
    pendingMerge,
    init,
    syncNow,
    signUp,
    signIn,
    signInWith,
    sendPasswordReset,
    signOut,
    deleteAccount,
    confirmMerge,
    cancelMerge,
  }
})
