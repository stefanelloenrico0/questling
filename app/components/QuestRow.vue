<script setup lang="ts">
import type { QuestRowView } from '../../core/selectors'

const props = defineProps<{ row: QuestRowView }>()
const game = useGameStore()
const { t } = useI18n()
const fx = useFeedback()

const pops = ref<{ id: number; xp: number }[]>([])
let seq = 0

function bump(direction: 1 | -1): void {
  const out = game.progress(props.row.quest.id, direction)
  if (out.xpDelta > 0) fx.complete()
  else if (out.changed) fx.tap()
  if (out.xpDelta > 0) {
    const id = ++seq
    pops.value.push({ id, xp: out.xpDelta })
    setTimeout(() => {
      pops.value = pops.value.filter((p) => p.id !== id)
    }, 1100)
  }
}

const isDaily = computed(() => props.row.quest.period === 'daily')
const checked = computed({
  get: () => props.row.done,
  set: (v: boolean) => bump(v ? 1 : -1),
})
</script>

<template>
  <div class="qrow" :class="{ 'qrow--done': row.done }" data-testid="quest-row">
    <UiCheck v-if="isDaily" v-model="checked" :label="row.quest.title">
      <span class="qrow__text">
        <UiIconTile :name="row.quest.icon" :size="40" />
        <span class="qrow__title">{{ row.quest.title }}</span>
        <span class="qrow__xp">{{ t('today.xpGain', { xp: row.xp }) }}</span>
      </span>
    </UiCheck>

    <div v-else class="qrow__multi">
      <UiIconTile :name="row.quest.icon" :size="40" />
      <div class="qrow__grow">
        <div class="qrow__title" :class="{ 'qrow__title--done': row.done }">{{ row.quest.title }}</div>
        <div class="qrow__meta">
          <span class="num" data-testid="quest-count">{{ t('today.count', { count: row.count, target: row.quest.target }) }}</span>
          <span class="qrow__xp">{{ t('today.xpGain', { xp: row.xp }) }}</span>
        </div>
      </div>
      <UiButton
        variant="secondary"
        compact
        :disabled="row.count <= 0"
        :aria-label="t('today.removeProgress', { title: row.quest.title })"
        @click="bump(-1)"
      >−</UiButton>
      <UiButton
        compact
        :disabled="row.done"
        :aria-label="t('today.addProgress', { title: row.quest.title })"
        @click="bump(1)"
      >+</UiButton>
    </div>

    <span v-for="p in pops" :key="p.id" class="xp-pop num" aria-hidden="true">{{ t('today.xpGain', { xp: p.xp }) }}</span>
  </div>
</template>

<style scoped>
.qrow {
  position: relative;
  padding: 6px 0;
}
.qrow__text {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.qrow__title {
  flex: 1;
  word-break: break-word;
}
.qrow__title--done {
  text-decoration: line-through;
  color: var(--text-soft);
}
.qrow__xp {
  color: var(--gold);
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.qrow__multi {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
}
.qrow__grow {
  flex: 1;
  min-width: 0;
}
.qrow__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-soft);
}
.xp-pop {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 14px;
  color: var(--gold);
  pointer-events: none;
  animation: xp-float 1.1s ease-out forwards;
}
@keyframes xp-float {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-32px);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .xp-pop {
    animation: none !important;
    opacity: 1;
  }
}
</style>
