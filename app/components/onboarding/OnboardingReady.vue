<script setup lang="ts">
// Riepilogo finale: grande segno di spunta, l'eroe saluta e si parte.
import { PALETTE } from '../../../data/icons'
import { CHARACTER_BY_ID } from '../../../data/characters'
import type { CharacterId } from '../../../core/types'

const props = defineProps<{
  characterId: CharacterId
  name: string
  counts: { daily: number; weekly: number; monthly: number }
  notifications: { enabled: boolean; morning: string; evening: string }
  dayEnd: number
  busy?: boolean
}>()
const emit = defineEmits<{ start: [] }>()

const { t } = useI18n()
const hero = useHero()
const heroName = computed(() => hero.name(props.characterId))
const accent = computed(() => CHARACTER_BY_ID[props.characterId].accent)
const questsText = computed(() => {
  const c = props.counts
  const parts = [
    c.daily ? t('onboarding.ready.perDay', { n: c.daily }) : '',
    c.weekly ? t('onboarding.ready.perWeek', { n: c.weekly }) : '',
    c.monthly ? t('onboarding.ready.perMonth', { n: c.monthly }) : '',
  ].filter(Boolean)
  return parts.length ? t('onboarding.ready.quests', { list: parts.join(', ') }) : t('onboarding.ready.questsNone')
})
</script>

<template>
  <section class="onb-screen ready" data-testid="step-ready" :style="{ '--hc': accent }">
    <div class="onb-head onb-head--short ready__head">
      <h2 class="onb-title" data-testid="ready-title">{{ t('onboarding.ready.title', { name }) }}</h2>
      <p class="onb-sub">{{ t('onboarding.ready.subtitle', { hero: heroName }) }}</p>
    </div>

    <div class="ready__stage">
      <div class="ready__glow" aria-hidden="true" />
      <HeroArt :character="characterId" state="happy" fluid :alt="heroName" />
    </div>

    <p class="ready__quote" data-testid="ready-line">“{{ hero.line(characterId, 'morning') }}”</p>

    <ul class="ready__list glass" data-testid="ready-summary">
      <li>
        <UiIconTile name="list-checks" :color="PALETTE.green" :size="34" />
        <span>{{ questsText }}</span>
      </li>
      <li>
        <UiIconTile name="bell" :color="PALETTE.gold" :size="34" />
        <span v-if="notifications.enabled">{{ t('onboarding.ready.notifOn', { morning: notifications.morning, evening: notifications.evening }) }}</span>
        <span v-else>{{ t('onboarding.ready.notifOff') }}</span>
      </li>
      <li>
        <UiIconTile name="moon" :color="PALETTE.violet" :size="34" />
        <span>{{ t('onboarding.ready.dayEnd', { h: dayEnd }) }}</span>
      </li>
      <li class="sr-only">{{ t('onboarding.ready.hero', { hero: heroName }) }}</li>
    </ul>

    <div class="onb-actions">
      <UiButton :disabled="busy" data-testid="ready-start" @click="emit('start')">{{ t('onboarding.ready.start') }}</UiButton>
    </div>
  </section>
</template>

<style scoped>
.ready__head {
  text-align: center;
}
.ready__stage {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: center;
  min-height: 0;
}
.ready__glow {
  position: absolute;
  inset: 4% -10% 0;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--hc) 50%, transparent), transparent 72%);
}
.ready__stage > :deep(.hero) {
  position: relative;
}
.ready__quote {
  position: relative;
  z-index: 1;
  margin: 8px 8px 0;
  min-height: 50px;
  text-align: center;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 19px;
  line-height: 25px;
  color: var(--text);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.85);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ready__list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 8px 0 0;
  padding: 10px 14px;
  list-style: none;
  border-radius: var(--radius-l);
}
.ready__list li:not(.sr-only) {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  line-height: 22px;
  font-weight: 600;
}
</style>
