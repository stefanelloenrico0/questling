<script setup lang="ts">
// Barra a blocchi da 4 px (XP).
const props = withDefaults(
  defineProps<{
    value: number
    max: number
    label?: string
    blocks?: number
    color?: string
  }>(),
  { label: '', blocks: 20, color: 'var(--xp)' },
)

const filled = computed(() => {
  if (props.max <= 0) return 0
  const ratio = Math.min(1, Math.max(0, props.value / props.max))
  return Math.floor(ratio * props.blocks)
})
</script>

<template>
  <div
    class="pixel-bar"
    role="progressbar"
    :aria-label="label"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="value"
  >
    <span
      v-for="i in blocks"
      :key="i"
      class="pixel-bar__block"
      :class="{ 'pixel-bar__block--on': i <= filled }"
      :style="i <= filled ? { background: color } : undefined"
    />
  </div>
</template>

<style scoped>
.pixel-bar {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg);
  box-shadow:
    0 -4px 0 0 var(--surface-2),
    0 4px 0 0 var(--surface-2),
    -4px 0 0 0 var(--surface-2),
    4px 0 0 0 var(--surface-2);
}
.pixel-bar__block {
  flex: 1 1 0;
  height: 16px;
  background: var(--surface);
}
</style>
