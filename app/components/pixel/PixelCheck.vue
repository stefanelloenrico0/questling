<script setup lang="ts">
// Check accessibile: l'informazione non e' solo colore (check + testo barrato).
const model = defineModel<boolean>({ default: false })
const { t } = useI18n()

defineProps<{ label: string }>()
</script>

<template>
  <button
    class="pixel-check"
    type="button"
    role="checkbox"
    :aria-checked="model"
    :aria-label="`${label} — ${model ? t('a11y.done') : t('a11y.todo')}`"
    @click="model = !model"
  >
    <span class="pixel-check__box" :class="{ 'pixel-check__box--on': model }" aria-hidden="true">
      <svg v-if="model" viewBox="0 0 8 8" width="20" height="20" shape-rendering="crispEdges">
        <path d="M1 4h1v1h1v1h1V5h1V4h1V3h1V2H6v1H5v1H4v1H3V4H1z" fill="#1a1c2c" />
      </svg>
    </span>
    <span class="pixel-check__label" :class="{ 'pixel-check__label--done': model }">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<style scoped>
.pixel-check {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 48px;
  padding: 4px 0;
  text-align: left;
  background: transparent;
  border: 0;
  color: var(--text);
  cursor: pointer;
}
.pixel-check__box {
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin: 4px;
  background: var(--bg);
  box-shadow:
    0 -4px 0 0 var(--surface-2),
    0 4px 0 0 var(--surface-2),
    -4px 0 0 0 var(--surface-2),
    4px 0 0 0 var(--surface-2);
}
.pixel-check__box--on {
  background: var(--ok);
}
.pixel-check__label--done {
  text-decoration: line-through;
  color: var(--text-soft);
}
</style>
