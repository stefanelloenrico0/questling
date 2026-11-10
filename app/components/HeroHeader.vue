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
  <section class="hh">
    <div class="hh__banner">
      <div class="hh__bg" :style="{ backgroundImage: `url(${bannerScene})` }" aria-hidden="true" />
      <div class="hh__glow" aria-hidden="true" />
      <div class="hh__hero">
        <HeroArt :character="character.id" :tier="stats.tier" :size="212" :state="allDone ? 'happy' : 'idle'" :alt="name" />
      </div>
      <div class="hh__who">
        <h2 class="hh__name" data-testid="hero-name">{{ name }}</h2>
        <p class="hh__level" data-testid="level-line">
          {{ t('today.levelTitle', { level: stats.level.level, title: hero.levelTitle(character.id, stats.level.level) }) }}
        </p>
        <UiBar :value="stats.level.xpInLevel" :max="stats.level.xpToNext" :label="t('a11y.xpBar')" />
        <div class="hh__xprow num">
          <span data-testid="xp-text">{{ t('today.xpProgress', { current: stats.level.xpInLevel, next: stats.level.xpToNext }) }}</span>
          <span>{{ xpPercent }}%</span>
        </div>
      </div>
    </div>

    <div class="hh__body">
      <p class="hh__balloon" :aria-label="t('today.heroSays', { name })" data-testid="balloon">“{{ balloon }}”</p>

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
    </div>
  </section>
</template>

<style scoped>
.hh {
  position: relative;
  margin-top: 30px;
  color: var(--text);
  background: linear-gradient(165deg, color-mix(in srgb, var(--accent) 14%, rgb(26 37 64 / 0.9)) 0%, rgb(21 29 50 / 0.94) 72%);
  border: 1px solid color-mix(in srgb, var(--accent) 50%, rgb(129 160 230 / 0.3));
  border-radius: var(--radius-l);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    0 0 30px -12px color-mix(in srgb, var(--accent) 75%, transparent),
    0 18px 36px -24px rgb(0 0 0 / 0.9);
}
.hh__banner {
  position: relative;
  display: flex;
  align-items: flex-end;
  height: 176px;
}
.hh__bg {
  position: absolute;
  inset: 0;
  background-position: 50% 70%;
  background-size: cover;
  border-radius: calc(var(--radius-l) - 1px) calc(var(--radius-l) - 1px) 0 0;
}
.hh__bg::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(90deg, rgb(11 16 32 / 0.1) 0%, rgb(11 16 32 / 0.55) 55%, rgb(11 16 32 / 0.8) 100%),
    linear-gradient(180deg, transparent 55%, rgb(21 29 50 / 0.95) 100%);
}
.hh__glow {
  position: absolute;
  inset: auto auto 0 -12px;
  width: 190px;
  height: 190px;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--accent) 45%, transparent), transparent 75%);
}
.hh__hero {
  position: relative;
  flex: none;
  align-self: flex-end;
  height: 212px;
  margin: 0 0 4px 4px;
}
.hh__who {
  position: relative;
  flex: 1;
  min-width: 0;
  padding: 0 16px 16px 6px;
}
.hh__name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 30px;
  line-height: 34px;
  color: #fff3d6;
  text-shadow: 0 2px 12px rgb(0 0 0 / 0.8);
}
.hh__level {
  margin: 0 0 10px;
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
  color: var(--gold);
  text-shadow: 0 1px 8px rgb(0 0 0 / 0.8);
}
.hh__xprow {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--text);
  text-shadow: 0 1px 6px rgb(0 0 0 / 0.8);
}
.hh__body {
  padding: 4px 16px 16px;
}
.hh__balloon {
  display: -webkit-box;
  min-height: 48px;
  margin: 8px 2px 0;
  overflow: hidden;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  color: var(--text);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.hh__tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
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
