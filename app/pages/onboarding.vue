<script setup lang="ts">
import { CHARACTER_BY_ID, QUIZ_CHARACTERS } from '../../data/characters'
import { SUGGESTED_QUESTS } from '../../data/suggested-quests'
import { FOCUS_BY_ID, type FocusId } from '../../data/focus-areas'
import { DEFAULT_ICON } from '../../data/icons'
import { MAX_NAME_LENGTH, MAX_TITLE_LENGTH, type QuestInput } from '../../core/game'
import type { CharacterId, Period } from '../../core/types'
import { QUEST_CAPS } from '../../core/xp'
import { notificationTexts } from '../../data/notification-texts'

definePageMeta({ layout: 'blank' })

// Percorso: splash > intro > (quiz | scelta diretta) > nome > aree > missioni > ritmo > promemoria > pronto
type Step = 'splash' | 'intro' | 'quiz' | 'choose' | 'name' | 'focus' | 'quests' | 'rhythm' | 'notify' | 'ready'
interface Item extends QuestInput {
  id: string
  checked: boolean
  source: 'hero' | 'custom' | FocusId
}

const PROGRESS: Partial<Record<Step, number>> = { intro: 1, quiz: 2, choose: 2, name: 3, focus: 4, quests: 5, rhythm: 6, notify: 7 }
const TOTAL_STEPS = 7
const BACK: Partial<Record<Step, Step>> = {
  intro: 'splash',
  quiz: 'intro',
  choose: 'intro',
  name: 'choose',
  focus: 'name',
  quests: 'focus',
  rhythm: 'quests',
  notify: 'rhythm',
}

const game = useGameStore()
const { t } = useI18n()
const hero = useHero()
const accentOverride = useAccentOverride()
const account = useAccountStore()
const notifications = useNotifications()
const busy = ref(false)

const step = ref<Step>('splash')
const characterId = ref<CharacterId | null>(null)
const pickedId = ref<CharacterId | null>(null) // selezione nella scelta diretta, prima di confermare
const answers = ref<number[]>([])
const displayName = ref('')
const areas = ref<FocusId[]>([])
const items = ref<Item[]>([])
const customTitle = ref('')
const morningTime = ref(game.settings.notifications.morningTime)
const eveningTime = ref(game.settings.notifications.eveningTime)
const dayEnd = ref(String(game.settings.dayStartHour))
const notifyEnabled = ref(false)
let seq = 0

const heroName = computed(() => (characterId.value ? hero.name(characterId.value) : ''))
const checkedCount = (period: Period): number => items.value.filter((i) => i.checked && i.period === period).length
const isFull = (period: Period): boolean => period !== 'monthly' && checkedCount(period) >= QUEST_CAPS[period]
const dailyFull = computed(() => isFull('daily'))
const weeklyFull = computed(() => isFull('weekly'))
const heroItems = computed(() => items.value.filter((i) => i.source === 'hero'))
const customItems = computed(() => items.value.filter((i) => i.source === 'custom'))
const areaGroups = computed(() =>
  areas.value.map((id) => ({ id, items: items.value.filter((i) => i.source === id) })).filter((g) => g.items.length > 0),
)
const progress = computed(() => PROGRESS[step.value] ?? 0)

watch(
  [step, characterId, pickedId],
  () => {
    const id = step.value === 'choose' ? (pickedId.value ?? characterId.value) : characterId.value
    accentOverride.value = id ? CHARACTER_BY_ID[id].accent : null
  },
  { flush: 'post' },
)
onBeforeUnmount(() => {
  accentOverride.value = null
})

const goBack = (): void => {
  const prev = BACK[step.value]
  if (!prev) return
  if (prev === 'choose') pickedId.value = characterId.value
  step.value = prev
}

