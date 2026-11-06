<script setup lang="ts">
import { CHARACTERS, CHARACTER_BY_ID } from '../../data/characters'
import { SUGGESTED_QUESTS } from '../../data/suggested-quests'
import { DEFAULT_ICON } from '../../data/icons'
import { MAX_NAME_LENGTH, MAX_TITLE_LENGTH, type QuestInput } from '../../core/game'
import type { CharacterId } from '../../core/types'
import { QUEST_CAPS } from '../../core/xp'
import { notificationTexts } from '../../data/notification-texts'

definePageMeta({ layout: 'blank' })

type Step = 'splash' | 'intro' | 'quiz' | 'name' | 'quests' | 'notify'
interface Item extends QuestInput {
  id: string
  checked: boolean
  custom: boolean
}

const game = useGameStore()
const { t } = useI18n()
const hero = useHero()
const accentOverride = useAccentOverride()
const account = useAccountStore()
const notifications = useNotifications()
const permissionBusy = ref(false)

const step = ref<Step>('splash')
const slide = ref(0)
const SLIDES = 3
const characterId = ref<CharacterId | null>(null)
const answers = ref<number[]>([])
const displayName = ref('')
const items = ref<Item[]>([])
const customTitle = ref('')
let seq = 0

const heroName = computed(() => (characterId.value ? hero.name(characterId.value) : ''))
const dailyChecked = computed(() => items.value.filter((i) => i.checked && i.period === 'daily').length)
const dailyFull = computed(() => dailyChecked.value >= QUEST_CAPS.daily)

watch(
  [step, characterId],
  () => {
    accentOverride.value = characterId.value ? CHARACTER_BY_ID[characterId.value].accent : null
  },
  { flush: 'post' },
)
onBeforeUnmount(() => {
  accentOverride.value = null
})

function nextSlide(): void {
  if (slide.value < SLIDES - 1) slide.value++
  else step.value = 'quiz'
}

function onQuizDone(payload: { answers: number[]; characterId: CharacterId }): void {
  answers.value = payload.answers
  characterId.value = payload.characterId
  items.value = SUGGESTED_QUESTS[payload.characterId].map((s) => ({
    id: `s-${s.key}`,
    title: hero.questTitle(payload.characterId, s.key),
    icon: s.icon,
    difficulty: s.difficulty,
    period: s.period,
    target: s.target,
    checked: s.period === 'daily',
    custom: false,
  }))
  step.value = 'name'
}

function toggle(item: Item, value: boolean): void {
  if (value && item.period === 'daily' && dailyFull.value) return
  item.checked = value
}

function addCustom(): void {
  const title = customTitle.value.trim()
  if (!title || dailyFull.value) return
  items.value.push({
    id: `c-${++seq}`,
    title,
    icon: DEFAULT_ICON,
    difficulty: 'medium',
    period: 'daily',
    target: 1,
    checked: true,
    custom: true,
  })
  customTitle.value = ''
}

const removeItem = (id: string): void => {
  items.value = items.value.filter((i) => i.id !== id)
}

/** Il permesso notifiche si chiede qui, in un momento contestuale (dopo le prime missioni), mai al primo avvio. */
async function finish(wantNotifications: boolean): Promise<void> {
  if (!characterId.value || permissionBusy.value) return
  permissionBusy.value = true
  let enabled = false
  if (wantNotifications) {
    const result = await notifications.requestPermission()
    enabled = result === 'granted' || result === 'unsupported' // sul web si salva solo la preferenza
  }
  const ok = game.finishOnboarding({
    displayName: displayName.value,
    characterId: characterId.value,
    quizAnswers: answers.value,
    quests: items.value.filter((i) => i.checked).map(({ title, icon, difficulty, period, target }) => ({ title, icon, difficulty, period, target })),
  })
  if (ok) {
    if (enabled) game.patchSettings({ notifications: { enabled: true } })
    await navigateTo('/')
  }
  permissionBusy.value = false
}
</script>

