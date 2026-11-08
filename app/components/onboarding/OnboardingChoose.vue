<script setup lang="ts">
// Scelta diretta dell'eroe (alternativa al quiz) e "cambia eroe" dal passo del nome.
import { CHARACTER_BY_ID, QUIZ_CHARACTERS } from '../../../data/characters'
import type { CharacterId } from '../../../core/types'

const model = defineModel<CharacterId | null>({ default: null })
defineProps<{ showQuizLink?: boolean }>()
const emit = defineEmits<{ confirm: []; quiz: [] }>()

const { t } = useI18n()
const hero = useHero()
const ids = QUIZ_CHARACTERS.map((c) => c.id)
const accent = computed(() => (model.value ? CHARACTER_BY_ID[model.value].accent : 'var(--accent)'))
</script>

<template>
  <section class="flex flex-col gap-4" data-testid="step-choose" :style="{ '--hc': accent }">
    <h2 class="font-display text-sm">{{ t('onboarding.choose.title') }}</h2>
    <p class="text-[var(--text-soft)]">{{ t('onboarding.choose.subtitle') }}</p>

    <HeroGrid v-model="model" :ids="ids" :label="t('onboarding.choose.grid')" />

    <UiCard v-if="model" tone="accent" data-testid="choose-preview">
      <div class="flex items-center gap-3">
        <HeroArt :character="model" :size="120" :alt="hero.name(model)" />
        <div class="min-w-0">
          <p class="font-display text-sm" data-testid="choose-name">{{ hero.name(model) }}</p>
          <p class="text-[var(--text-soft)]">{{ hero.archetype(model) }}</p>
        </div>
      </div>
      <p class="mt-3"><span class="text-[var(--text-soft)]">{{ t('onboarding.choose.voice') }}:</span> {{ hero.voice(model) }}</p>
      <p class="mt-3 text-[var(--text-soft)]">{{ t('onboarding.choose.sample') }}</p>
      <p class="sample" data-testid="choose-sample">{{ hero.line(model, 'morning') }}</p>
    </UiCard>
    <p v-else class="text-[var(--text-soft)]">{{ t('onboarding.choose.pickFirst') }}</p>

    <div class="flex flex-col gap-2">
      <UiButton :disabled="!model" data-testid="choose-confirm" @click="emit('confirm')">
        {{ model ? t('onboarding.choose.confirm', { name: hero.name(model) }) : t('common.confirm') }}
      </UiButton>
      <UiButton v-if="showQuizLink" variant="secondary" data-testid="choose-quiz" @click="emit('quiz')">{{ t('onboarding.choose.quiz') }}</UiButton>
    </div>
  </section>
</template>

<style scoped>
.sample {
  margin-top: 6px;
  padding: 10px 14px;
  background: var(--bg-2);
  border: 1px solid var(--edge);
  border-radius: 18px 18px 18px 6px;
}
</style>
