<script setup lang="ts">
import { PERIODS, type Period } from '../../core/types'

const game = useGameStore()
const { t } = useI18n()

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

    <QuestSection v-for="s in sections" :key="s.period" :title="t(sectionTitle[s.period])" :rows="s.rows" />

    <PixelCard v-if="sections.length === 0" data-testid="today-empty">
      <p class="mb-4">{{ t('today.empty') }}</p>
      <PixelButton @click="navigateTo('/quests')">{{ t('today.emptyCta') }}</PixelButton>
    </PixelCard>
  </div>
</template>
