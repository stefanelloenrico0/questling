<script setup lang="ts">
// Interruttore accessibile: lo stato e' dichiarato anche con testo (Si/No), non solo col colore.
const model = defineModel<boolean>({ default: false })
const { t } = useI18n()
defineProps<{ label: string; hint?: string }>()
</script>

<template>
  <button class="sw" type="button" role="switch" :aria-checked="model" @click="model = !model">
    <span class="sw__text">
      <span>{{ label }}</span>
      <span v-if="hint" class="sw__hint">{{ hint }}</span>
    </span>
    <span class="sw__track" :class="{ 'sw__track--on': model }" aria-hidden="true">
      <span class="sw__knob" />
    </span>
    <span class="sw__state font-display" aria-hidden="true">{{ model ? t('common.on') : t('common.off') }}</span>
  </button>
</template>

<style scoped>
.sw {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 4px 0;
  color: var(--text);
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.sw__text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.sw__hint {
  color: var(--text-soft);
}
.sw__track {
  flex: none;
  position: relative;
  width: 48px;
  height: 24px;
  margin: 4px;
  background: var(--bg);
  box-shadow:
    0 -4px 0 0 var(--surface-2),
    0 4px 0 0 var(--surface-2),
    -4px 0 0 0 var(--surface-2),
    4px 0 0 0 var(--surface-2);
}
.sw__track--on {
  background: var(--ok);
}
.sw__knob {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  background: var(--text);
  box-shadow: inset 0 -4px 0 0 rgb(0 0 0 / 0.25);
}
.sw__track--on .sw__knob {
  left: 24px;
  background: #1a1c2c;
}
.sw__state {
  flex: none;
  min-width: 36px;
  font-size: 10px;
  text-align: right;
}
</style>
