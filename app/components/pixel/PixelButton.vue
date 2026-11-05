<script setup lang="ts">
// Stati: idle, pressed (trasla 4 px giù), disabled. Target touch >= 48 px.
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
    class="pixel-btn font-display"
    :class="[`pixel-btn--${variant}`, { 'pixel-btn--compact': compact }]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.pixel-btn {
  --face: var(--accent);
  --edge: #1a1c2c;
  --label: #1a1c2c;
  min-width: 48px;
  min-height: 48px;
  margin: 4px;
  padding: 12px 20px;
  font-size: 12px;
  color: var(--label);
  background: var(--face);
  border: 0;
  cursor: pointer;
  /* bordo a gradini + "profondità" 4 px sotto */
  box-shadow:
    0 -4px 0 0 var(--edge),
    0 4px 0 0 var(--edge),
    -4px 0 0 0 var(--edge),
    4px 0 0 0 var(--edge),
    0 8px 0 0 var(--edge),
    inset 0 -4px 0 0 rgb(0 0 0 / 0.25);
  transition: none;
}
.pixel-btn--compact {
  padding: 12px;
}
.pixel-btn--secondary {
  --face: var(--surface-2);
  --label: var(--text);
}
.pixel-btn:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow:
    0 -4px 0 0 var(--edge),
    0 4px 0 0 var(--edge),
    -4px 0 0 0 var(--edge),
    4px 0 0 0 var(--edge),
    inset 0 -4px 0 0 rgb(0 0 0 / 0.25);
}
.pixel-btn:disabled {
  --face: var(--surface);
  --label: var(--text-soft);
  cursor: not-allowed;
  opacity: 0.8;
}
</style>
