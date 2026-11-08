<script setup lang="ts">
const model = defineModel<number>({ required: true })
const props = defineProps<{ min: number; max: number; label: string; valueLabel: string; decreaseLabel: string; increaseLabel: string }>()

const dec = (): void => {
  model.value = Math.max(props.min, model.value - 1)
}
const inc = (): void => {
  model.value = Math.min(props.max, model.value + 1)
}
</script>

<template>
  <div class="stepper" role="group" :aria-label="label">
    <UiButton variant="secondary" compact :disabled="model <= min" :aria-label="decreaseLabel" @click="dec">−</UiButton>
    <output class="stepper__value num" aria-live="polite">{{ valueLabel }}</output>
    <UiButton variant="secondary" compact :disabled="model >= max" :aria-label="increaseLabel" @click="inc">+</UiButton>
  </div>
</template>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stepper__value {
  min-width: 112px;
  text-align: center;
  font-size: 18px;
}
</style>
