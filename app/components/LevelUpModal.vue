<script setup lang="ts">
import { levelUpLine } from '../../data/notification-texts'

const game = useGameStore()
const { t } = useI18n()
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
  <PixelDialog
    v-if="info && character"
    v-model:open="open"
    :title="t('levelUp.title', { level: info.to })"
    :description="t('levelUp.body', { level: info.to })"
  >
    <div class="flex flex-col items-center gap-3" data-testid="levelup">
      <PixelSprite :character="character.id" state="happy" :tier="info.tier" :scale="6" :alt="hero.name(character.id)" />
      <p v-if="info.tierChanged" class="font-display text-center text-xs text-[var(--xp)]">
        {{ t('levelUp.newTitle', { title: hero.tierTitle(character.id, info.tier) }) }}
      </p>
      <p v-if="info.chapter" class="text-center">{{ t('levelUp.chapterUnlocked', { n: info.chapter }) }}</p>
      <p class="levelup-line" data-testid="levelup-line">{{ levelUpLine(character.id, info.to) }}</p>
    </div>
    <template #actions>
      <PixelButton @click="game.dismissLevelUp()">{{ t('levelUp.cta') }}</PixelButton>
    </template>
  </PixelDialog>
</template>

<style scoped>
.levelup-line {
  padding: 8px 12px;
  text-align: center;
  background: var(--bg);
  box-shadow:
    0 -4px 0 0 var(--surface-2),
    0 4px 0 0 var(--surface-2),
    -4px 0 0 0 var(--surface-2),
    4px 0 0 0 var(--surface-2);
}
</style>
