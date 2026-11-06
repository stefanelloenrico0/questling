<script setup lang="ts">
// Bottone con "profondita'": si abbassa quando lo premi. Target touch >= 48 px.
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary'
    disabled?: boolean
    type?: 'button' | 'submit'
    compact?: boolean
  }>(),
  { variant: 'primary', disabled: false, type: 'button', compact: false },
)
</script>

<template>
  <button
    class="ui-btn"
    :class="[`ui-btn--${variant}`, { 'ui-btn--compact': compact }]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.ui-btn {
  --depth: color-mix(in srgb, var(--accent) 52%, #0b0d22);
  min-width: 48px;
  min-height: 48px;
  margin: 4px;
  padding: 10px 20px;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.1;
  color: #14162a;
  background: var(--accent);
  border: 0;
  border-radius: var(--radius-m);
  cursor: pointer;
  box-shadow:
    0 4px 0 var(--depth),
    0 12px 20px -10px color-mix(in srgb, var(--accent) 65%, transparent);
  transition:
    transform 0.08s ease,
    box-shadow 0.08s ease,
    filter 0.15s ease;
}
.ui-btn:hover:not(:disabled) {
  filter: brightness(1.06);
}
.ui-btn:active:not(:disabled) {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--depth);
}
.ui-btn--secondary {
  --depth: #151839;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--edge);
  box-shadow: 0 4px 0 var(--depth);
}
.ui-btn--compact {
  padding: 10px 14px;
}
.ui-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}
</style>
