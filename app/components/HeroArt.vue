<script setup lang="ts">
// Personaggio vettoriale animato. Gli SVG (app/assets/heroes) sono inline cosi' le parti si animano in CSS:
// .char = respiro, .eye = ciglia, .sway = piuma/sciarpa/antenna/aureola, .glow = gemma/lanterna.
// Per sostituire l'arte basta cambiare il file SVG dell'eroe (mantenendo quei nomi di classe).
import { CHARACTER_BY_ID } from '../../data/characters'
import type { CharacterId } from '../../core/types'
import brace from '../assets/heroes/brace.svg?raw'
import brunilde from '../assets/heroes/brunilde.svg?raw'
import fenna from '../assets/heroes/fenna.svg?raw'
import kuro from '../assets/heroes/kuro.svg?raw'
import lumen from '../assets/heroes/lumen.svg?raw'
import plin from '../assets/heroes/plin.svg?raw'
import rondo from '../assets/heroes/rondo.svg?raw'
import salmastro from '../assets/heroes/salmastro.svg?raw'
import u404 from '../assets/heroes/u404.svg?raw'
import valdo from '../assets/heroes/valdo.svg?raw'
import zeffiro from '../assets/heroes/zeffiro.svg?raw'

const ART: Record<CharacterId, string> = { valdo, kuro, fenna, zeffiro, lumen, rondo, u404, brunilde, salmastro, plin, brace }
const VIEW = '-4 -24 262 304'
const RATIO_SVG = 262 / 304
const RATIO_PAINTED = 3 / 4

const props = withDefaults(
  defineProps<{
    character: CharacterId
    state?: 'idle' | 'happy'
    /** Altezza in px. */
    size?: number
    /** Riempie l'altezza disponibile del contenitore (che deve avere un'altezza definita) invece di una misura fissa. */
    fluid?: boolean
    /** Tier 1..5: dal 2 in poi compaiono scintille, stendardo, aura, corona. */
    tier?: 1 | 2 | 3 | 4 | 5
    alt?: string
  }>(),
  { state: 'idle', size: 128, fluid: false, tier: 1, alt: '' },
)

