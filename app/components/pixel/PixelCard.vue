<script setup lang="ts">
// Card con bordo a gradini via box-shadow (stile NES), nessun border-radius.
withDefaults(defineProps<{ tone?: 'surface' | 'accent' }>(), { tone: 'surface' })
</script>

<template>
  <div class="pixel-card" :class="`pixel-card--${tone}`">
    <slot />
  </div>
</template>

<style scoped>
.pixel-card {
  --edge: var(--surface-2);
  position: relative;
  margin: 4px;
  padding: 16px;
  background: var(--surface);
  color: var(--text);
  box-shadow:
    0 -4px 0 0 var(--edge),
    0 4px 0 0 var(--edge),
    -4px 0 0 0 var(--edge),
    4px 0 0 0 var(--edge);
}
.pixel-card--accent {
  --edge: var(--accent);
}
</style>
