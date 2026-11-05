<script setup lang="ts">
// Scelta singola (radiogroup). Lo stato selezionato non e' solo colore: ha anche una barra e un segno.
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
      <span v-if="model === o.value" aria-hidden="true">■</span>
      {{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.seg__opt {
  flex: 1 1 0;
  min-width: 80px;
  min-height: 48px;
  padding: 8px 12px;
  margin: 4px;
  color: var(--text);
  font: inherit;
  background: var(--surface);
  border: 0;
  cursor: pointer;
  box-shadow:
    0 -4px 0 0 var(--surface-2),
    0 4px 0 0 var(--surface-2),
    -4px 0 0 0 var(--surface-2),
    4px 0 0 0 var(--surface-2);
}
.seg__opt--on {
  color: #1a1c2c;
  background: var(--accent);
  box-shadow:
    0 -4px 0 0 var(--accent),
    0 4px 0 0 var(--accent),
    -4px 0 0 0 var(--accent),
    4px 0 0 0 var(--accent);
}
.seg__opt:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
