<script setup lang="ts">
// Card di vetro scuro con bordo luminoso. tone="accent" prende il bagliore dell'eroe (intestazioni);
// tone="raised" e' per sheet e dialoghi; tone="row" e' piatta, per le righe di un elenco.
withDefaults(defineProps<{ tone?: 'surface' | 'accent' | 'raised' | 'row' }>(), { tone: 'surface' })
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
  background: linear-gradient(180deg, rgb(32 43 69 / 0.78), rgb(21 29 50 / 0.86));
  border: 1px solid color-mix(in srgb, var(--accent) 22%, rgb(129 160 230 / 0.3));
  border-radius: var(--radius-l);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.05),
    0 18px 36px -24px rgb(0 0 0 / 0.9);
}
.ui-card--accent {
  background: linear-gradient(165deg, color-mix(in srgb, var(--accent) 14%, rgb(26 37 64 / 0.9)) 0%, rgb(21 29 50 / 0.92) 72%);
  border-color: color-mix(in srgb, var(--accent) 50%, rgb(129 160 230 / 0.3));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    0 0 26px -12px color-mix(in srgb, var(--accent) 70%, transparent),
    0 18px 36px -24px rgb(0 0 0 / 0.9);
}
.ui-card--raised {
  padding: 22px;
  background: linear-gradient(180deg, rgb(36 49 78 / 0.96), rgb(24 33 56 / 0.98));
  border-color: rgb(140 170 240 / 0.38);
  border-radius: var(--radius-xl);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.08),
    0 0 36px -14px color-mix(in srgb, var(--accent) 60%, transparent),
    var(--shadow-raised);
}
.ui-card--row {
  padding: 12px 14px;
  border-radius: var(--radius-m);
  box-shadow: none;
}
</style>
