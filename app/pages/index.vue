<script setup lang="ts">
import { PERIODS, type Period } from '../../core/types'

const game = useGameStore()
const { t } = useI18n()
const hero = useHero()

const sectionTitle: Record<Period, string> = {
  daily: 'today.sectionDaily',
  weekly: 'today.sectionWeekly',
  monthly: 'today.sectionMonthly',
}

const sections = computed(() =>
  PERIODS.map((period) => ({ period, rows: game.rows(period) })).filter((s) => s.rows.length > 0),
)
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="page-today">
    <HeroHeader v-if="game.character" />

    <!-- Primo avvio: sparisce da solo dopo la prima missione completata -->
    <UiCard v-if="game.character && game.stats.questsCompleted === 0 && sections.length > 0" tone="accent" data-testid="first-hint">
      <p>{{ t('today.firstHint', { hero: hero.name(game.character.id) }) }}</p>
    </UiCard>

    <QuestSection v-for="s in sections" :key="s.period" :title="t(sectionTitle[s.period])" :rows="s.rows" />

    <UiCard v-if="sections.length === 0" data-testid="today-empty">
      <p class="mb-4">{{ t('today.empty') }}</p>
      <UiButton @click="navigateTo('/quests')">{{ t('today.emptyCta') }}</UiButton>
    </UiCard>
  </div>
</template>
