<script setup lang="ts">
import { CHARACTER_BY_ID, QUIZ_CHARACTERS } from '../../data/characters'
import { PALETTE } from '../../data/icons'
import { QUIZ } from '../../data/quiz'
import { quizOutcome, scoreQuiz, shuffle, type QuizOutcome } from '../../core/quiz'
import type { CharacterId } from '../../core/types'
import gladeScene from '../assets/scenes/onb-glade.webp'

const emit = defineEmits<{ done: [payload: { answers: number[]; characterId: CharacterId }] }>()
const { t } = useI18n()
const hero = useHero()
const localeTag = useLocaleTag()
const accentOverride = useAccentOverride()

// Icona e colore di ogni risposta, per indice ORIGINALE (a0..a3) di ogni domanda (id 1..8).
const ANSWER_ICONS: Record<number, [string, string][]> = {
  1: [['list-checks', PALETTE.violet], ['map', PALETTE.gold], ['zap', PALETTE.green], ['wind', PALETTE.cyan]],
  2: [['book-open', PALETTE.cyan], ['puzzle', PALETTE.violet], ['bike', PALETTE.green], ['dumbbell', PALETTE.orange]],
  3: [['party-popper', PALETTE.pink], ['utensils', PALETTE.gold], ['heart', PALETTE.rose], ['sofa', PALETTE.violet]],
  4: [['rocket', PALETTE.orange], ['laugh', PALETTE.gold], ['clock', PALETTE.cyan], ['shield-check', PALETTE.sky]],
  5: [['layout-grid', PALETTE.sky], ['check', PALETTE.green], ['palette', PALETTE.pink], ['orbit', PALETTE.violet]],
  6: [['brain', PALETTE.pink], ['search', PALETTE.cyan], ['wrench', PALETTE.orange], ['swords', PALETTE.rose]],
  7: [['megaphone', PALETTE.gold], ['message-circle', PALETTE.sky], ['lock', PALETTE.violet], ['eye-off', PALETTE.teal]],
  8: [['skull', PALETTE.rose], ['gamepad-2', PALETTE.green], ['book-marked', PALETTE.cyan], ['sparkles', PALETTE.gold]],
}

const step = ref<'quiz' | 'reveal'>('quiz')
const index = ref(0)
const answers = ref<number[]>([])

// L'ordine di VISUALIZZAZIONE e' mescolato (anti bias di posizione); all'engine arriva l'indice ORIGINALE.
const orders = QUIZ.map(() => shuffle([0, 1, 2, 3], Math.random))
const question = computed(() => QUIZ[index.value]!)
const displayOrder = computed(() => orders[index.value]!)

function pick(original: number): void {
  answers.value[index.value] = original
  if (index.value < QUIZ.length - 1) index.value++
  else finishQuiz()
}

/** "Indietro" della pagina: torna alla domanda precedente (true) o lascia gestire alla pagina (false). */
function back(): boolean {
  if (step.value === 'reveal') {
    step.value = 'quiz'
    return true
  }
  if (index.value > 0) {
    index.value--
    return true
  }
  return false
}
defineExpose({ back, step })

const outcome = shallowRef<QuizOutcome | null>(null)
const selected = ref<CharacterId | null>(null)
const pickerOpen = ref(false)
const revealed = ref(false)

function finishQuiz(): void {
  const o = quizOutcome(scoreQuiz(answers.value))
  outcome.value = o
  selected.value = o.kind === 'winner' ? (o.finalists[0]?.id ?? null) : null
  step.value = 'reveal'
  revealed.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => (revealed.value = true)))
}

const candidates = computed<CharacterId[]>(() => {
  const o = outcome.value
  if (!o) return []
  return o.kind === 'winner' ? [...o.finalists, ...o.neighbors].map((r) => r.id) : o.finalists.map((r) => r.id)
})
const others = computed(() => QUIZ_CHARACTERS.map((c) => c.id).filter((id) => !candidates.value.includes(id)))
const affinities = computed(() => {
  const map: Partial<Record<CharacterId, number | null>> = {}
  for (const r of outcome.value?.ranked ?? []) map[r.id] = r.affinity
  return map
})
const selectedAffinity = computed(() => (selected.value ? (affinities.value[selected.value] ?? null) : null))
const undecided = computed(() => outcome.value?.kind !== 'winner')
const tieNames = computed(() =>
  new Intl.ListFormat(localeTag.value, { style: 'long', type: 'conjunction' }).format(
    (outcome.value?.finalists ?? []).map((r) => hero.name(r.id)),
  ),
)
// anello della percentuale: parte vuoto e si riempie appena compare l'eroe
const RING = 2 * Math.PI * 42
const ringOffset = computed(() => (revealed.value ? RING * (1 - Math.min(100, Math.max(0, selectedAffinity.value ?? 0)) / 100) : RING))