/** Ricostruisce le proposte (eroe + aree) mantenendo le scelte gia' fatte e le missioni aggiunte a mano. */
function buildItems(): void {
  const id = characterId.value
  if (!id) return
  const prev = new Map(items.value.map((i) => [i.id, i]))
  const next: Item[] = SUGGESTED_QUESTS[id].map((s) => ({
    id: `s-${s.key}`,
    title: hero.questTitle(id, s.key),
    icon: s.icon,
    difficulty: s.difficulty,
    period: s.period,
    target: s.target,
    checked: prev.get(`s-${s.key}`)?.checked ?? s.period === 'daily',
    source: 'hero',
  }))
  for (const areaId of areas.value) {
    for (const q of FOCUS_BY_ID[areaId].quests) {
      const itemId = `a-${areaId}-${q.key}`
      next.push({
        id: itemId,
        title: t(`focus.areas.${areaId}.${q.key}`),
        icon: q.icon,
        difficulty: q.difficulty,
        period: q.period,
        target: q.target,
        checked: prev.get(itemId)?.checked ?? q.period === 'daily',
        source: areaId,
      })
    }
  }
  next.push(...items.value.filter((i) => i.source === 'custom'))
  // tetti: se le proposte ne superano uno, le ultime restano spente
  const used: Record<Period, number> = { daily: 0, weekly: 0, monthly: 0 }
  for (const item of next) {
    if (!item.checked) continue
    used[item.period]++
    if (item.period !== 'monthly' && used[item.period] > QUEST_CAPS[item.period]) item.checked = false
  }
  items.value = next
}

function chooseHero(id: CharacterId, quizAnswers: number[] = []): void {
  characterId.value = id
  pickedId.value = id
  answers.value = quizAnswers
  buildItems()
  step.value = 'name'
}

const onQuizDone = (payload: { answers: number[]; characterId: CharacterId }): void => chooseHero(payload.characterId, payload.answers)

function toggle(item: Item, value: boolean): void {
  if (value && !item.checked && isFull(item.period)) return
  item.checked = value
}

function addCustom(): void {
  const title = customTitle.value.trim()
  if (!title || dailyFull.value) return
  items.value.push({ id: `c-${++seq}`, title, icon: DEFAULT_ICON, difficulty: 'medium', period: 'daily', target: 1, checked: true, source: 'custom' })
  customTitle.value = ''
}

const removeItem = (id: string): void => {
  items.value = items.value.filter((i) => i.id !== id)
}

function afterFocus(): void {
  buildItems()
  step.value = 'quests'
}

/** Il permesso notifiche si chiede qui, in un momento contestuale (dopo missioni e orari), mai al primo avvio. */
async function decideNotifications(want: boolean): Promise<void> {
  if (busy.value) return
  busy.value = true
  if (want) {
    const result = await notifications.requestPermission()
    notifyEnabled.value = result === 'granted' || result === 'unsupported' // sul web si salva solo la preferenza
  } else {
    notifyEnabled.value = false
  }
  busy.value = false
  step.value = 'ready'
}

const counts = computed(() => ({
  daily: checkedCount('daily'),
  weekly: checkedCount('weekly'),
  monthly: checkedCount('monthly'),
}))

async function finish(): Promise<void> {
  if (!characterId.value || busy.value) return
  busy.value = true
  // prima le impostazioni: il giorno "logico" dipende dall'ora di fine giornata
  game.patchSettings({
    dayStartHour: Number(dayEnd.value),
    notifications: { morningTime: morningTime.value, eveningTime: eveningTime.value },
  })
  const ok = game.finishOnboarding({
    displayName: displayName.value,
    characterId: characterId.value,
    quizAnswers: answers.value.length ? answers.value : undefined,
    quests: items.value.filter((i) => i.checked).map(({ title, icon, difficulty, period, target }) => ({ title, icon, difficulty, period, target })),
  })
  if (ok) {
    if (notifyEnabled.value) game.patchSettings({ notifications: { enabled: true } })
    await navigateTo('/')
  }
  busy.value = false
}
</script>

