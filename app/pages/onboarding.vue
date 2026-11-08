<script setup lang="ts">
import { CHARACTER_BY_ID } from '../../data/characters'
import { SUGGESTED_QUESTS } from '../../data/suggested-quests'
import { FOCUS_BY_ID, type FocusId } from '../../data/focus-areas'
import { DEFAULT_ICON } from '../../data/icons'
import { MAX_NAME_LENGTH, MAX_TITLE_LENGTH, type QuestInput } from '../../core/game'
import type { CharacterId, Period } from '../../core/types'
import { QUEST_CAPS, questXp } from '../../core/xp'
import { textsFor } from '../../data/notification-texts'
import splashScene from '../assets/scenes/onb-splash.webp'
import gladeScene from '../assets/scenes/onb-glade.webp'
import campfireScene from '../assets/scenes/onb-3.webp'

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
// gli eroi in fila sulla collina della schermata iniziale: [id, altezza]
const LINEUP: [CharacterId, number][] = [
  ['kuro', 112],
  ['valdo', 128],
  ['zeffiro', 142],
  ['lumen', 126],
  ['rondo', 110],
]

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
const sceneFor: Partial<Record<Step, string>> = { splash: splashScene, name: gladeScene, notify: campfireScene }
const scene = computed(() => sceneFor[step.value] ?? null)

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

const quizRef = ref<{ back: () => boolean; step: 'quiz' | 'reveal' } | null>(null)

