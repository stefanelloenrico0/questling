<script setup lang="ts">
// Scelta della lingua (italiano / inglese). Cambia anche la lingua dei messaggi dell'eroe e delle notifiche.
// `compact`: due piccole pillole (schermata iniziale); altrimenti il selettore a segmenti delle Impostazioni.
import { LOCALES, LOCALE_NAMES, type Locale } from '../../core/locale'

defineProps<{ compact?: boolean }>()
const game = useGameStore()
const { t } = useI18n()

const options = LOCALES.map((value) => ({ value, label: LOCALE_NAMES[value] }))
const model = computed({
  get: () => game.settings.locale as string,
  set: (v: string) => game.patchSettings({ locale: v as Locale }),
})
</script>

<template>
  <div v-if="compact" class="lang" role="radiogroup" :aria-label="t('settings.language')" data-testid="language-switch">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      class="lang__opt"
      :class="{ 'lang__opt--on': model === o.value }"
      :aria-checked="model === o.value"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
  <UiSegmented v-else v-model="model" :label="t('settings.language')" :options="options" data-testid="language-switch" />
</template>

<style scoped>
.lang {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: rgb(11 16 32 / 0.55);
  border: 1px solid var(--edge-strong);
  border-radius: 999px;
  backdrop-filter: blur(6px);
}
.lang__opt {
  min-width: 48px;
  min-height: 40px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-soft);
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
}
.lang__opt--on {
  color: #1c1305;
  background: var(--gold);
}
</style>
