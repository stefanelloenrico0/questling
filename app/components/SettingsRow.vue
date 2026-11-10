<script setup lang="ts">
// Riga di Impostazioni: tessera con icona, titolo, nota, valore a destra e (se serve) freccia.
// `to` = link, `button` = azione; senza nessuno dei due e' una riga fissa. Il contenuto di default sta sotto la riga.
import { ICON_COLORS, isIconId } from '../../data/icons'

const props = defineProps<{
  icon: string
  label: string
  hint?: string
  value?: string
  color?: string
  to?: string
  button?: boolean
  danger?: boolean
  testid?: string
}>()
const emit = defineEmits<{ click: [] }>()
const tint = computed(() => props.color ?? (isIconId(props.icon) ? ICON_COLORS[props.icon] : undefined))
</script>

<template>
  <div class="sr" :class="{ 'sr--danger': danger }">
    <NuxtLink v-if="to" :to="to" class="sr__main sr__main--tap" :data-testid="testid">
      <UiIconTile :name="icon" :size="40" :color="tint" />
      <span class="sr__text"><span class="sr__label">{{ label }}</span><span v-if="hint" class="sr__hint">{{ hint }}</span></span>
      <span v-if="value" class="sr__value">{{ value }}</span>
      <UiIcon name="chevron-right" :size="22" class="sr__chev" />
    </NuxtLink>
    <button v-else-if="button" type="button" class="sr__main sr__main--tap" :data-testid="testid" @click="emit('click')">
      <UiIconTile :name="icon" :size="40" :color="danger ? '#e47c77' : tint" />
      <span class="sr__text"><span class="sr__label">{{ label }}</span><span v-if="hint" class="sr__hint">{{ hint }}</span></span>
      <span v-if="value" class="sr__value">{{ value }}</span>
      <UiIcon name="chevron-right" :size="22" class="sr__chev" />
    </button>
    <div v-else class="sr__main">
      <UiIconTile :name="icon" :size="40" :color="tint" />
      <span class="sr__text"><span class="sr__label">{{ label }}</span><span v-if="hint" class="sr__hint">{{ hint }}</span></span>
      <slot name="end" />
    </div>
    <div v-if="$slots.default" class="sr__extra"><slot /></div>
  </div>
</template>

<style scoped>
.sr__main {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 64px;
  padding: 12px 14px;
  color: var(--text);
  text-align: left;
  text-decoration: none;
  background: transparent;
  border: 0;
}
.sr__main--tap {
  cursor: pointer;
}
.sr__main--tap:active {
  background: rgb(255 255 255 / 0.04);
}
.sr__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
.sr__label {
  font-size: 17px;
  line-height: 23px;
  font-weight: 700;
}
.sr__hint {
  font-size: 14px;
  line-height: 20px;
  color: var(--text-soft);
}
.sr__value {
  flex: none;
  max-width: 45%;
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sr__chev {
  flex: none;
  color: var(--text-muted);
}
.sr__extra {
  padding: 0 14px 14px;
}
.sr--danger .sr__label {
  color: var(--danger);
}
</style>
