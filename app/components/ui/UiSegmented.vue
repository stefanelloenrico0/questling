<script setup lang="ts">
// Scelta singola (radiogroup). Lo stato selezionato non e' solo colore: ha anche un segno di spunta.
const model = defineModel<string>({ required: true })
defineProps<{
  label: string
  options: readonly { value: string; label: string; disabled?: boolean }[]
}>()
</script>

<template>
  <div class="seg" role="radiogroup" :aria-label="label">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      class="seg__opt"
      :class="{ 'seg__opt--on': model === o.value }"
      :aria-checked="model === o.value"
      :disabled="o.disabled"
      @click="model = o.value"
    >
      <span v-if="model === o.value" aria-hidden="true">✓</span>
      {{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 5px;
  background: var(--bg);
  border: 1px solid var(--edge-control);
  border-radius: var(--radius-m);
}
.seg__opt {
  flex: 1 1 0;
  min-width: 78px;
  min-height: 46px;
  padding: 8px 12px;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  background: transparent;
  border: 0;
  border-radius: var(--radius-s);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}
.seg__opt--on {
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 18%, var(--surface-active));
  box-shadow: inset 0 0 0 1.5px var(--accent);
}
.seg__opt:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
