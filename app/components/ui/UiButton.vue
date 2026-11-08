<script setup lang="ts">
// Bottone a pillola. Primario = oro con gradiente e bagliore (marchio); secondario = vetro scuro con bordo;
// ghost = solo testo (link). Alto 54 px, premuto = leggero affondo.
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 54px;
  min-height: 54px;
  margin: 4px;
  padding: 12px 28px;
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 700;
  line-height: 22px;
  letter-spacing: 0.01em;
  color: #1c1305;
  background: linear-gradient(180deg, #f8dc92 0%, #e9b85e 52%, #d6a03d 100%);
  border: 1px solid #f3cf7c;
  border-radius: 999px;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.5),
    inset 0 -2px 0 rgb(120 70 0 / 0.25),
    0 10px 24px -10px rgb(233 184 94 / 0.65);
  transition:
    transform 0.12s ease,
    filter 0.15s ease;
}
.ui-btn:hover:not(:disabled) {
  filter: brightness(1.06);
}
.ui-btn:active:not(:disabled) {
  transform: scale(0.985);
  filter: brightness(0.93);
}
.ui-btn--secondary {
  color: var(--text);
  background: linear-gradient(180deg, rgb(30 42 68 / 0.85), rgb(16 24 43 / 0.9));
  border: 1px solid var(--edge-strong);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06);
}
.ui-btn--secondary:active:not(:disabled) {
  filter: brightness(1.2);
}
.ui-btn--ghost {
  color: var(--text-soft);
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  text-decoration: underline;
  text-underline-offset: 4px;
  font-weight: 600;
}
.ui-btn--compact {
  padding: 12px 18px;
}
.ui-btn:disabled {
  cursor: not-allowed;
  color: var(--text-disabled);
  background: var(--surface-active);
  border-color: var(--edge);
  box-shadow: none;
}
.ui-btn--ghost:disabled {
  background: transparent;
  border-color: transparent;
}
</style>
