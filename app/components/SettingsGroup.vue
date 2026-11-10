<script setup lang="ts">
// Gruppo di righe delle Impostazioni: titolo piccolo in maiuscolo + pannello di vetro con righe separate da una linea.
defineProps<{ title?: string }>()
</script>

<template>
  <section class="sg">
    <h2 v-if="title" class="sg__title">{{ title }}</h2>
    <div class="sg__panel glass"><slot /></div>
  </section>
</template>

<style scoped>
.sg__title {
  margin: 0 0 8px 6px;
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.sg__panel {
  overflow: hidden;
  border-radius: var(--radius-l);
}
.sg__panel > :deep(* + *) {
  border-top: 1px solid rgb(129 160 230 / 0.16);
}
</style>
