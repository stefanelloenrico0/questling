<script setup lang="ts">
// Riepilogo finale: grande segno di spunta, l'eroe saluta e si parte.
import { PALETTE } from '../../../data/icons'
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
  <section class="onb-screen ready" data-testid="step-ready">
    <div class="ready__top">
      <div class="ready__check" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="56" height="56"><path d="M5 12.5 10 17.5 19.5 7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </div>
      <h2 class="onb-title" data-testid="ready-title">{{ t('onboarding.ready.title', { name }) }}</h2>
      <p class="onb-sub">{{ t('onboarding.ready.subtitle', { hero: heroName }) }}</p>
      <p class="ready__quote" data-testid="ready-line">{{ hero.line(characterId, 'morning') }}</p>
    </div>

    <ul class="ready__list" data-testid="ready-summary">
      <li class="glass">
        <UiIconTile name="shield" :color="PALETTE.sky" :size="40" />
        <span>{{ t('onboarding.ready.hero', { hero: heroName }) }}</span>
      </li>
      <li class="glass">
        <UiIconTile name="list-checks" :color="PALETTE.green" :size="40" />
        <span>{{ questsText }}</span>
      </li>
      <li class="glass">
        <UiIconTile name="bell" :color="PALETTE.gold" :size="40" />
        <span v-if="notifications.enabled">{{ t('onboarding.ready.notifOn', { morning: notifications.morning, evening: notifications.evening }) }}</span>
        <span v-else>{{ t('onboarding.ready.notifOff') }}</span>
      </li>
      <li class="glass">
        <UiIconTile name="moon" :color="PALETTE.violet" :size="40" />
        <span>{{ t('onboarding.ready.dayEnd', { h: dayEnd }) }}</span>
      </li>
    </ul>

    <div class="onb-actions">
      <UiButton :disabled="busy" data-testid="ready-start" @click="emit('start')">{{ t('onboarding.ready.start') }}</UiButton>
    </div>
  </section>
</template>

<style scoped>
.ready__top {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 24px;
}
.ready__check {
  display: grid;
  place-items: center;
  width: 108px;
  height: 108px;
  margin-bottom: 18px;
  background: radial-gradient(circle at 35% 28%, #8fe0a4, #4aa76a 70%);
  border-radius: 50%;
  box-shadow:
    inset 0 2px 0 rgb(255 255 255 / 0.35),
    0 0 40px -6px rgb(114 189 138 / 0.7);
}
.ready__quote {
  margin: 14px 8px 0;
  max-width: 32ch;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 19px;
  line-height: 25px;
  text-align: center;
  color: var(--text-soft);
}
.ready__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
}
.ready__list li {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  font-size: 17px;
  line-height: 23px;
  font-weight: 600;
  border-radius: var(--radius-l);
}
</style>
