<script setup lang="ts">
// Orari dei messaggi e fine della giornata. I valori li salva la pagina alla fine dell'onboarding.
const morning = defineModel<string>('morning', { required: true })
const evening = defineModel<string>('evening', { required: true })
const dayEnd = defineModel<string>('dayEnd', { required: true })
defineProps<{ heroName: string }>()
const emit = defineEmits<{ next: [] }>()

const { t } = useI18n()
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const valid = computed(() => HHMM.test(morning.value) && HHMM.test(evening.value))
const dayEndOptions = [0, 1, 2, 3, 4, 5, 6].map((h) => ({ value: String(h), label: t('settings.dayStartOption', { h }) }))
</script>

<template>
  <section class="flex flex-col gap-4" data-testid="step-rhythm">
    <h2 class="font-display text-sm">{{ t('onboarding.rhythm.title') }}</h2>
    <p class="text-[var(--text-soft)]">{{ t('onboarding.rhythm.subtitle', { hero: heroName }) }}</p>

    <UiCard>
      <div class="grid grid-cols-2 gap-3">
        <UiInput v-model="morning" type="time" :label="t('onboarding.rhythm.morning')" data-testid="rhythm-morning" />
        <UiInput v-model="evening" type="time" :label="t('onboarding.rhythm.evening')" data-testid="rhythm-evening" />
      </div>
      <p class="mt-3 text-[var(--text-soft)]">{{ t('onboarding.rhythm.timesHint') }}</p>
    </UiCard>

    <UiCard>
      <h3 class="font-display mb-3 text-xs">{{ t('onboarding.rhythm.dayEnd') }}</h3>
      <UiSegmented v-model="dayEnd" :label="t('onboarding.rhythm.dayEnd')" :options="dayEndOptions" />
      <p class="mt-3 text-[var(--text-soft)]">{{ t('onboarding.rhythm.dayEndHint') }}</p>
    </UiCard>

    <UiButton :disabled="!valid" data-testid="rhythm-next" @click="emit('next')">{{ t('common.continue') }}</UiButton>
  </section>
</template>