watchEffect(() => {
  accentOverride.value = selected.value ? CHARACTER_BY_ID[selected.value].accent : null
})
onBeforeUnmount(() => {
  accentOverride.value = null
})

function confirm(): void {
  if (selected.value) emit('done', { answers: [...answers.value], characterId: selected.value })
}
function onPick(id: CharacterId | null): void {
  if (!id) return
  selected.value = id
  pickerOpen.value = false
}
</script>

<template>
  <section v-if="step === 'quiz'" class="quiz onb-screen" data-testid="quiz">
    <div class="quiz__top">
      <p class="quiz__progress num" data-testid="quiz-progress">{{ t('quiz.progress', { n: index + 1, total: QUIZ.length }) }}</p>
      <div class="quiz__bar" role="progressbar" :aria-label="t('quiz.progressLabel')" :aria-valuemin="0" :aria-valuemax="QUIZ.length" :aria-valuenow="index + 1">
        <i :style="{ width: `${((index + 1) / QUIZ.length) * 100}%` }" />
      </div>
    </div>

    <div class="onb-head quiz__head">
      <h2 class="onb-title" data-testid="quiz-question">{{ t(`quiz.q${question.id}.text`) }}</h2>
    </div>

    <div class="quiz__answers" role="group" :aria-label="t('quiz.answers')">
      <button
        v-for="orig in displayOrder"
        :key="`${question.id}-${orig}`"
        type="button"
        class="qopt glass"
        :class="{ 'qopt--on': answers[index] === orig }"
        :data-testid="`quiz-answer-${orig}`"
        @click="pick(orig)"
      >
        <UiIconTile :name="ANSWER_ICONS[question.id]![orig]![0]" :color="ANSWER_ICONS[question.id]![orig]![1]" :size="48" />
        <span class="qopt__text">{{ t(`quiz.q${question.id}.a${orig}`) }}</span>
      </button>
    </div>
  </section>

  <section v-else class="reveal onb-screen" data-testid="reveal">
    <OnboardingScene :src="gladeScene" />
    <p class="reveal__eyebrow">{{ t('quiz.revealTitle') }}</p>

    <div class="reveal__stage" :class="{ 'reveal__stage--in': revealed }">
      <div class="reveal__glow" aria-hidden="true" />
      <HeroArt v-if="selected" :character="selected" fluid :tier="2" :alt="hero.name(selected)" />
      <div v-else class="reveal__unknown" aria-hidden="true">?</div>
    </div>

    <div class="reveal__info">
      <h2 v-if="selected" class="reveal__name" data-testid="reveal-name">{{ hero.name(selected) }}</h2>
      <h2 v-else class="reveal__name">{{ t('quiz.revealUnknown') }}</h2>
      <p v-if="selected" class="reveal__arch">{{ hero.archetype(selected) }}</p>

      <div v-if="selected && selectedAffinity != null" class="reveal__match">
        <div class="reveal__ring" aria-hidden="true">
          <svg viewBox="0 0 100 100" width="84" height="84">
            <circle cx="50" cy="50" r="42" fill="rgb(11 16 32 / 0.6)" stroke="rgb(233 184 94 / 0.2)" stroke-width="6" />
            <circle
              class="reveal__arc"
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--gold)"
              stroke-width="6"
              stroke-linecap="round"
              :stroke-dasharray="RING"
              :stroke-dashoffset="ringOffset"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <span class="reveal__pct num">{{ selectedAffinity }}%</span>
        </div>
        <p class="reveal__aff" data-testid="reveal-affinity">{{ t('quiz.affinity', { pct: selectedAffinity }) }}</p>
      </div>
      <p v-else-if="outcome?.kind === 'tie'" class="reveal__msg" data-testid="reveal-tie">{{ t('quiz.tie', { names: tieNames }) }}</p>
      <p v-else class="reveal__msg" data-testid="reveal-zero">{{ t('quiz.zero') }}</p>

      <!-- pareggio o equilibrio perfetto: si sceglie fra i candidati senza uscire dalla schermata -->
      <div v-if="undecided" class="reveal__picks" role="radiogroup" :aria-label="t('quiz.candidates')">
        <button
          v-for="id in candidates"
          :key="id"
          type="button"
          role="radio"
          class="pick"
          :class="{ 'pick--on': selected === id }"
          :aria-checked="selected === id"
          :aria-label="hero.name(id)"
          :data-testid="`hero-card-${id}`"
          @click="selected = id"
        >
          <HeroAvatar :character="id" :size="64" />
          <span class="pick__name">{{ hero.name(id) }}</span>
        </button>
      </div>
    </div>

    <div class="onb-actions">
      <UiButton :disabled="!selected" data-testid="reveal-confirm" @click="confirm">{{ t('quiz.confirm') }}</UiButton>
      <UiButton variant="ghost" data-testid="reveal-another" @click="pickerOpen = true">{{ t('quiz.another') }}</UiButton>
    </div>

    <UiDialog v-model:open="pickerOpen" :title="t('quiz.showAll')">
      <div class="picker">
        <HeroGrid :model-value="selected" :ids="[...candidates, ...others]" :label="t('quiz.showAll')" :affinities="affinities" @update:model-value="onPick" />
      </div>
      <template #actions>
        <UiButton variant="secondary" @click="pickerOpen = false">{{ t('common.close') }}</UiButton>
      </template>
    </UiDialog>
  </section>
