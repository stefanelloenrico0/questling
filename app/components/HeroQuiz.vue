<script setup lang="ts">
import { CHARACTER_BY_ID, CHARACTERS } from '../../data/characters'
import { QUIZ } from '../../data/quiz'
import { quizOutcome, scoreQuiz, shuffle, type QuizOutcome } from '../../core/quiz'
import type { CharacterId } from '../../core/types'

const emit = defineEmits<{ done: [payload: { answers: number[]; characterId: CharacterId }] }>()
const { t } = useI18n()
const hero = useHero()
const accentOverride = useAccentOverride()

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
const back = (): void => {
  if (index.value > 0) index.value--
}

const outcome = shallowRef<QuizOutcome | null>(null)
const selected = ref<CharacterId | null>(null)
const showAll = ref(false)
const revealed = ref(false)

function finishQuiz(): void {
  const o = quizOutcome(scoreQuiz(answers.value))
  outcome.value = o
  selected.value = o.kind === 'winner' ? (o.finalists[0]?.id ?? null) : null
  step.value = 'reveal'
  revealed.value = false
  setTimeout(() => (revealed.value = true), 900)
}

const candidates = computed<CharacterId[]>(() => {
  const o = outcome.value
  if (!o) return []
  return o.kind === 'winner' ? [...o.finalists, ...o.neighbors].map((r) => r.id) : o.finalists.map((r) => r.id)
})
const others = computed(() => CHARACTERS.map((c) => c.id).filter((id) => !candidates.value.includes(id)))
const affinities = computed(() => {
  const map: Partial<Record<CharacterId, number | null>> = {}
  for (const r of outcome.value?.ranked ?? []) map[r.id] = r.affinity
  return map
})
const tieNames = computed(() =>
  new Intl.ListFormat('it', { style: 'long', type: 'conjunction' }).format(
    (outcome.value?.finalists ?? []).map((r) => hero.name(r.id)),
  ),
)

watchEffect(() => {
  accentOverride.value = selected.value ? CHARACTER_BY_ID[selected.value].accent : null
})
onBeforeUnmount(() => {
  accentOverride.value = null
})

function confirm(): void {
  if (selected.value) emit('done', { answers: [...answers.value], characterId: selected.value })
}
</script>

<template>
  <section v-if="step === 'quiz'" class="flex flex-col gap-4" data-testid="quiz">
    <p class="font-display text-xs" data-testid="quiz-progress">{{ t('quiz.progress', { n: index + 1, total: QUIZ.length }) }}</p>
    <PixelBar :value="index + 1" :max="QUIZ.length" :blocks="QUIZ.length" :label="t('quiz.progressLabel')" />

    <PixelCard>
      <h2 class="mb-4" style="font-size: 20px" data-testid="quiz-question">{{ t(`quiz.q${question.id}.text`) }}</h2>
      <div class="flex flex-col gap-2" role="group" :aria-label="t('quiz.answers')">
        <PixelButton
          v-for="orig in displayOrder"
          :key="`${question.id}-${orig}`"
          :variant="answers[index] === orig ? 'primary' : 'secondary'"
          class="quiz-answer"
          :data-testid="`quiz-answer-${orig}`"
          @click="pick(orig)"
        >
          {{ t(`quiz.q${question.id}.a${orig}`) }}
        </PixelButton>
      </div>
    </PixelCard>

    <div v-if="index > 0">
      <PixelButton variant="secondary" @click="back">{{ t('quiz.back') }}</PixelButton>
    </div>
  </section>

  <section v-else class="flex flex-col gap-4" data-testid="reveal">
    <h2 class="font-display text-sm">{{ t('quiz.revealTitle') }}</h2>

    <PixelCard tone="accent">
      <div class="flex flex-col items-center gap-2 py-2">
        <div v-if="selected" class="reveal-sprite" :class="{ 'reveal-sprite--hidden': !revealed }">
          <PixelSprite :character="selected" :scale="6" :alt="hero.name(selected)" />
        </div>
        <div v-else class="font-display text-center" style="font-size: 48px; line-height: 1.4" aria-hidden="true">?</div>
        <p v-if="selected" class="font-display text-sm" data-testid="reveal-name">{{ hero.name(selected) }}</p>
        <p v-else class="font-display text-xs">{{ t('quiz.revealUnknown') }}</p>
        <p v-if="selected" class="text-[var(--text-soft)]">{{ hero.archetype(selected) }}</p>
        <p v-if="selected && affinities[selected] != null" class="text-[var(--xp)]" data-testid="reveal-affinity">
          {{ t('quiz.affinity', { pct: affinities[selected] }) }}
        </p>
      </div>
    </PixelCard>

    <p v-if="outcome?.kind === 'tie'" data-testid="reveal-tie">{{ t('quiz.tie', { names: tieNames }) }}</p>
    <p v-else-if="outcome?.kind === 'zero'" data-testid="reveal-zero">{{ t('quiz.zero') }}</p>

    <h3 class="font-display text-xs">{{ outcome?.kind === 'winner' ? t('quiz.neighbors') : t('quiz.candidates') }}</h3>
    <HeroGrid v-model="selected" :ids="candidates" :label="t('quiz.candidates')" :affinities="affinities" />

    <div>
      <PixelButton variant="secondary" @click="showAll = !showAll">
        {{ showAll ? t('quiz.hideAll') : t('quiz.showAll') }}
      </PixelButton>
    </div>
    <HeroGrid v-if="showAll" v-model="selected" :ids="others" :label="t('quiz.showAll')" />

    <div class="flex flex-col gap-2">
      <PixelButton :disabled="!selected" data-testid="reveal-confirm" @click="confirm">{{ t('quiz.confirm') }}</PixelButton>
      <p v-if="!selected" class="text-[var(--text-soft)]">{{ t('quiz.pickFirst') }}</p>
    </div>
  </section>
</template>

<style scoped>
.quiz-answer {
  width: calc(100% - 8px);
  text-align: left;
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.4;
}
.reveal-sprite {
  transition: filter 0.6s steps(4);
}
.reveal-sprite--hidden {
  filter: brightness(0) invert(0.35);
}
@media (prefers-reduced-motion: reduce) {
  .reveal-sprite {
    transition: none;
  }
}
</style>
