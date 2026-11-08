<script setup lang="ts">
import { PALETTE } from '../../data/icons'
import { ACHIEVEMENTS } from '../../data/achievements'
import { achievementsProgress, buildHeatmap, periodTotals } from '../../core/history'

const game = useGameStore()
const { t } = useI18n()

const heatmap = computed(() => buildHeatmap(game.state, game.now))
const totals = computed(() => periodTotals(game.state, game.now))
const achievements = computed(() => achievementsProgress(game.state, game.now))
const doneCount = computed(() => achievements.value.filter((a) => a.done).length)
const groups = ['quests', 'streak', 'level', 'special'] as const
const inGroup = (g: (typeof groups)[number]) => achievements.value.filter((a) => a.def.group === g)
const stats = computed(() => game.stats)
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="page-stats">
    <PageHeader :title="t('stats.title')" :sub="t('stats.summary')" />

    <section class="grid grid-cols-2 gap-2.5">
      <StatChip icon="flame" :color="PALETTE.orange" :label="t('stats.streak')" :value="stats.streak.current" />
      <StatChip icon="trophy" :color="PALETTE.gold" :label="t('stats.bestStreak')" :value="stats.streak.best" />
      <StatChip icon="crown" :color="PALETTE.violet" :label="t('stats.level')" :value="stats.level.level" />
      <StatChip icon="sparkles" :color="PALETTE.cyan" :label="t('stats.totalXp')" :value="stats.totalXp" />
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('stats.heatmapTitle') }}</h2>
      <UiCard>
        <StatsHeatmap :heatmap="heatmap" />
        <p class="mt-3 text-[var(--text-soft)]">{{ t('stats.heatmapNote') }}</p>
        <p class="mt-1" data-testid="heatmap-summary">{{ t('stats.heatmapSummary', { total: heatmap.total, days: heatmap.activeDays }) }}</p>
        <p class="mt-1 text-[var(--text-soft)]">{{ t('stats.legendLess') }} {{ t('stats.legendValues') }} {{ t('stats.legendMore') }}</p>
      </UiCard>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('stats.totalsTitle') }}</h2>
      <UiCard>
        <dl class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2" data-testid="totals">
          <dt>{{ t('stats.last7') }}</dt>
          <dd data-testid="total-7">{{ t('stats.windowValue', { count: totals.last7, xp: totals.xpLast7 }) }}</dd>
          <dt>{{ t('stats.last30') }}</dt>
          <dd data-testid="total-30">{{ t('stats.windowValue', { count: totals.last30, xp: totals.xpLast30 }) }}</dd>
          <dt class="text-[var(--text-soft)]">{{ t('stats.completedDaily') }}</dt>
          <dd>{{ totals.completedDaily }}</dd>
          <dt class="text-[var(--text-soft)]">{{ t('stats.completedWeekly') }}</dt>
          <dd>{{ totals.completedWeekly }}</dd>
          <dt class="text-[var(--text-soft)]">{{ t('stats.completedMonthly') }}</dt>
          <dd>{{ totals.completedMonthly }}</dd>
        </dl>
      </UiCard>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('stats.achievementsTitle') }}</h2>
      <p class="text-[var(--text-soft)]" data-testid="achievements-count">
        {{ t('stats.achievementsCount', { done: doneCount, total: ACHIEVEMENTS.length }) }}
      </p>
      <UiCard v-for="g in groups" :key="g">
        <h3 class="font-display mb-3 text-xs">{{ t(`stats.group.${g}`) }}</h3>
        <ul class="flex flex-col gap-4">
          <li v-for="a in inGroup(g)" :key="a.def.id" :data-testid="`ach-${a.def.id}`" :data-done="a.done">
            <div class="flex items-center gap-3">
              <UiIconTile :name="a.done ? 'medal' : 'lock'" :size="40" :color="a.done ? PALETTE.gold : '#8996ac'" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <span style="font-weight: 700">{{ t(`achievements.${a.def.id}.title`) }}</span>
                  <span class="num text-[14px]" :class="a.done ? 'text-[var(--ok)]' : 'text-[var(--text-soft)]'">
                    {{ a.done ? '✓ ' + t('stats.done') : t('stats.progress', { current: a.current, target: a.def.target }) }}
                  </span>
                </div>
                <p class="text-[var(--text-soft)]" style="font-size: 15px; line-height: 20px">{{ t(`achievements.${a.def.id}.desc`) }}</p>
              </div>
            </div>
            <div class="mt-2"></div>
            <UiBar
              :value="a.current"
              :max="a.def.target"
              :blocks="10"
              :label="t(`achievements.${a.def.id}.title`)"
              :color="a.done ? 'var(--ok)' : 'var(--xp)'"
            />
          </li>
        </ul>
      </UiCard>
    </section>

    <div><UiButton variant="secondary" data-testid="stats-back" @click="navigateTo('/hero')">{{ t('stats.back') }}</UiButton></div>
  </div>
</template>