const goBack = (): void => {
  // nel quiz "indietro" torna alla domanda precedente prima di lasciare il passo
  if (step.value === 'quiz' && quizRef.value?.back()) return
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
  <div class="onb" data-testid="page-onboarding">
    <OnboardingScene v-if="scene" :src="scene" />

    <!-- filo di avanzamento sottile e "indietro" (dall'intro al permesso notifiche) -->
    <div v-if="progress" class="onb-line" role="progressbar" :aria-label="t('onboarding.progressLabel')" :aria-valuemin="0" :aria-valuemax="TOTAL_STEPS" :aria-valuenow="progress">
      <i :style="{ width: `${(progress / TOTAL_STEPS) * 100}%` }" />
    </div>
    <header v-if="progress" class="onb-top">
      <button type="button" class="onb-back" :aria-label="t('onboarding.back')" data-testid="onb-back" @click="goBack">
        <UiIcon name="chevron-left" :size="26" />
      </button>
      <span class="sr-only" data-testid="onb-step">{{ t('onboarding.step', { n: progress, total: TOTAL_STEPS }) }}</span>
    </header>

    <!-- Schermata iniziale -->
    <section v-if="step === 'splash'" class="onb-screen splash" data-testid="step-splash">
      <div class="splash__lang"><LanguageSwitch compact /></div>
      <div class="splash__head">
        <svg viewBox="0 0 24 24" width="30" height="30" class="splash__star" aria-hidden="true"><path d="M12 1.5l2.1 7.4 7.4 2.1-7.4 2.1L12 20.5l-2.1-7.4L2.5 11l7.4-2.1z" fill="currentColor" /></svg>
        <h1 class="splash__word">{{ t('onboarding.splashTitle') }}</h1>
        <p class="onb-sub">{{ t('onboarding.splashSub') }}</p>
      </div>
      <div class="splash__lineup" aria-hidden="true">
        <HeroArt v-for="[id, h] in LINEUP" :key="id" :character="id" :size="h" />
      </div>
      <div class="onb-actions">
        <UiButton data-testid="splash-start" @click="step = 'intro'">{{ t('onboarding.intro.start') }}</UiButton>
        <NuxtLink v-if="account.available" to="/account" class="splash__link" data-testid="splash-account">{{ t('account.restoreHint') }}</NuxtLink>
      </div>
    </section>

    <OnboardingIntro v-else-if="step === 'intro'" @done="step = 'quiz'" />

    <!-- Quiz + rivelazione (oppure scelta diretta) -->
    <section v-else-if="step === 'quiz'" class="quiz-step onb-screen">
      <HeroQuiz ref="quizRef" @done="onQuizDone" />
      <div v-if="quizRef?.step !== 'reveal'" class="quiz-step__alt">
        <UiButton variant="ghost" data-testid="quiz-choose" @click="step = 'choose'">{{ t('onboarding.quizChoose') }}</UiButton>
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
    <section v-else-if="step === 'name' && characterId" class="onb-screen" data-testid="step-name">
      <div class="onb-head onb-head--short"><h2 class="onb-title">{{ t('onboarding.name.title', { hero: heroName }) }}</h2></div>
      <div class="name__stage">
        <HeroArt :character="characterId" fluid :alt="heroName" />
      </div>
      <form class="onb-actions" @submit.prevent="displayName.trim() && (step = 'focus')">
        <label class="name__field glass">
          <UiIcon name="user" :size="22" />
          <input
            v-model="displayName"
            type="text"
            autocomplete="off"
            :aria-label="t('onboarding.name.label')"
            :placeholder="t('onboarding.name.placeholder')"
            :maxlength="MAX_NAME_LENGTH"
            data-testid="name-input"
          />
        </label>
        <p class="name__hint">{{ t('onboarding.name.hint') }}</p>
        <UiButton type="submit" :disabled="!displayName.trim()" data-testid="name-next">{{ t('common.continue') }}</UiButton>
      </form>
    </section>

    <OnboardingFocus v-else-if="step === 'focus'" v-model="areas" @next="afterFocus" />

    <!-- Prime missioni -->
    <section v-else-if="step === 'quests' && characterId" class="onb-screen quests" data-testid="step-quests">
      <div class="onb-head onb-head--short">
        <h2 class="onb-title">{{ t('onboarding.quests.title') }}</h2>
        <p class="onb-sub">{{ t('onboarding.quests.subtitle', { hero: heroName }) }}</p>
      </div>

      <div class="quests__list">
        <h3 class="quests__label">{{ t('onboarding.quests.suggested', { hero: heroName }) }}</h3>
        <div v-for="item in heroItems" :key="item.id" class="qitem glass">
          <UiCheck :model-value="item.checked" :strike="false" :label="item.title" data-testid="suggested-item" @update:model-value="toggle(item, $event)">
            <span class="qitem__row">
              <UiIconTile :name="item.icon" :size="40" />
              <span class="qitem__text">
                <span class="qitem__title">{{ item.title }}</span>
                <span class="qitem__meta num">+{{ questXp(item.difficulty, item.period) }} XP · {{ t(`period.${item.period}Short`) }}</span>
              </span>
            </span>
          </UiCheck>
        </div>

        <template v-for="group in areaGroups" :key="group.id">
          <h3 class="quests__label" data-testid="area-group">{{ t(`focus.areas.${group.id}.title`) }}</h3>
          <div v-for="item in group.items" :key="item.id" class="qitem glass">
            <UiCheck :model-value="item.checked" :strike="false" :label="item.title" data-testid="area-item" @update:model-value="toggle(item, $event)">
              <span class="qitem__row">
                <UiIconTile :name="item.icon" :size="40" />
                <span class="qitem__text">
                  <span class="qitem__title">{{ item.title }}</span>
                  <span class="qitem__meta num">
                    +{{ questXp(item.difficulty, item.period) }} XP · {{ t(`period.${item.period}Short`) }}<template v-if="item.target > 1"> ×{{ item.target }}</template>
                  </span>
                </span>
              </span>
            </UiCheck>
          </div>
        </template>

        <h3 class="quests__label">{{ t('onboarding.quests.custom') }}</h3>
        <div v-for="item in customItems" :key="item.id" class="qitem glass qitem--custom">
          <UiCheck :model-value="item.checked" :strike="false" :label="item.title" @update:model-value="toggle(item, $event)" />
          <UiButton variant="secondary" compact :aria-label="t('onboarding.quests.remove', { title: item.title })" @click="removeItem(item.id)">×</UiButton>
        </div>
        <form class="quests__add" @submit.prevent="addCustom">
          <UiInput
            v-model="customTitle"
            class="flex-1"
            :label="t('onboarding.quests.addLabel')"
            :placeholder="t('onboarding.quests.addPlaceholder')"
            :maxlength="MAX_TITLE_LENGTH"
            data-testid="custom-input"
          />
          <UiButton type="submit" variant="secondary" :disabled="!customTitle.trim() || dailyFull" data-testid="custom-add">{{ t('onboarding.quests.addButton') }}</UiButton>
        </form>
        <p v-if="dailyFull" class="quests__note">{{ t('onboarding.quests.capNote', { max: QUEST_CAPS.daily }) }}</p>
        <p v-if="weeklyFull" class="quests__note">{{ t('onboarding.quests.capNoteWeekly', { max: QUEST_CAPS.weekly }) }}</p>
        <p v-if="!items.some((i) => i.checked)" class="quests__note quests__note--soft">{{ t('onboarding.quests.none') }}</p>
      </div>

      <div class="onb-actions">
        <UiButton data-testid="onboarding-finish" @click="step = 'rhythm'">{{ t('common.continue') }}</UiButton>
      </div>
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
    <section v-else-if="step === 'notify' && characterId" class="onb-screen notify" data-testid="step-notify">
      <div class="onb-head onb-head--short"><h2 class="onb-title">{{ t('notify.title', { hero: heroName }) }}</h2></div>
      <div class="notify__stage">
        <div class="notify__bubble" data-testid="notify-voice">{{ hero.permission(characterId) }}</div>
        <div class="notify__hero"><HeroArt :character="characterId" fluid :alt="heroName" /></div>
      </div>
      <div class="notify__info glass">
        <h3 class="notify__label">{{ t('notify.preview') }}</h3>
        <p class="notify__sample" data-testid="notify-sample">{{ textsFor(game.settings.locale).variants(characterId, 'morning')[0] }}</p>
        <p v-if="!notifications.isNative()" class="notify__web">{{ t('notify.webNote') }}</p>
      </div>
      <div class="onb-actions">
        <UiButton :disabled="busy" data-testid="notify-enable" @click="decideNotifications(true)">{{ t('notify.enable') }}</UiButton>
        <UiButton variant="ghost" :disabled="busy" data-testid="notify-skip" @click="decideNotifications(false)">{{ t('notify.skip') }}</UiButton>
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
.onb-line {
  position: fixed;
  top: var(--safe-top);
  left: 0;
  right: 0;
  z-index: 5;
  height: 3px;
  background: rgb(245 240 229 / 0.12);
}
.onb-line > i {
  display: block;
  height: 100%;
  background: var(--gold);
  border-radius: 0 3px 3px 0;
  transition: width 0.35s ease;
}
.onb-top {
  position: relative;
  z-index: 3;
  height: 44px;
  margin: -8px 0 0 -12px;
}
.onb-back {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  color: var(--text);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  filter: drop-shadow(0 2px 6px rgb(0 0 0 / 0.7));
}

/* Schermata iniziale */
.splash__lang {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 2;
}
.splash__head {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  text-align: center;
}
.splash__star {
  color: var(--gold);
  filter: drop-shadow(0 0 12px rgb(233 184 94 / 0.8));
}
.splash__word {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 58px;
  line-height: 62px;
  color: #f6dfa2;
  text-shadow:
    0 0 24px rgb(233 184 94 / 0.45),
    0 3px 16px rgb(0 0 0 / 0.7);
}
.splash__lineup {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-top: auto;
  margin-bottom: -6px;
}
.splash__lineup > :deep(.hero:not(:first-child)) {
  margin-left: -26px;
}
.splash__link {
  display: block;
  padding: 10px;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 4px;
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.8);
}

/* Quiz */
.quiz-step__alt {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-top: 12px;
}

/* Nome */
.name__stage {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: -4px;
}
.name__field {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 0 18px;
  margin: 4px;
  color: var(--text-soft);
  border-radius: 999px;
}
.name__field input {
  flex: 1;
  min-width: 0;
  height: 54px;
  font: inherit;
  font-size: 18px;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: none;
  user-select: text;
  -webkit-user-select: text;
}
.name__field input::placeholder {
  color: var(--text-muted);
}
.name__field:focus-within {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgb(233 184 94 / 0.25);
}
.name__hint {
  margin: 0 0 4px;
  text-align: center;
  font-size: 14px;
  color: var(--text);
  text-shadow: 0 2px 8px rgb(0 0 0 / 0.8);
}

/* Prime missioni */
.quests {
  gap: 0;
}
.quests__list {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  margin: 8px -4px 0;
  padding: 0 4px 24px;
  overflow-y: auto;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(180deg, #000 calc(100% - 28px), transparent);
  mask-image: linear-gradient(180deg, #000 calc(100% - 28px), transparent);
}
.quests__list::-webkit-scrollbar {
  display: none;
}
.quests__label {
  margin: 8px 4px 0;
  font-size: 13px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.qitem {
  padding: 6px 14px;
}
.qitem--custom {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qitem__row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.qitem__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.qitem__title {
  font-weight: 600;
  line-height: 22px;
}
.qitem__meta {
  font-size: 14px;
  font-weight: 600;
  color: var(--gold);
}
.quests__add {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.quests__note {
  margin: 0 4px;
  font-size: 14px;
  color: var(--warn);
}
.quests__note--soft {
  color: var(--text-soft);
}

/* Promemoria */
.notify__stage {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  min-height: 0;
}
.notify__hero {
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: flex-end;
  justify-content: center;
  margin-top: 16px;
}
.notify__bubble {
  position: relative;
  max-width: 330px;
  padding: 12px 18px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 19px;
  line-height: 24px;
  text-align: center;
  color: #1b2637;
  background: #f5f0e5;
  border-radius: 26px;
  box-shadow: 0 14px 30px -12px rgb(0 0 0 / 0.7);
}
.notify__bubble::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  width: 24px;
  height: 24px;
  background: #f5f0e5;
  border-radius: 4px;
  transform: translateX(-50%) rotate(45deg);
}
.notify__info {
  position: relative;
  z-index: 1;
  padding: 12px 16px;
  margin-top: 4px;
}
.notify__label {
  margin: 0 0 4px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.notify__sample {
  margin: 0 0 10px;
  padding: 8px 12px;
  background: var(--bg-3);
  border: 1px solid var(--edge);
  border-radius: 16px 16px 16px 6px;
}
.notify__list {
  margin: 0;
  padding-left: 18px;
  list-style: disc;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-soft);
}
.notify__web {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--text-muted);
}
.notify__skipnote {
  margin: 0 8px;
  text-align: center;
  font-size: 13px;
  color: var(--text);
  text-shadow: 0 2px 8px rgb(0 0 0 / 0.8);
}

@media (prefers-reduced-motion: reduce) {
  .onb-line > i {
    transition: none;
  }
}
</style>
