<script setup lang="ts">
// Scelta diretta dell'eroe (alternativa al quiz): l'eroe scelto in grande, gli altri come ritratti.
import { CHARACTER_BY_ID, QUIZ_CHARACTERS } from '../../../data/characters'
import type { CharacterId } from '../../../core/types'
import gladeScene from '../../assets/scenes/onb-glade.webp'

const model = defineModel<CharacterId | null>({ default: null })
defineProps<{ showQuizLink?: boolean }>()
const emit = defineEmits<{ confirm: []; quiz: [] }>()

const { t } = useI18n()
const hero = useHero()
const ids = QUIZ_CHARACTERS.map((c) => c.id)
const accent = computed(() => (model.value ? CHARACTER_BY_ID[model.value].accent : 'var(--accent)'))
</script>

<template>
  <section class="onb-screen choose" data-testid="step-choose" :style="{ '--hc': accent }">
    <OnboardingScene :src="gladeScene" />
    <div class="onb-head onb-head--short">
      <h2 class="onb-title">{{ t('onboarding.choose.title') }}</h2>
    </div>

    <div class="choose__stage">
      <div class="choose__glow" aria-hidden="true" />
      <HeroArt v-if="model" :key="model" :character="model" fluid :alt="hero.name(model)" />
      <p v-else class="choose__empty">{{ t('onboarding.choose.pickFirst') }}</p>
    </div>

    <div class="choose__info" data-testid="choose-preview">
      <template v-if="model">
        <p class="choose__name" data-testid="choose-name">{{ hero.name(model) }}</p>
        <p class="choose__arch">{{ hero.archetype(model) }}</p>
        <p class="choose__sample" data-testid="choose-sample">“{{ hero.line(model, 'morning') }}”</p>
      </template>
    </div>

    <div class="choose__picks" role="radiogroup" :aria-label="t('onboarding.choose.grid')">
      <button
        v-for="id in ids"
        :key="id"
        type="button"
        role="radio"
        class="pick"
        :class="{ 'pick--on': model === id }"
        :aria-checked="model === id"
        :aria-label="hero.name(id)"
        :data-testid="`hero-card-${id}`"
        @click="model = id"
      >
        <HeroAvatar :character="id" :size="58" />
      </button>
    </div>

    <div class="onb-actions">
      <UiButton :disabled="!model" data-testid="choose-confirm" @click="emit('confirm')">
        {{ model ? t('onboarding.choose.confirm', { name: hero.name(model) }) : t('common.confirm') }}
      </UiButton>
      <UiButton v-if="showQuizLink" variant="ghost" data-testid="choose-quiz" @click="emit('quiz')">{{ t('onboarding.choose.quiz') }}</UiButton>
    </div>
  </section>
</template>

<style scoped>
.choose__stage {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: center;
  min-height: 0;
}
.choose__glow {
  position: absolute;
  inset: 6% -10% 0;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--hc) 50%, transparent), transparent 72%);
  filter: blur(6px);
}
.choose__stage > :deep(.hero) {
  position: relative;
}
.choose__empty {
  align-self: center;
  margin: 0;
  text-align: center;
  color: var(--text);
  text-shadow: 0 2px 8px rgb(0 0 0 / 0.8);
}
.choose__info {
  position: relative;
  z-index: 1;
  min-height: 112px;
  padding-top: 8px;
  text-align: center;
}
.choose__name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 32px;
  line-height: 36px;
  color: #fff3d6;
  text-shadow: 0 3px 14px rgb(0 0 0 / 0.8);
}
.choose__arch {
  margin: 0;
  font-size: 16px;
  line-height: 22px;
  color: var(--text);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.85);
}
.choose__sample {
  margin: 6px 12px 0;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 17px;
  line-height: 22px;
  color: var(--text-soft);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.85);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.choose__picks {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  justify-items: center;
  gap: 10px 6px;
  padding: 4px 0 2px;
}
.pick {
  display: grid;
  place-items: center;
  width: 66px;
  height: 66px;
  padding: 0;
  background: transparent;
  border: 3px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0.8;
  transition:
    opacity 0.15s ease,
    transform 0.12s ease;
}
.pick:active {
  transform: scale(0.94);
}
.pick--on {
  opacity: 1;
  border-color: var(--gold);
  box-shadow: 0 0 18px -4px var(--gold);
}
</style>