// id univoci per istanza: piu' copie dello stesso SVG nella pagina non devono condividere i gradienti
const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const svg = computed(() =>
  ART[props.character]
    .replace(/ role="img" aria-label="[^"]*"/, '')
    .replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
    .replace(/id="([\w-]+)"/g, `id="${uid}-$1"`)
    .replace(/url\(#([\w-]+)\)/g, `url(#${uid}-$1)`),
)
const painted = computed(() => heroImageUrl(props.character))
const ratio = computed(() => (painted.value ? RATIO_PAINTED : RATIO_SVG))
const accent = computed(() => CHARACTER_BY_ID[props.character].accent)
const showSparkles = computed(() => props.tier >= 2 || props.state === 'happy')
const auraColor = computed(() => (props.tier >= 5 ? '#ffcd75' : accent.value))
const sparkles = [
  { x: 14, y: 40, d: 0 },
  { x: 244, y: 74, d: 0.5 },
  { x: 8, y: 170, d: 1 },
  { x: 250, y: 196, d: 1.5 },
]
</script>

<template>
  <div
    class="hero"
    :class="`hero--${state}`"
    :style="fluid ? { height: '100%', aspectRatio: String(ratio), maxWidth: '100%' } : { height: `${size}px`, width: `${Math.round(size * ratio)}px` }"
    role="img"
    :aria-label="alt"
  >
    <svg v-if="tier >= 4" class="hero__layer hero__aura" :viewBox="VIEW" aria-hidden="true">
      <defs>
        <radialGradient :id="`${uid}-aura`" cx=".5" cy=".55" r=".5">
          <stop offset="0" :stop-color="auraColor" stop-opacity=".5" />
          <stop offset="1" :stop-color="auraColor" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse class="hero__aura-glow" cx="127" cy="150" rx="132" ry="146" :fill="`url(#${uid}-aura)`" />
    </svg>

    <!-- SVG propri, inclusi nel pacchetto (mai input dell'utente): v-html e' sicuro qui -->
    <div v-if="painted" class="hero__layer hero__art"><img class="hero__img" :src="painted" alt="" draggable="false" /></div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-else class="hero__layer hero__art" v-html="svg" />

    <svg v-if="showSparkles || tier >= 3" class="hero__layer hero__fx" :viewBox="VIEW" aria-hidden="true">
      <defs>
        <linearGradient :id="`${uid}-gold`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff1a8" />
          <stop offset="1" stop-color="#e0933f" />
        </linearGradient>
      </defs>
      <!-- tier 3+: stendardo del colore dell'eroe -->
      <g v-if="tier >= 3">
        <rect x="0" y="34" width="5" height="222" rx="2.5" fill="#c9a064" />
        <circle cx="2.5" cy="32" r="5" :fill="`url(#${uid}-gold)`" />
        <path class="hero__flag" d="M5 40 Q30 30 56 40 L56 74 Q30 64 5 74 Z" :fill="accent" />
        <path class="hero__flag" d="M5 40 Q30 30 56 40 L56 47 Q30 37 5 47 Z" fill="#ffffff" opacity=".3" />
      </g>
      <!-- tier 5: corona -->
      <g v-if="tier >= 5" class="hero__crown">
        <path d="M96 4 L100 -14 L112 -2 L120 -20 L128 -2 L140 -14 L144 4 Z" :fill="`url(#${uid}-gold)`" stroke="#8a4a2a" stroke-width="1.6" stroke-linejoin="round" />
        <circle cx="120" cy="-7" r="3" fill="#ff6b6b" />
        <circle cx="106" cy="-2" r="2.2" fill="#73eff7" />
        <circle cx="134" cy="-2" r="2.2" fill="#73eff7" />
      </g>
      <!-- scintille -->
      <g v-if="showSparkles">
        <path
          v-for="(s, i) in sparkles"
          :key="i"
          class="hero__spark"
          :style="{ animationDelay: `${s.d}s` }"
          :transform="`translate(${s.x} ${s.y})`"
          d="M0 -11 L3 -3 11 0 3 3 0 11 -3 3 -11 0 -3 -3Z"
          fill="#ffe08a"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  display: inline-block;
  flex: none;
}
.hero__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.hero__art :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* illustrazione dipinta: stesso respiro e salto dell'SVG */
.hero__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: 50% 100%;
  transform-origin: 50% 100%;
  animation: hero-bob 3.6s ease-in-out infinite;
  filter: drop-shadow(0 8px 10px rgb(0 0 0 / 0.35));
}
.hero--happy .hero__img {
  animation: hero-hop 0.9s cubic-bezier(0.3, 0.7, 0.4, 1) infinite;
}

/* idle */
.hero__art :deep(.char) {
  animation: hero-bob 3.6s ease-in-out infinite;
  transform-origin: 50% 100%;
  transform-box: fill-box;
}
.hero__art :deep(.shadow) {
  animation: hero-shadow 3.6s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}
.hero__art :deep(.eye) {
  animation: hero-blink 4.8s infinite;
  transform-origin: center;
  transform-box: fill-box;
}
.hero__art :deep(.sway) {
  animation: hero-sway 3.2s ease-in-out infinite;
  transform-origin: 50% 100%;
  transform-box: fill-box;
}
.hero__art :deep(.glow) {
  animation: hero-pulse 2.4s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}

/* festa: salto, occhi sorridenti */
.hero--happy .hero__art :deep(.char) {
  animation: hero-hop 0.9s cubic-bezier(0.3, 0.7, 0.4, 1) infinite;
}
.hero--happy .hero__art :deep(.shadow) {
  animation: hero-shadow-hop 0.9s cubic-bezier(0.3, 0.7, 0.4, 1) infinite;
}
.hero--happy .hero__art :deep(.eye) {
  animation: none;
  transform: scaleY(0.4);
}

.hero__aura-glow {
  animation: hero-pulse 3s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}
.hero__flag {
  animation: hero-flag 2.2s ease-in-out infinite;
  transform-origin: 0% 50%;
  transform-box: fill-box;
}
.hero__crown {
  animation: hero-float 3s ease-in-out infinite;
}
.hero__spark {
  animation: hero-twinkle 1.8s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes hero-bob {
  0%, 100% { transform: translateY(0) scale(1, 1); }
  50% { transform: translateY(-4px) scale(0.992, 1.012); }
}
@keyframes hero-shadow {
  0%, 100% { transform: scale(1); opacity: 0.32; }
  50% { transform: scale(0.92); opacity: 0.22; }
}
@keyframes hero-blink {
  0%, 93%, 100% { transform: scaleY(1); }
  96% { transform: scaleY(0.08); }
}
@keyframes hero-sway {
  0%, 100% { transform: rotate(-2.5deg); }
  50% { transform: rotate(3deg); }
}
@keyframes hero-pulse {
  0%, 100% { opacity: 0.75; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.14); }
}
@keyframes hero-hop {
  0% { transform: translateY(0) scale(1.05, 0.94); }
  35% { transform: translateY(-16px) scale(0.97, 1.05); }
  60% { transform: translateY(-16px) scale(0.97, 1.05); }
  100% { transform: translateY(0) scale(1.05, 0.94); }
}
@keyframes hero-shadow-hop {
  0%, 100% { transform: scale(1); opacity: 0.32; }
  45% { transform: scale(0.6); opacity: 0.14; }
}
@keyframes hero-flag {
  0%, 100% { transform: skewY(-3deg) scaleX(1); }
  50% { transform: skewY(3deg) scaleX(0.94); }
}
@keyframes hero-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes hero-twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.5) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(20deg); }
}

@media (prefers-reduced-motion: reduce) {
  .hero__art :deep(*),
  .hero__aura-glow,
  .hero__flag,
  .hero__crown,
  .hero__spark {
    animation: none !important;
  }
  .hero__spark {
    opacity: 0.9;
  }
}
</style>
