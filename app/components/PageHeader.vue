<script setup lang="ts">
// Testata fissa di ogni pagina: titolo serif a sinistra, spazio per l'ingranaggio a destra, riga secondaria sotto.
defineProps<{ title: string; sub?: string }>()
</script>

<template>
  <header class="ph">
    <h1 class="ph__title">{{ title }}</h1>
    <p v-if="sub" class="ph__sub">{{ sub }}</p>
  </header>
</template>

<style scoped>
.ph {
  min-height: 72px;
  padding-right: 56px;
}
.ph__title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 27px;
  line-height: 34px;
  color: var(--text);
}
.ph__sub {
  margin: 2px 0 0;
  font-size: 16px;
  line-height: 22px;
  color: var(--text-soft);
}
</style>