<template>
  <div data-testid="page-onboarding">
    <!-- Splash -->
    <section v-if="step === 'splash'" class="flex flex-col items-center gap-6 pt-8 text-center" data-testid="step-splash">
      <h1 class="font-display text-lg">{{ t('onboarding.splashTitle') }}</h1>
      <p class="text-[var(--text-soft)]">{{ t('onboarding.splashSub') }}</p>
      <div class="grid grid-cols-4 gap-2" aria-hidden="true">
        <HeroArt v-for="c in CHARACTERS" :key="c.id" :character="c.id" :size="64" />
      </div>
      <UiButton data-testid="splash-start" @click="step = 'intro'">{{ t('onboarding.intro.start') }}</UiButton>
      <NuxtLink v-if="account.available" to="/account" class="underline" data-testid="splash-account">{{ t('account.restoreHint') }}</NuxtLink>
    </section>

    <!-- Intro (3 schermate, saltabili) -->
    <section v-else-if="step === 'intro'" class="flex flex-col gap-6 pt-8" data-testid="step-intro">
      <UiCard tone="accent">
        <h2 class="font-display mb-4 text-sm">{{ t(`onboarding.intro.s${slide + 1}Title`) }}</h2>
        <p>{{ t(`onboarding.intro.s${slide + 1}Body`) }}</p>
      </UiCard>
      <p class="text-center text-[var(--text-soft)]">{{ t('onboarding.intro.dots', { n: slide + 1, total: SLIDES }) }}</p>
      <div class="flex justify-between">
        <UiButton variant="secondary" data-testid="intro-skip" @click="step = 'quiz'">{{ t('onboarding.intro.skip') }}</UiButton>
        <UiButton data-testid="intro-next" @click="nextSlide">{{ t('onboarding.intro.next') }}</UiButton>
      </div>
    </section>

    <!-- Quiz + rivelazione -->
    <section v-else-if="step === 'quiz'" class="flex flex-col gap-4">
      <p class="text-[var(--text-soft)]">{{ t('onboarding.quizIntro') }}</p>
      <HeroQuiz @done="onQuizDone" />
    </section>

    <!-- Nome -->
    <section v-else-if="step === 'name' && characterId" class="flex flex-col gap-4" data-testid="step-name">
      <div class="flex justify-center"><HeroArt :character="characterId" :size="176" :alt="heroName" /></div>
      <h2 class="font-display text-center text-sm">{{ t('onboarding.name.title', { hero: heroName }) }}</h2>
      <form class="flex flex-col gap-4" @submit.prevent="displayName.trim() && (step = 'quests')">
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

    <!-- Prime missioni -->
    <section v-else-if="step === 'quests' && characterId" class="flex flex-col gap-4" data-testid="step-quests">
      <h2 class="font-display text-sm">{{ t('onboarding.quests.title') }}</h2>
      <p class="text-[var(--text-soft)]">{{ t('onboarding.quests.subtitle', { hero: heroName }) }}</p>

      <UiCard>
        <h3 class="font-display mb-2 text-xs">{{ t('onboarding.quests.suggested', { hero: heroName }) }}</h3>
        <div v-for="item in items.filter((i) => !i.custom)" :key="item.id" class="flex items-center gap-2">
          <UiCheck :model-value="item.checked" :label="item.title" data-testid="suggested-item" @update:model-value="toggle(item, $event)">
            <span class="flex items-center gap-3">
              <UiIcon :name="item.icon" :size="24" />
              <span>{{ item.title }}</span>
              <span class="text-[var(--text-soft)]">· {{ t(`period.${item.period}Short`) }}</span>
            </span>
          </UiCheck>
        </div>
      </UiCard>

      <UiCard>
        <h3 class="font-display mb-2 text-xs">{{ t('onboarding.quests.custom') }}</h3>
        <div v-for="item in items.filter((i) => i.custom)" :key="item.id" class="flex items-center gap-2">
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
      </UiCard>

      <p v-if="!items.some((i) => i.checked)" class="text-[var(--text-soft)]">{{ t('onboarding.quests.none') }}</p>
      <UiButton data-testid="onboarding-finish" @click="step = 'notify'">{{ t('common.continue') }}</UiButton>
    </section>

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
        <UiButton :disabled="permissionBusy" data-testid="notify-enable" @click="finish(true)">{{ t('notify.enable') }}</UiButton>
        <UiButton variant="secondary" :disabled="permissionBusy" data-testid="notify-skip" @click="finish(false)">{{ t('notify.skip') }}</UiButton>
        <p class="text-[var(--text-soft)]">{{ t('notify.skipNote') }}</p>
      </div>
    </section>
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
