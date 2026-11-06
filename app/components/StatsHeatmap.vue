<script setup lang="ts">
import type { Heatmap, HeatCell } from '../../core/history'

defineProps<{ heatmap: Heatmap }>()
const { t } = useI18n()

const dayLabels = [1, 2, 3, 4, 5, 6, 7]

function label(cell: HeatCell): string {
  const [y, m, d] = cell.day.split('-').map(Number) as [number, number, number]
  const date = new Date(y, m - 1, d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
  const text = t('stats.cellLabel', { date, count: cell.count })
  return cell.today ? `${text} (${t('stats.today')})` : text
}
</script>

<template>
  <div class="hm" role="group" :aria-label="t('stats.heatmapTitle')" data-testid="heatmap">
    <div class="hm__days" aria-hidden="true">
      <span v-for="d in dayLabels" :key="d">{{ t(`stats.d${d}`) }}</span>
    </div>
    <div class="hm__grid">
      <div v-for="(week, wi) in heatmap.weeks" :key="wi" class="hm__col">
        <div
          v-for="cell in week"
          :key="cell.day"
          class="hm__cell"
          :class="[`hm__cell--l${cell.level}`, { 'hm__cell--future': cell.future, 'hm__cell--today': cell.today }]"
          role="img"
          :aria-label="label(cell)"
          :data-count="cell.count"
          :data-testid="cell.today ? 'heat-today' : undefined"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hm {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px;
}
.hm__days {
  display: grid;
  grid-template-rows: repeat(7, 18px);
  gap: 4px;
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}
.hm__grid {
  display: flex;
  gap: 4px;
}
.hm__col {
  display: grid;
  grid-template-rows: repeat(7, 18px);
  gap: 4px;
}
.hm__cell {
  width: 18px;
  height: 18px;
  /* piu' scuro della card (--surface): altrimenti i giorni senza attivita' sparirebbero */
  background: var(--bg);
  border-radius: 5px;
}
.hm__cell--future {
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--bg);
}
.hm__cell--l1 {
  background: color-mix(in srgb, var(--accent) 35%, var(--bg));
}
.hm__cell--l2 {
  background: color-mix(in srgb, var(--accent) 60%, var(--bg));
}
.hm__cell--l3 {
  background: color-mix(in srgb, var(--accent) 85%, var(--bg));
}
.hm__cell--l4 {
  background: var(--accent);
}
.hm__cell--today {
  box-shadow: 0 0 0 2.5px var(--text);
  position: relative;
  z-index: 1;
}
</style>
