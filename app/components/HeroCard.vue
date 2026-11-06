<script setup lang="ts">
import { CHARACTER_BY_ID } from '../../data/characters'
import type { CharacterId } from '../../core/types'

const props = defineProps<{ id: CharacterId; selected?: boolean; affinity?: number | null }>()
const { t } = useI18n()
const hero = useHero()
const accent = computed(() => CHARACTER_BY_ID[props.id].accent)
</script>

<template>
  <button
    type="button"
    role="radio"
    class="hcard"
    :class="{ 'hcard--on': selected }"
    :aria-checked="!!selected"
    :aria-label="hero.name(id)"
    :style="{ '--hc': accent }"
    :data-testid="`hero-card-${id}`"
  >
    <HeroArt :character="id" :size="96" :alt="hero.name(id)" />
    <span class="font-display hcard__name">{{ hero.name(id) }}</span>
    <span class="hcard__arch">{{ hero.archetype(id) }}</span>
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
