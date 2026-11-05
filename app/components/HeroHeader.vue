<script setup lang="ts">
import { periodProgress } from '../../core/selectors'

const game = useGameStore()
const { t } = useI18n()
const hero = useHero()

const character = computed(() => game.character!)
const stats = computed(() => game.stats)
const name = computed(() => hero.name(character.value.id))

const dailies = computed(() => game.rows('daily'))
const allDone = computed(() => {
  const p = periodProgress(dailies.value)
  return p.total > 0 && p.done === p.total
})
const balloon = computed(() => {
  if (allDone.value) return hero.line(character.value.id, 'done')
  return hero.line(character.value.id, game.now.getHours() < 17 ? 'morning' : 'evening')
})
</script>

<template>
  <PixelCard tone="accent" class="hh">
    <div class="hh__top">
      <PixelSprite :character="character.id" :tier="stats.tier" :scale="4" :state="allDone ? 'happy' : 'idle'" :alt="name" />
      <div class="hh__who">
        <h1 class="font-display text-xs" data-testid="hero-name">{{ name }}</h1>
        <p class="hh__balloon" :aria-label="t('today.heroSays', { name })" data-testid="balloon">{{ balloon }}</p>
      </div>
    </div>

    <p class="font-display mt-4 text-xs" data-testid="level-line">
      {{ t('today.levelTitle', { level: stats.level.level, title: hero.levelTitle(character.id, stats.level.level) }) }}
    </p>
    <div class="mt-2 flex flex-col gap-2">
      <PixelBar :value="stats.level.xpInLevel" :max="stats.level.xpToNext" :label="t('a11y.xpBar')" />
      <p class="text-[var(--text-soft)]" data-testid="xp-text">
        {{ t('today.xpProgress', { current: stats.level.xpInLevel, next: stats.level.xpToNext }) }}
      </p>
    </div>

    <div class="mt-2 flex flex-wrap">
      <StatChip :label="t('today.streak')" :value="stats.streak.current" />
      <StatChip :label="t('today.shields')" :value="stats.streak.shields" />
    </div>
    <p v-if="stats.streak.atRisk" class="mt-2 text-[var(--warn)]">{{ t('today.streakAtRisk') }}</p>
  </PixelCard>
</template>

<style scoped>
.hh__top {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.hh__who {
  flex: 1;
  min-width: 0;
}
.hh__balloon {
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--bg);
  box-shadow:
    0 -4px 0 0 var(--surface-2),
    0 4px 0 0 var(--surface-2),
    -4px 0 0 0 var(--surface-2),
    4px 0 0 0 var(--surface-2);
}
</style>
