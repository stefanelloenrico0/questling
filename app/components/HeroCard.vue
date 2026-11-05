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
    <PixelSprite :character="id" :scale="3" :alt="hero.name(id)" />
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
  margin: 4px;
  color: var(--text);
  text-align: center;
  background: var(--surface);
  border: 0;
  cursor: pointer;
  box-shadow:
    0 -4px 0 0 var(--surface-2),
    0 4px 0 0 var(--surface-2),
    -4px 0 0 0 var(--surface-2),
    4px 0 0 0 var(--surface-2);
}
.hcard--on {
  box-shadow:
    0 -4px 0 0 var(--hc),
    0 4px 0 0 var(--hc),
    -4px 0 0 0 var(--hc),
    4px 0 0 0 var(--hc);
}
.hcard__name {
  font-size: 10px;
  color: var(--hc);
}
.hcard__arch {
  font-size: 16px;
  color: var(--text-soft);
}
.hcard__aff {
  color: var(--xp);
}
.hcard__sel {
  color: var(--hc);
}
</style>
