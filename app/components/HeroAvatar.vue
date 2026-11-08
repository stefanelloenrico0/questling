<script setup lang="ts">
// Ritratto tondo dell'eroe (testa e spalle) con un anello del suo colore: per Oggi e le liste.
import { CHARACTER_BY_ID } from '../../data/characters'
import type { CharacterId } from '../../core/types'

const props = withDefaults(defineProps<{ character: CharacterId; size?: number; alt?: string }>(), { size: 72, alt: '' })
const url = computed(() => heroImageUrl(props.character))
const accent = computed(() => CHARACTER_BY_ID[props.character].accent)
</script>

<template>
  <span class="av" :style="{ width: `${size}px`, height: `${size}px`, '--hc': accent }" role="img" :aria-label="alt">
    <img v-if="url" :src="url" class="av__img" alt="" draggable="false" />
    <span v-else class="av__svg"><HeroArt :character="character" :size="size * 1.5" /></span>
  </span>
</template>

<style scoped>
.av {
  position: relative;
  display: inline-block;
  flex: none;
  overflow: hidden;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 28%, color-mix(in srgb, var(--hc) 34%, #1a2540), #0e1528 78%);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--hc) 75%, transparent),
    0 0 18px -4px color-mix(in srgb, var(--hc) 70%, transparent);
}
.av__img {
  position: absolute;
  top: 6%;
  left: 50%;
  width: 178%;
  max-width: none;
  height: auto;
  transform: translateX(-50%);
}
.av__svg {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: start center;
}
</style>
