<script setup lang="ts">
// Check accessibile: l'informazione non e' solo colore (segno di spunta + testo barrato).
const model = defineModel<boolean>({ default: false })
const { t } = useI18n()

defineProps<{ label: string }>()
</script>

<template>
  <button
    class="ui-check"
    type="button"
    role="checkbox"
    :aria-checked="model"
    :aria-label="`${label} — ${model ? t('a11y.done') : t('a11y.todo')}`"
    @click="model = !model"
  >
    <span class="ui-check__box" :class="{ 'ui-check__box--on': model }" aria-hidden="true">
      <svg v-if="model" viewBox="0 0 16 16" width="18" height="18">
        <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="#10331a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
    <span class="ui-check__label" :class="{ 'ui-check__label--done': model }">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<style scoped>
.ui-check {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 48px;
  padding: 4px 0;
  color: var(--text);
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.ui-check__box {
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  background: var(--bg);
  border: 2px solid #5a63a8;
  border-radius: 10px;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}
.ui-check__box--on {
  background: var(--ok);
  border-color: var(--ok);
  transform: scale(1.05);
}
.ui-check__label--done {
  color: var(--text-soft);
  text-decoration: line-through;
}
</style>
