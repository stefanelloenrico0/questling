<script setup lang="ts">
import { CHARACTER_BY_ID } from '../../data/characters'
import { levelUpLine } from '../../data/notification-texts'
import type { Locale } from '../../core/locale'

const game = useGameStore()
const { t, locale } = useI18n()
const hero = useHero()
const fx = useFeedback()

const info = computed(() => game.pendingLevelUp)
const open = computed({
  get: () => info.value !== null,
  set: (v: boolean) => {
    if (!v) game.dismissLevelUp()
  },
})
const character = computed(() => game.character)
const accent = computed(() => (character.value ? CHARACTER_BY_ID[character.value.id].accent : 'var(--accent)'))

// Fanfara + vibrazione 'success' quando compare il modale
watch(
  info,
  (value) => {
    if (value) fx.levelUp()
  },
  { immediate: true },
)
</script>

<template>
  <UiDialog
    v-if="info && character"
    v-model:open="open"
    :title="t('levelUp.title', { level: info.to })"
    :description="t('levelUp.body', { level: info.to })"
    celebrate
  >
    <div class="lv" data-testid="levelup" :style="{ '--hc': accent }">
      <div class="lv__stage">
        <div class="lv__glow" aria-hidden="true" />
        <HeroArt :character="character.id" state="happy" :tier="info.tier" fluid :alt="hero.name(character.id)" />
      </div>
      <p v-if="info.tierChanged" class="lv__tier">
        {{ t('levelUp.newTitle', { title: hero.tierTitle(character.id, info.tier) }) }}
      </p>
      <p v-if="info.chapter" class="lv__chapter">{{ t('levelUp.chapterUnlocked', { n: info.chapter }) }}</p>
      <p class="levelup-line" data-testid="levelup-line">{{ levelUpLine(character.id, info.to, locale as Locale) }}</p>
    </div>
    <template #actions>
      <UiButton @click="game.dismissLevelUp()">{{ t('levelUp.cta') }}</UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.lv {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 0;
}
.lv__stage {
  position: relative;
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  min-height: 0;
}
.lv__glow {
  position: absolute;
  inset: 4% -10% 0;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--hc) 55%, transparent), transparent 72%);
}
.lv__stage > :deep(.hero) {
  position: relative;
}
.lv__tier {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 24px;
  line-height: 28px;
  text-align: center;
  color: var(--gold);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.8);
}
.lv__chapter {
  margin: 0;
  text-align: center;
  color: var(--text);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.8);
}
.levelup-line {
  margin: 4px 8px 0;
  min-height: 52px;
  text-align: center;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 19px;
  line-height: 26px;
  color: var(--text);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.85);
}
</style>
