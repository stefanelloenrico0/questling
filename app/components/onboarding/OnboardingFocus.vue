<script setup lang="ts">
// Aree di interesse: servono solo a proporre missioni adatte. Facoltative.
import { FOCUS_AREAS, MAX_FOCUS, type FocusId } from '../../../data/focus-areas'
import { PALETTE } from '../../../data/icons'

const model = defineModel<FocusId[]>({ required: true })
const emit = defineEmits<{ next: [] }>()
const { t } = useI18n()

const AREA_COLOR: Record<FocusId, string> = {
  move: PALETTE.orange,
  mind: PALETTE.cyan,
  home: PALETTE.green,
  craft: PALETTE.pink,
  calm: PALETTE.violet,
  money: PALETTE.gold,
}
const full = computed(() => model.value.length >= MAX_FOCUS)

function toggle(id: FocusId): void {
  if (model.value.includes(id)) model.value = model.value.filter((x) => x !== id)
  else if (!full.value) model.value = [...model.value, id]
}
</script>

<template>
  <section class="onb-screen focus" data-testid="step-focus">
    <div class="onb-head">
      <h2 class="onb-title">{{ t('onboarding.focus.title') }}</h2>
      <p class="onb-sub">{{ t('onboarding.focus.subtitle', { max: MAX_FOCUS }) }}</p>
    </div>

    <div class="focus__grid" role="group" :aria-label="t('onboarding.focus.group')">
      <button
        v-for="area in FOCUS_AREAS"
        :key="area.id"
        type="button"
        class="area glass"
        :class="{ 'area--on': model.includes(area.id) }"
        :aria-pressed="model.includes(area.id)"
        :disabled="full && !model.includes(area.id)"
        :data-testid="`focus-area-${area.id}`"
        @click="toggle(area.id)"
      >
        <UiIconTile :name="area.icon" :size="48" :color="AREA_COLOR[area.id]" />
        <span class="area__title">{{ t(`focus.areas.${area.id}.title`) }}</span>
        <span class="sr-only">{{ t(`focus.areas.${area.id}.desc`) }}</span>
        <span v-if="model.includes(area.id)" class="area__check" aria-hidden="true"><UiIcon name="check" :size="14" /></span>
      </button>
    </div>

    <p class="focus__count" role="status">{{ t('onboarding.focus.count', { n: model.length, max: MAX_FOCUS }) }}</p>

    <div class="onb-actions">
      <UiButton data-testid="focus-next" @click="emit('next')">
        {{ model.length ? t('common.continue') : t('onboarding.focus.skip') }}
      </UiButton>
    </div>
  </section>
</template>

<style scoped>
.focus__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 8px;
}
.area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 112px;
  padding: 12px 6px;
  color: var(--text);
  text-align: center;
  cursor: pointer;
  border-radius: var(--radius-l);
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
  border-color: var(--gold);
  box-shadow:
    0 0 0 2px rgb(233 184 94 / 0.3),
    0 0 24px -10px var(--gold);
}
.area__title {
  font-size: 15px;
  line-height: 20px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.area__check {
  position: absolute;
  top: 8px;
  right: 8px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  color: #1c1305;
  background: var(--gold);
  border-radius: 50%;
}
.focus__count {
  margin: 16px 0 0;
  text-align: center;
  font-size: 15px;
  color: var(--text);
  text-shadow: 0 2px 8px rgb(0 0 0 / 0.8);
}
</style>