</template>

<style scoped>
/* Domande: zone fisse (progresso, titolo da 3 righe, quattro risposte) */
.quiz__top {
  position: relative;
  z-index: 1;
}
.quiz__progress {
  margin: 0 0 6px;
  text-align: center;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--text-muted);
}
.quiz__bar {
  height: 4px;
  margin: 0 auto;
  width: 120px;
  overflow: hidden;
  background: rgb(245 240 229 / 0.14);
  border-radius: 999px;
}
.quiz__bar > i {
  display: block;
  height: 100%;
  background: var(--gold);
  border-radius: inherit;
  transition: width 0.3s ease;
}
.quiz__head {
  display: flex;
  align-items: flex-start;
  min-height: 132px;
  padding-top: 8px;
}
.quiz__head .onb-title {
  width: 100%;
}
.quiz__answers {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.qopt {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  height: 76px;
  padding: 0 16px;
  text-align: left;
  font-size: 17px;
  line-height: 22px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  border-radius: var(--radius-l);
  transition:
    transform 0.12s ease,
    border-color 0.15s ease;
}
.qopt:active {
  transform: scale(0.985);
}
.qopt--on {
  border-color: var(--gold);
  box-shadow: 0 0 0 2px rgb(233 184 94 / 0.3);
}
.qopt__text {
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Rivelazione: l'eroe occupa tutto lo spazio libero, il resto ha posti fissi */
.reveal__eyebrow {
  position: relative;
  z-index: 1;
  margin: 0;
  text-align: center;
  font-size: 14px;
  line-height: 20px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.8);
}
.reveal__stage {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-top: 6px;
  opacity: 0;
  transform: translateY(14px) scale(0.92);
  transition:
    opacity 0.55s ease,
    transform 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.15);
}
.reveal__stage--in {
  opacity: 1;
  transform: none;
}
/* bagliore dorato dietro l'eroe */
.reveal__glow {
  position: absolute;
  inset: 4% -10% 0;
  background:
    radial-gradient(closest-side, color-mix(in srgb, var(--accent) 55%, transparent), transparent 72%),
    radial-gradient(closest-side at 50% 60%, rgb(233 184 94 / 0.35), transparent 78%);
  filter: blur(6px);
}
.reveal__stage > :deep(.hero) {
  position: relative;
}
.reveal__unknown {
  align-self: center;
  font-family: var(--font-display);
  font-size: 150px;
  line-height: 1;
  color: var(--gold);
  text-shadow: 0 0 40px rgb(233 184 94 / 0.5);
}
.reveal__info {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 6px;
  text-align: center;
}
.reveal__name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 40px;
  line-height: 44px;
  color: #fff3d6;
  text-shadow:
    0 0 22px rgb(233 184 94 / 0.4),
    0 3px 14px rgb(0 0 0 / 0.8);
}
.reveal__arch {
  margin: 0;
  font-size: 18px;
  line-height: 26px;
  color: var(--text);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.85);
}
.reveal__match {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
}
.reveal__ring {
  position: relative;
  display: grid;
  place-items: center;
  filter: drop-shadow(0 0 12px rgb(233 184 94 / 0.4));
}
.reveal__ring svg {
  display: block;
}
.reveal__arc {
  transition: stroke-dashoffset 1.1s cubic-bezier(0.3, 0.7, 0.2, 1) 0.35s;
}
.reveal__pct {
  position: absolute;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
}
.reveal__aff {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--gold);
  text-shadow: 0 2px 8px rgb(0 0 0 / 0.85);
}
.reveal__msg {
  margin: 8px 8px 0;
  font-size: 16px;
  line-height: 22px;
  color: var(--text);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.85);
}
.reveal__picks {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 10px;
}
.pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
  padding: 6px;
  color: var(--text);
  background: transparent;
  border: 2px solid transparent;
  border-radius: 18px;
  cursor: pointer;
}
.pick--on {
  border-color: var(--gold);
  background: rgb(11 16 32 / 0.45);
}
.pick__name {
  font-size: 13px;
  font-weight: 700;
  text-shadow: 0 2px 8px rgb(0 0 0 / 0.9);
}
.picker {
  max-height: 55dvh;
  overflow-y: auto;
}
@media (prefers-reduced-motion: reduce) {
  .reveal__stage,
  .reveal__arc,
  .quiz__bar > i {
    transition: none;
  }
}
</style>
