<script setup lang="ts">
// Riepilogo finale: l'eroe saluta e si parte.
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
  <section class="flex flex-col gap-4" data-testid="step-ready">
    <div class="flex justify-center">
      <HeroArt :character="characterId" state="happy" :tier="2" :size="176" :alt="heroName" />
    </div>
    <h2 class="font-display text-center text-sm" data-testid="ready-title">{{ t('onboarding.ready.title', { name }) }}</h2>

    <UiCard tone="accent">
      <p class="text-[var(--text-soft)]">{{ t('onboarding.ready.says', { hero: heroName }) }}</p>
      <p class="mt-1" data-testid="ready-line">{{ hero.line(characterId, 'morning') }}</p>
    </UiCard>

    <UiCard>
      <ul class="flex flex-col gap-2" data-testid="ready-summary">
        <li class="flex items-center gap-3"><UiIcon name="shield" :size="22" />{{ t('onboarding.ready.hero', { hero: heroName }) }}</li>
        <li class="flex items-center gap-3">
          <UiIcon name="list-checks" :size="22" />
          {{ questsText }}
        </li>
        <li class="flex items-center gap-3">
          <UiIcon name="bell" :size="22" />
          <span v-if="notifications.enabled">{{ t('onboarding.ready.notifOn', { morning: notifications.morning, evening: notifications.evening }) }}</span>
          <span v-else>{{ t('onboarding.ready.notifOff') }}</span>
        </li>
        <li class="flex items-center gap-3"><UiIcon name="moon" :size="22" />{{ t('onboarding.ready.dayEnd', { h: dayEnd }) }}</li>
      </ul>
    </UiCard>

    <UiButton :disabled="busy" data-testid="ready-start" @click="emit('start')">{{ t('onboarding.ready.start') }}</UiButton>
  </section>
</template>
