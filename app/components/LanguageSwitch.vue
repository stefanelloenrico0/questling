<script setup lang="ts">
// Scelta della lingua (italiano / inglese). Cambia anche la lingua dei messaggi dell'eroe e delle notifiche.
import { LOCALES, LOCALE_NAMES, type Locale } from '../../core/locale'

const game = useGameStore()
const { t } = useI18n()

const options = LOCALES.map((value) => ({ value, label: LOCALE_NAMES[value] }))
const model = computed({
  get: () => game.settings.locale as string,
  set: (v: string) => game.patchSettings({ locale: v as Locale }),
})
</script>

<template>
  <UiSegmented v-model="model" :label="t('settings.language')" :options="options" data-testid="language-switch" />
</template>
