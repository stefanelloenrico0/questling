<script setup lang="ts">
// Scheda morbida: bordo sottile, ombra lieve. tone="accent" la tinge col colore dell'eroe.
withDefaults(defineProps<{ tone?: 'surface' | 'accent' }>(), { tone: 'surface' })
</script>

<template>
  <div class="ui-card" :class="`ui-card--${tone}`">
    <slot />
  </div>
</template>

<style scoped>
.ui-card {
  position: relative;
  padding: 16px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--edge);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-card);
}
.ui-card--accent {
  background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 24%, var(--surface)) 0%, var(--surface) 70%);
  border-color: color-mix(in srgb, var(--accent) 55%, var(--edge));
}
</style>
