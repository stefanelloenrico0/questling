<script setup lang="ts">
// Barra di avanzamento da 8 px. Di default prende l'accento dell'eroe (progresso personale);
// l'oro (`color="var(--gold)"`) e' riservato ai momenti di ricompensa universale.
const props = withDefaults(
  defineProps<{
    value: number
    max: number
    label?: string
    blocks?: number
    color?: string
  }>(),
  { label: '', blocks: 0, color: 'var(--accent)' },
)

const percent = computed(() => (props.max <= 0 ? 0 : Math.round(Math.min(1, Math.max(0, props.value / props.max)) * 100)))
</script>

<template>
  <div
    class="ui-bar"
    role="progressbar"
    :aria-label="label"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="value"
  >
    <i class="ui-bar__fill" :style="{ width: `${percent}%`, background: color }" />
  </div>
</template>

<style scoped>
.ui-bar {
  height: 8px;
  overflow: hidden;
  background: var(--bg);
  border: 1px solid var(--edge);
  border-radius: 999px;
}
.ui-bar__fill {
  display: block;
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  transition: width 0.35s ease;
}
@media (prefers-reduced-motion: reduce) {
  .ui-bar__fill {
    transition: none;
  }
}
</style>
