<script setup lang="ts">
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
  >
    <div class="flex flex-col items-center gap-3" data-testid="levelup">
      <HeroArt :character="character.id" state="happy" :tier="info.tier" :size="176" :alt="hero.name(character.id)" />
      <p v-if="info.tierChanged" class="font-display text-center text-xs text-[var(--xp)]">
        {{ t('levelUp.newTitle', { title: hero.tierTitle(character.id, info.tier) }) }}
      </p>
      <p v-if="info.chapter" class="text-center">{{ t('levelUp.chapterUnlocked', { n: info.chapter }) }}</p>
      <p class="levelup-line" data-testid="levelup-line">{{ levelUpLine(character.id, info.to, locale as Locale) }}</p>
    </div>
    <template #actions>
      <UiButton @click="game.dismissLevelUp()">{{ t('levelUp.cta') }}</UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.levelup-line {
  padding: 10px 14px;
  text-align: center;
  background: var(--bg-2);
  border: 1px solid var(--edge);
  border-radius: 18px;
}
</style>
