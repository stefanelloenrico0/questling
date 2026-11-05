import { defineStore } from 'pinia'
import { CHARACTER_BY_ID } from '../../data/characters'
import {
  archiveQuest,
  completeOnboarding,
  createQuest,
  progressQuest,
  renameProfile,
  reorderQuests,
  setCharacter,
  setQuizAnswers,
  touchOpen,
  updateQuest,
  updateSettings,
  type ActionOutcome,
  type GameCtx,
  type OnboardingInput,
  type QuestInput,
  type QuestPatch,
  type QuestResult,
  type SettingsPatch,
} from '../../core/game'
import { ulid } from '../../core/id'
import type { LevelUpInfo } from '../../core/levels'
import { dayKey } from '../../core/periods'
import { STATE_KEY, loadState, saveState, type LoadResult } from '../../core/persistence'
import { createInitialState } from '../../core/schema'
import { computeStats, questRows, type QuestRowView } from '../../core/selectors'
import type { AppState, CharacterId, Period } from '../../core/types'
import { QUEST_CAPS } from '../../core/xp'

const SAVE_DEBOUNCE_MS = 300

export const useGameStore = defineStore('game', () => {
  // Stato trattato come immutabile: le azioni lo SOSTITUISCONO (shallowRef), niente deep watch.
  const state = shallowRef<AppState>(createInitialState(new Date()))
  const now = ref(new Date())
  const loaded = ref(false)
  const loadStatus = ref<LoadResult['status']>('fresh')
  const corruptKey = ref<string | null>(null)
  const pendingLevelUp = shallowRef<LevelUpInfo | null>(null)

  const profile = computed(() => state.value.profile)
  const character = computed(() => (profile.value ? CHARACTER_BY_ID[profile.value.characterId] : null))
  const settings = computed(() => state.value.settings)
  const stats = computed(() => computeStats(state.value, now.value))
  const today = computed(() => dayKey(now.value, state.value.settings.dayStartHour))

  function rows(period: Period): QuestRowView[] {
    return questRows(state.value, period, now.value)
  }
  const activeCount = (period: Period): number => rows(period).length
  const capReached = (period: Period): boolean => activeCount(period) >= QUEST_CAPS[period]

  function refreshNow(): void {
    now.value = new Date()
  }

  function ctx(): GameCtx {
    const d = new Date()
    now.value = d
    return { now: d, newId: () => ulid(Date.now(), Math.random) }
  }

  // ── persistenza ────────────────────────────────────────────────────────────
  let timer: ReturnType<typeof setTimeout> | null = null
  let dirty = false

  async function flush(): Promise<void> {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (!loaded.value || !dirty) return
    dirty = false
    await saveState(capacitorStore, state.value)
  }

  function scheduleSave(): void {
    if (!loaded.value) return
    dirty = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS)
  }

  watch(state, scheduleSave)

  async function load(): Promise<void> {
    const result = await loadState(capacitorStore, new Date())
    state.value = result.state
    loadStatus.value = result.status
    corruptKey.value = result.corruptKey ?? null
    now.value = new Date()
    loaded.value = true
  }

  // ── azioni di gioco ────────────────────────────────────────────────────────
  function apply(out: ActionOutcome): ActionOutcome {
    if (out.changed) {
      state.value = out.state
      if (out.levelUp) pendingLevelUp.value = out.levelUp
    }
    return out
  }

  const progress = (questId: string, direction: 1 | -1): ActionOutcome =>
    apply(progressQuest(state.value, questId, direction, ctx()))

  function addQuest(input: QuestInput): QuestResult {
    const res = createQuest(state.value, input, ctx())
    if (res.ok) state.value = res.state
    return res
  }

  function editQuest(questId: string, patch: QuestPatch): QuestResult {
    const res = updateQuest(state.value, questId, patch, ctx())
    if (res.ok) state.value = res.state
    return res
  }

  const removeQuest = (questId: string): ActionOutcome => apply(archiveQuest(state.value, questId, ctx()))

  function moveQuest(period: Period, questId: string, direction: -1 | 1): void {
    const ids = rows(period).map((r) => r.quest.id)
    const from = ids.indexOf(questId)
    const to = from + direction
    if (from < 0 || to < 0 || to >= ids.length) return
    ;[ids[from], ids[to]] = [ids[to] as string, ids[from] as string]
    state.value = reorderQuests(state.value, period, ids, ctx())
  }

  function chooseHero(characterId: CharacterId): void {
    state.value = setCharacter(state.value, characterId, ctx())
  }

  function applyQuiz(answers: readonly number[], characterId: CharacterId): void {
    const c = ctx()
    state.value = setCharacter(setQuizAnswers(state.value, answers, c), characterId, c)
  }

  function finishOnboarding(input: OnboardingInput): boolean {
    const next = completeOnboarding(state.value, input, ctx())
    if (!next) return false
    state.value = next
    return true
  }

  function rename(displayName: string): void {
    state.value = renameProfile(state.value, displayName, ctx())
  }

  function patchSettings(patch: SettingsPatch): void {
    state.value = updateSettings(state.value, patch)
    refreshNow()
  }

  const setDayStartHour = (dayStartHour: number): void => patchSettings({ dayStartHour })

  /** Apertura/ritorno in primo piano: serve ai promemoria di "ritorno". */
  function touchOpened(): void {
    state.value = touchOpen(state.value, new Date())
  }

  const dismissLevelUp = (): void => {
    pendingLevelUp.value = null
  }

  /** Sostituisce lo stato con uno importato, dopo aver conservato una copia di sicurezza di quello attuale. */
  async function importState(next: AppState): Promise<void> {
    await capacitorStore.set(`questling:v1:pre-import:${Date.now()}`, JSON.stringify(state.value))
    state.value = { ...next, lastOpenAt: new Date().toISOString() }
    pendingLevelUp.value = null
    refreshNow()
    await flush()
  }

  /** Sostituisce lo stato (usato dalla sync dopo l'unione). Non conserva copie: lo fa chi chiama se serve. */
  function replaceState(next: AppState): void {
    state.value = next
    refreshNow()
  }

  async function wipe(): Promise<void> {
    if (corruptKey.value) await capacitorStore.remove(corruptKey.value)
    state.value = createInitialState(new Date())
    corruptKey.value = null
    loadStatus.value = 'fresh'
    pendingLevelUp.value = null
    refreshNow()
    dirty = true
    await flush()
  }

  return {
    state,
    now,
    loaded,
    loadStatus,
    corruptKey,
    pendingLevelUp,
    profile,
    character,
    settings,
    stats,
    today,
    rows,
    activeCount,
    capReached,
    refreshNow,
    load,
    flush,
    progress,
    addQuest,
    editQuest,
    removeQuest,
    moveQuest,
    chooseHero,
    applyQuiz,
    finishOnboarding,
    rename,
    patchSettings,
    setDayStartHour,
    touchOpened,
    dismissLevelUp,
    importState,
    replaceState,
    wipe,
  }
})

export { STATE_KEY }
