<script setup lang="ts">
import { periodProgress } from '../../core/selectors'
import { PALETTE } from '../../data/icons'
import bannerScene from '../assets/scenes/hero-banner.webp'

const game = useGameStore()
const { t } = useI18n()
const hero = useHero()

const character = computed(() => game.character!)
const stats = computed(() => game.stats)
const name = computed(() => hero.name(character.value.id))

const xpPercent = computed(() => Math.round((stats.value.level.xpInLevel / Math.max(1, stats.value.level.xpToNext)) * 100))

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
  <UiCard
    tone="accent"
    class="hh"
    :style="{
      backgroundImage: `linear-gradient(180deg, rgb(11 16 32 / 0.45) 0%, rgb(26 37 64 / 0.92) 62%, var(--surface) 92%), url(${bannerScene})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
    }"
  >
    <div class="hh__top">
      <HeroAvatar :character="character.id" :size="88" :alt="name" />
      <div class="hh__who">
        <h2 class="hh__name" data-testid="hero-name">{{ name }}</h2>
        <p class="hh__level" data-testid="level-line">
          {{ t('today.levelTitle', { level: stats.level.level, title: hero.levelTitle(character.id, stats.level.level) }) }}
        </p>
      </div>
    </div>

    <p class="hh__balloon" :aria-label="t('today.heroSays', { name })" data-testid="balloon">“{{ balloon }}”</p>

    <div class="hh__xp">
      <UiBar :value="stats.level.xpInLevel" :max="stats.level.xpToNext" :label="t('a11y.xpBar')" />
      <div class="hh__xprow num">
        <span data-testid="xp-text">{{ t('today.xpProgress', { current: stats.level.xpInLevel, next: stats.level.xpToNext }) }}</span>
        <span>{{ xpPercent }}%</span>
      </div>
    </div>

    <div class="hh__tiles">
      <div class="hh__tile">
        <UiIconTile name="flame" :size="40" :color="PALETTE.orange" />
        <div>
          <p class="hh__tlabel">{{ t('today.streak') }}</p>
          <p class="hh__tvalue num">{{ stats.streak.current }}</p>
        </div>
      </div>
      <div class="hh__tile">
        <UiIconTile name="shield" :size="40" :color="PALETTE.cyan" />
        <div>
          <p class="hh__tlabel">{{ t('today.shields') }}</p>
          <p class="hh__tvalue num">{{ stats.streak.shields }}</p>
        </div>
      </div>
    </div>
    <p v-if="stats.streak.atRisk" class="hh__risk">{{ t('today.streakAtRisk') }}</p>
  </UiCard>
</template>

<style scoped>
.hh__top {
  display: flex;
  gap: 14px;
  align-items: center;
}
.hh__who {
  flex: 1;
  min-width: 0;
}
.hh__name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 30px;
  line-height: 34px;
  color: var(--text);
  text-shadow: 0 2px 12px rgb(0 0 0 / 0.6);
}
.hh__level {
  margin: 2px 0 0;
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
  color: var(--gold);
}
.hh__balloon {
  margin: 12px 2px 0;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  color: var(--text);
  min-height: 48px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hh__xp {
  margin-top: 10px;
}
.hh__xprow {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--text-soft);
}
.hh__tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}
.hh__tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgb(11 16 32 / 0.45);
  border: 1px solid var(--edge);
  border-radius: var(--radius-m);
}
.hh__tlabel {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.hh__tvalue {
  margin: 0;
  font-size: 24px;
  line-height: 28px;
  color: var(--text);
}
.hh__risk {
  margin: 10px 0 0;
  font-size: 15px;
  line-height: 20px;
  color: var(--warn);
}
</style>
