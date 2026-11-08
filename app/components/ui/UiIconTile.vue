<script setup lang="ts">
// Icona colorata dentro una tessera morbida (righe di elenco, risposte del quiz, aree di interesse).
import { ICON_COLORS, isIconId } from '../../../data/icons'

const props = withDefaults(defineProps<{ name: string; size?: number; color?: string; round?: boolean }>(), {
  size: 44,
  color: '',
  round: false,
})
const tint = computed(() => props.color || (isIconId(props.name) ? ICON_COLORS[props.name] : 'var(--accent)'))
</script>

<template>
  <span
    class="tile"
    :class="{ 'tile--round': round }"
    :style="{ width: `${size}px`, height: `${size}px`, '--tc': tint }"
    aria-hidden="true"
  >
    <UiIcon :name="name" :size="Math.round(size * 0.52)" />
  </span>
</template>

<style scoped>
.tile {
  flex: none;
  display: grid;
  place-items: center;
  color: var(--tc);
  background: radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--tc) 30%, transparent), color-mix(in srgb, var(--tc) 10%, transparent) 70%);
  border: 1px solid color-mix(in srgb, var(--tc) 34%, transparent);
  border-radius: 14px;
  box-shadow: 0 0 16px -8px var(--tc);
}
.tile--round {
  border-radius: 50%;
}
</style>
