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
    <span class="sw__state num" aria-hidden="true">{{ model ? t('common.on') : t('common.off') }}</span>
  </button>
</template>

<style scoped>
.sw {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
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
  font-size: 14px;
  line-height: 20px;
}
.sw__track {
  flex: none;
  position: relative;
  width: 54px;
  height: 32px;
  background: var(--bg);
  border: 1.5px solid var(--edge-control);
  border-radius: 999px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}
.sw__track--on {
  background: var(--accent);
  border-color: var(--accent);
}
.sw__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  background: var(--text);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.4);
  transition: transform 0.2s cubic-bezier(0.3, 0.7, 0.3, 1);
}
.sw__track--on .sw__knob {
  background: #14162a;
  transform: translateX(22px);
}
.sw__state {
  flex: none;
  min-width: 26px;
  font-size: 14px;
  text-align: right;
  color: var(--text-soft);
}
</style>
