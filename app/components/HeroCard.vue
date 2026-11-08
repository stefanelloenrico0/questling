<script setup lang="ts">
import { CHARACTER_BY_ID } from '../../data/characters'
import type { CharacterId } from '../../core/types'

// `lockedHint`: se presente l'eroe e' ancora bloccato e il testo dice come sbloccarlo.
const props = defineProps<{ id: CharacterId; selected?: boolean; affinity?: number | null; lockedHint?: string }>()
const { t } = useI18n()
const hero = useHero()
const accent = computed(() => CHARACTER_BY_ID[props.id].accent)
</script>

<template>
  <button
    type="button"
    role="radio"
    class="hcard"
    :class="{ 'hcard--on': selected, 'hcard--locked': !!lockedHint }"
    :aria-checked="!!selected"
    :aria-disabled="!!lockedHint"
    :disabled="!!lockedHint"
    :aria-label="lockedHint ? `${t('hero.lockedName')}: ${lockedHint}` : hero.name(id)"
    :style="{ '--hc': accent }"
    :data-testid="`hero-card-${id}`"
  >
    <span class="hcard__art"><HeroArt :character="id" :size="96" /></span>
    <span class="font-display hcard__name">{{ lockedHint ? t('hero.lockedName') : hero.name(id) }}</span>
    <span class="hcard__arch">{{ lockedHint ?? hero.archetype(id) }}</span>
    <span v-if="affinity != null" class="hcard__aff">{{ t('quiz.affinity', { pct: affinity }) }}</span>
    <span v-if="selected" class="hcard__sel">■ {{ t('quiz.selected') }}</span>
  </button>
</template>

<style scoped>
.hcard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 48px;
  padding: 12px 8px;
  color: var(--text);
  text-align: center;
  background: var(--surface);
  border: 1.5px solid var(--edge);
  border-radius: var(--radius-l);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.1s ease;
}
.hcard:active {
  transform: scale(0.98);
}
.hcard--on {
  border-color: var(--hc);
  background: linear-gradient(170deg, color-mix(in srgb, var(--hc) 22%, var(--surface)), var(--surface) 75%);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--hc) 35%, transparent);
}
.hcard--locked {
  cursor: not-allowed;
  border-style: dashed;
}
.hcard--locked .hcard__art {
  /* sagoma: si intuisce chi e', senza rivelarlo del tutto */
  filter: brightness(0) invert(0.35) sepia(1) hue-rotate(190deg) saturate(2.2);
  opacity: 0.7;
}
.hcard--locked :deep(.hero *) {
  animation: none !important;
}
.hcard__name {
  font-size: 17px;
  color: var(--hc);
}
.hcard__arch {
  font-size: 14px;
  color: var(--text-soft);
}
.hcard__aff {
  font-weight: 700;
  color: var(--xp);
}
.hcard__sel {
  font-weight: 700;
  color: var(--hc);
}
</style>
