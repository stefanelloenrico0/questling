<script setup lang="ts">
// Aree di interesse: servono solo a proporre missioni adatte. Facoltative.
import { FOCUS_AREAS, MAX_FOCUS, type FocusId } from '../../../data/focus-areas'

const model = defineModel<FocusId[]>({ required: true })
const emit = defineEmits<{ next: [] }>()
const { t } = useI18n()

const full = computed(() => model.value.length >= MAX_FOCUS)

function toggle(id: FocusId): void {
  if (model.value.includes(id)) model.value = model.value.filter((x) => x !== id)
  else if (!full.value) model.value = [...model.value, id]
}
</script>

<template>
  <section class="flex flex-col gap-4" data-testid="step-focus">
    <h2 class="font-display text-sm">{{ t('onboarding.focus.title') }}</h2>
    <p class="text-[var(--text-soft)]">{{ t('onboarding.focus.subtitle', { max: MAX_FOCUS }) }}</p>

    <div class="grid grid-cols-2 gap-2" role="group" :aria-label="t('onboarding.focus.group')">
      <button
        v-for="area in FOCUS_AREAS"
        :key="area.id"
        type="button"
        class="area"
        :class="{ 'area--on': model.includes(area.id) }"
        :aria-pressed="model.includes(area.id)"
        :disabled="full && !model.includes(area.id)"
        :data-testid="`focus-area-${area.id}`"
        @click="toggle(area.id)"
      >
        <UiIcon :name="area.icon" :size="28" />
        <span class="font-display area__title">{{ t(`focus.areas.${area.id}.title`) }}</span>
        <span class="area__desc">{{ t(`focus.areas.${area.id}.desc`) }}</span>
      </button>
    </div>

    <p class="text-center text-[var(--text-soft)]" role="status">{{ t('onboarding.focus.count', { n: model.length, max: MAX_FOCUS }) }}</p>

    <UiButton data-testid="focus-next" @click="emit('next')">
      {{ model.length ? t('common.continue') : t('onboarding.focus.skip') }}
    </UiButton>
  </section>
</template>

<style scoped>
.area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 48px;
  padding: 14px 8px;
  color: var(--text);
  text-align: center;
  background: var(--surface);
  border: 1.5px solid var(--edge);
  border-radius: var(--radius-l);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.1s ease;
}
.area:active {
  transform: scale(0.98);
}
.area:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.area--on {
  border-color: var(--accent);
  background: linear-gradient(170deg, color-mix(in srgb, var(--accent) 22%, var(--surface)), var(--surface) 75%);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent);
}
.area__title {
  font-size: 17px;
}
.area__desc {
  font-size: 14px;
  color: var(--text-soft);
}
</style>
