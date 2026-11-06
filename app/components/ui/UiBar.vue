<script setup lang="ts">
// Barra di avanzamento (XP, traguardi). `blocks` e' accettato per compatibilita' ma non serve piu'.
const props = withDefaults(
  defineProps<{
    value: number
    max: number
    label?: string
    blocks?: number
    color?: string
  }>(),
  { label: '', blocks: 0, color: 'linear-gradient(90deg, #ffcd75, #ff9d6b)' },
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
  height: 14px;
  overflow: hidden;
  background: var(--bg);
  border-radius: 999px;
  box-shadow: inset 0 2px 4px rgb(0 0 0 / 0.4);
}
.ui-bar__fill {
  display: block;
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  transition: width 0.5s cubic-bezier(0.3, 0.7, 0.3, 1);
  box-shadow: inset 0 -3px 0 rgb(0 0 0 / 0.15);
}
</style>
