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
const dayEndOptions = [0, 1, 2, 3, 4, 5, 6].map((h) => ({ value: String(h), label: t('onboarding.rhythm.dayEndOption', { h }) }))
</script>

<template>
  <section class="onb-screen rhythm" data-testid="step-rhythm">
    <div class="onb-head">
      <h2 class="onb-title">{{ t('onboarding.rhythm.title') }}</h2>
      <p class="onb-sub">{{ t('onboarding.rhythm.subtitle', { hero: heroName }) }}</p>
    </div>

    <div class="rhythm__body">
      <div class="rhythm__times">
        <label class="time glass">
          <span class="time__label"><UiIcon name="sun-moon" :size="18" />{{ t('onboarding.rhythm.morning') }}</span>
          <input v-model="morning" type="time" class="time__input num" data-testid="rhythm-morning" />
        </label>
        <label class="time glass">
          <span class="time__label"><UiIcon name="moon" :size="18" />{{ t('onboarding.rhythm.evening') }}</span>
          <input v-model="evening" type="time" class="time__input num" data-testid="rhythm-evening" />
        </label>
      </div>
      <p class="rhythm__hint">{{ t('onboarding.rhythm.timesHint') }}</p>

      <div class="rhythm__day glass">
        <h3 class="rhythm__h">{{ t('onboarding.rhythm.dayEnd') }}</h3>
        <UiSegmented v-model="dayEnd" :label="t('onboarding.rhythm.dayEnd')" :options="dayEndOptions" />
        <p class="rhythm__hint">{{ t('onboarding.rhythm.dayEndHint') }}</p>
      </div>
    </div>

    <div class="onb-actions">
      <UiButton :disabled="!valid" data-testid="rhythm-next" @click="emit('next')">{{ t('common.continue') }}</UiButton>
    </div>
  </section>
</template>

<style scoped>
.rhythm__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}
.rhythm__times {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.time {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: var(--radius-l);
}
.time__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--text-soft);
}
.time__input {
  width: 100%;
  min-width: 0;
  padding: 0;
  font-size: 30px;
  line-height: 36px;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: none;
  color-scheme: dark;
  user-select: text;
  -webkit-user-select: text;
}
.time:focus-within {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgb(233 184 94 / 0.25);
}
.rhythm__hint {
  margin: 0 4px;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-soft);
}
.rhythm__day {
  padding: 14px 16px;
  border-radius: var(--radius-l);
}
.rhythm__h {
  margin: 0 0 10px;
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
}
</style>
