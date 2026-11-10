<script setup lang="ts">
import { PERIODS, type Period } from '../../core/types'
import emptyQuests from '../assets/ui/empty-quests.webp'

const game = useGameStore()
const { t } = useI18n()
const hero = useHero()
const { locale } = useI18n()
const dateLabel = computed(() => {
  const d = new Intl.DateTimeFormat(locale.value, { weekday: 'long', day: 'numeric', month: 'long' }).format(game.now)
  return d.charAt(0).toUpperCase() + d.slice(1)
})

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
  <div class="flex flex-col gap-5" data-testid="page-today">
    <PageHeader :title="t('today.pageTitle')" :sub="dateLabel" />
    <HeroHeader v-if="game.character" />

    <!-- Primo avvio: sparisce da solo dopo la prima missione completata -->
    <UiCard v-if="game.character && game.stats.questsCompleted === 0 && sections.length > 0" tone="accent" data-testid="first-hint">
      <p>{{ t('today.firstHint', { hero: hero.name(game.character.id) }) }}</p>
    </UiCard>

    <QuestSection v-for="s in sections" :key="s.period" :title="t(sectionTitle[s.period])" :rows="s.rows" />

    <UiCard v-if="sections.length === 0" data-testid="today-empty">
      <img :src="emptyQuests" class="empty-art" alt="" draggable="false" />
      <p class="mb-4 text-center">{{ t('today.empty') }}</p>
      <UiButton @click="navigateTo('/quests')">{{ t('today.emptyCta') }}</UiButton>
    </UiCard>
  </div>
</template>

<style scoped>
.empty-art {
  display: block;
  width: 160px;
  margin: 0 auto 8px;
}
</style>