<template>
  <div data-testid="page-onboarding">
    <!-- Barra di avanzamento con "indietro" (dall'intro al permesso notifiche) -->
    <header v-if="progress" class="mb-4 flex items-center gap-3">
      <UiButton variant="secondary" compact :aria-label="t('onboarding.back')" data-testid="onb-back" @click="goBack">
        <UiIcon name="chevron-left" :size="22" />
      </UiButton>
      <div class="min-w-0 flex-1">
        <UiBar :value="progress" :max="TOTAL_STEPS" :label="t('onboarding.progressLabel')" />
        <p class="mt-1 text-[var(--text-soft)]" data-testid="onb-step">{{ t('onboarding.step', { n: progress, total: TOTAL_STEPS }) }}</p>
      </div>
    </header>

    <!-- Splash -->
    <section v-if="step === 'splash'" class="flex flex-col items-center gap-6 pt-8 text-center" data-testid="step-splash">
      <h1 class="font-display text-lg">{{ t('onboarding.splashTitle') }}</h1>
      <p class="text-[var(--text-soft)]">{{ t('onboarding.splashSub') }}</p>
      <div class="grid grid-cols-4 gap-2" aria-hidden="true">
        <HeroArt v-for="c in QUIZ_CHARACTERS" :key="c.id" :character="c.id" :size="64" />
      </div>
      <UiButton data-testid="splash-start" @click="step = 'intro'">{{ t('onboarding.intro.start') }}</UiButton>
      <NuxtLink v-if="account.available" to="/account" class="underline" data-testid="splash-account">{{ t('account.restoreHint') }}</NuxtLink>
    </section>

    <OnboardingIntro v-else-if="step === 'intro'" @done="step = 'quiz'" />

    <!-- Quiz + rivelazione (oppure scelta diretta) -->
    <section v-else-if="step === 'quiz'" class="flex flex-col gap-4">
      <p class="text-[var(--text-soft)]">{{ t('onboarding.quizIntro') }}</p>
      <HeroQuiz @done="onQuizDone" />
      <div>
        <UiButton variant="secondary" data-testid="quiz-choose" @click="step = 'choose'">{{ t('onboarding.quizChoose') }}</UiButton>
      </div>
    </section>

    <OnboardingChoose
      v-else-if="step === 'choose'"
      v-model="pickedId"
      :show-quiz-link="answers.length === 0"
      @confirm="pickedId && chooseHero(pickedId, pickedId === characterId ? answers : [])"
      @quiz="step = 'quiz'"
    />

    <!-- Nome -->
    <section v-else-if="step === 'name' && characterId" class="flex flex-col gap-4" data-testid="step-name">
      <div class="flex justify-center"><HeroArt :character="characterId" :size="176" :alt="heroName" /></div>
      <h2 class="font-display text-center text-sm">{{ t('onboarding.name.title', { hero: heroName }) }}</h2>
      <form class="flex flex-col gap-4" @submit.prevent="displayName.trim() && (step = 'focus')">
        <UiInput
          v-model="displayName"
          :label="t('onboarding.name.label')"
          :placeholder="t('onboarding.name.placeholder')"
          :maxlength="MAX_NAME_LENGTH"
          data-testid="name-input"
        />
        <p class="text-[var(--text-soft)]">{{ t('onboarding.name.hint') }}</p>
        <UiButton type="submit" :disabled="!displayName.trim()" data-testid="name-next">{{ t('common.continue') }}</UiButton>
      </form>
    </section>

    <OnboardingFocus v-else-if="step === 'focus'" v-model="areas" @next="afterFocus" />

    <!-- Prime missioni -->
    <section v-else-if="step === 'quests' && characterId" class="flex flex-col gap-4" data-testid="step-quests">
      <h2 class="font-display text-sm">{{ t('onboarding.quests.title') }}</h2>
      <p class="text-[var(--text-soft)]">{{ t('onboarding.quests.subtitle', { hero: heroName }) }}</p>

      <UiCard>
        <h3 class="font-display mb-2 text-xs">{{ t('onboarding.quests.suggested', { hero: heroName }) }}</h3>
        <div v-for="item in heroItems" :key="item.id" class="flex items-center gap-2">
          <UiCheck :model-value="item.checked" :label="item.title" data-testid="suggested-item" @update:model-value="toggle(item, $event)">
            <span class="flex items-center gap-3">
              <UiIcon :name="item.icon" :size="24" />
              <span>{{ item.title }}</span>
              <span class="text-[var(--text-soft)]">· {{ t(`period.${item.period}Short`) }}</span>
            </span>
          </UiCheck>
        </div>
      </UiCard>

      <UiCard v-for="group in areaGroups" :key="group.id" data-testid="area-group">
        <h3 class="font-display mb-2 text-xs">{{ t(`focus.areas.${group.id}.title`) }}</h3>
        <div v-for="item in group.items" :key="item.id" class="flex items-center gap-2">
          <UiCheck :model-value="item.checked" :label="item.title" data-testid="area-item" @update:model-value="toggle(item, $event)">
            <span class="flex items-center gap-3">
              <UiIcon :name="item.icon" :size="24" />
              <span>{{ item.title }}</span>
              <span class="text-[var(--text-soft)]">· {{ t(`period.${item.period}Short`) }}<template v-if="item.target > 1"> ×{{ item.target }}</template></span>
            </span>
          </UiCheck>
        </div>
      </UiCard>

      <UiCard>
        <h3 class="font-display mb-2 text-xs">{{ t('onboarding.quests.custom') }}</h3>
        <div v-for="item in customItems" :key="item.id" class="flex items-center gap-2">
          <UiCheck :model-value="item.checked" :label="item.title" @update:model-value="toggle(item, $event)" />
          <UiButton variant="secondary" compact :aria-label="t('onboarding.quests.remove', { title: item.title })" @click="removeItem(item.id)">×</UiButton>
        </div>
        <form class="mt-2 flex items-end gap-2" @submit.prevent="addCustom">
          <div class="flex-1">
            <UiInput
              v-model="customTitle"
              :label="t('onboarding.quests.addLabel')"
              :placeholder="t('onboarding.quests.addPlaceholder')"
              :maxlength="MAX_TITLE_LENGTH"
              data-testid="custom-input"
            />
          </div>
          <UiButton type="submit" variant="secondary" :disabled="!customTitle.trim() || dailyFull" data-testid="custom-add">{{ t('onboarding.quests.addButton') }}</UiButton>
        </form>
        <p v-if="dailyFull" class="mt-2 text-[var(--warn)]">{{ t('onboarding.quests.capNote', { max: QUEST_CAPS.daily }) }}</p>
        <p v-if="weeklyFull" class="mt-2 text-[var(--warn)]">{{ t('onboarding.quests.capNoteWeekly', { max: QUEST_CAPS.weekly }) }}</p>
      </UiCard>

      <p v-if="!items.some((i) => i.checked)" class="text-[var(--text-soft)]">{{ t('onboarding.quests.none') }}</p>
      <UiButton data-testid="onboarding-finish" @click="step = 'rhythm'">{{ t('common.continue') }}</UiButton>
    </section>

    <OnboardingRhythm
      v-else-if="step === 'rhythm' && characterId"
      v-model:morning="morningTime"
      v-model:evening="eveningTime"
      v-model:day-end="dayEnd"
      :hero-name="heroName"
      @next="step = 'notify'"
    />

    <!-- Permesso notifiche (contestuale, nella voce dell'eroe) -->
    <section v-else-if="step === 'notify' && characterId" class="flex flex-col gap-4" data-testid="step-notify">
      <div class="flex justify-center"><HeroArt :character="characterId" :size="176" :alt="heroName" /></div>
      <h2 class="font-display text-center text-sm">{{ t('notify.title', { hero: heroName }) }}</h2>
      <UiCard tone="accent">
        <p data-testid="notify-voice">{{ hero.permission(characterId) }}</p>
      </UiCard>
      <UiCard>
        <h3 class="font-display mb-2 text-xs">{{ t('notify.preview') }}</h3>
        <p class="notify-sample" data-testid="notify-sample">{{ notificationTexts.variants(characterId, 'morning')[0] }}</p>
        <h3 class="font-display mt-4 mb-2 text-xs">{{ t('notify.what') }}</h3>
        <ul class="flex list-disc flex-col gap-1 pl-5">
          <li>{{ t('notify.list1') }}</li>
          <li>{{ t('notify.list2') }}</li>
          <li>{{ t('notify.list3') }}</li>
        </ul>
      </UiCard>
      <p v-if="!notifications.isNative()" class="text-[var(--text-soft)]">{{ t('notify.webNote') }}</p>
      <div class="flex flex-col gap-2">
        <UiButton :disabled="busy" data-testid="notify-enable" @click="decideNotifications(true)">{{ t('notify.enable') }}</UiButton>
        <UiButton variant="secondary" :disabled="busy" data-testid="notify-skip" @click="decideNotifications(false)">{{ t('notify.skip') }}</UiButton>
        <p class="text-[var(--text-soft)]">{{ t('notify.skipNote') }}</p>
      </div>
    </section>

    <OnboardingReady
      v-else-if="step === 'ready' && characterId"
      :character-id="characterId"
      :name="displayName.trim()"
      :counts="counts"
      :notifications="{ enabled: notifyEnabled, morning: morningTime, evening: eveningTime }"
      :day-end="Number(dayEnd)"
      :busy="busy"
      @start="finish"
    />
  </div>
</template>

<style scoped>
.notify-sample {
  padding: 10px 14px;
  background: var(--bg-2);
  border: 1px solid var(--edge);
  border-radius: 18px 18px 18px 6px;
}
</style>
