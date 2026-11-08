<script setup lang="ts">
// Fondale a tutto schermo per le schermate di onboarding: scena dipinta + sfumature per leggere titolo e pulsanti.
defineProps<{ src?: string | null }>()
</script>

<template>
  <div class="onb-bg" aria-hidden="true">
    <img v-if="src" :src="src" class="onb-bg__img" alt="" draggable="false" />
    <div class="onb-bg__fade" />
  </div>
</template>

<style scoped>
.onb-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.onb-bg__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 100%;
}
.onb-bg__fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgb(11 16 32 / 0.74) 0%,
    rgb(11 16 32 / 0.2) 26%,
    transparent 44%,
    rgb(11 16 32 / 0.3) 72%,
    rgb(11 16 32 / 0.9) 100%
  );
}
</style>
