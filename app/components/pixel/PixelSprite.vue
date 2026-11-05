<script setup lang="ts">
import type { CharacterId } from '../../../core/types'
import { SPRITE_FRAME, SPRITE_FRAMES } from '../../../data/characters'

// Spritesheet orizzontale 4 frame 32x32, animato con steps(4). Scala SEMPRE intera.
const props = withDefaults(
  defineProps<{
    character: CharacterId
    state?: 'idle' | 'happy'
    scale?: 2 | 3 | 4 | 6 | 8
    /** Tier 1..5: dal 2 in poi si sovrappone l'overlay condiviso */
    tier?: 1 | 2 | 3 | 4 | 5
    alt?: string
  }>(),
  { state: 'idle', scale: 4, tier: 1, alt: '' },
)

const size = computed(() => SPRITE_FRAME * props.scale)
const sheetW = computed(() => size.value * SPRITE_FRAMES)
const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '')
const url = (path: string) => `url(${base}/sprites/${path})`

const heroStyle = computed(() => ({
  width: `${size.value}px`,
  height: `${size.value}px`,
  backgroundImage: url(`${props.character}/${props.state}.png`),
  backgroundSize: `${sheetW.value}px ${size.value}px`,
  '--sheet-w': `${sheetW.value}px`,
}))

const overlays = computed(() => {
  const list: { tier: number; pulse: boolean }[] = []
  // Overlay cumulativi: T2 scintille, T3 stendardo, T4 aura, T5 corona + aura (solo l'ultimo per T4/T5)
  if (props.tier >= 2) list.push({ tier: 2, pulse: false })
  if (props.tier >= 3) list.push({ tier: 3, pulse: false })
  if (props.tier >= 4) list.push({ tier: props.tier === 5 ? 5 : 4, pulse: true })
  return list
})
</script>

<template>
  <div
    class="sprite"
    role="img"
    :aria-label="alt"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <div class="sprite__layer sprite__layer--hero" :style="heroStyle" />
    <div
      v-for="o in overlays"
      :key="o.tier"
      class="sprite__layer"
      :style="{
        ...heroStyle,
        backgroundImage: url(`overlays/tier${o.tier}.png`),
      }"
    />
  </div>
</template>

<style scoped>
.sprite {
  position: relative;
  display: inline-block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
.sprite__layer {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-position: 0 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  animation: sprite-cycle 0.8s steps(4) infinite;
}
@keyframes sprite-cycle {
  from {
    background-position-x: 0;
  }
  to {
    background-position-x: calc(var(--sheet-w) * -1);
  }
}
/* prefers-reduced-motion: solo il primo frame */
@media (prefers-reduced-motion: reduce) {
  .sprite__layer {
    animation: none !important;
  }
}
</style>
