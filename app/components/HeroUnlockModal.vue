<script setup lang="ts">
import { CHARACTER_BY_ID } from '../../data/characters'
// Annuncia un eroe appena sbloccato. Aspetta che il modale di level-up (se c'e') sia stato chiuso.
const game = useGameStore()
const { t } = useI18n()
const hero = useHero()
const fx = useFeedback()
const toast = useUiToast()

const id = computed(() => (game.pendingLevelUp ? null : (game.pendingHeroUnlock[0] ?? null)))
const open = computed({
  get: () => id.value !== null,
  set: (v: boolean) => {
    if (!v) game.dismissHeroUnlock()
  },
})
const accent = computed(() => (id.value ? CHARACTER_BY_ID[id.value].accent : 'var(--accent)'))

watch(
  id,
  (value) => {
    if (value) fx.levelUp()
  },
  { immediate: true },
)

function choose(): void {
  if (!id.value) return
  const chosen = id.value
  game.chooseHero(chosen)
  toast.show(t('hero.changeDone', { name: hero.name(chosen) }))
  game.dismissHeroUnlock()
}
</script>

<template>
  <UiDialog
    v-if="id"
    v-model:open="open"
    :title="t('heroUnlock.title')"
    :description="t('heroUnlock.body', { name: hero.name(id) })"
  >
    <div class="flex flex-col items-center gap-3" data-testid="hero-unlock" :style="{ '--hc': accent }">
      <HeroArt :character="id" state="happy" :size="176" :alt="hero.name(id)" />
      <p class="font-display text-center text-lg unlock-name">{{ hero.name(id) }}</p>
      <p class="text-center text-[var(--text-soft)]">{{ hero.archetype(id) }}</p>
      <p class="unlock-line">{{ hero.voice(id) }}</p>
    </div>
    <template #actions>
      <div class="flex gap-2">
        <UiButton variant="secondary" data-testid="hero-unlock-later" @click="game.dismissHeroUnlock()">{{ t('heroUnlock.later') }}</UiButton>
        <UiButton data-testid="hero-unlock-choose" @click="choose">{{ t('heroUnlock.choose', { name: hero.name(id) }) }}</UiButton>
      </div>
    </template>
  </UiDialog>
</template>

<style scoped>
.unlock-name {
  color: var(--hc);
}
.unlock-line {
  padding: 10px 14px;
  text-align: center;
  background: var(--bg-2);
  border: 1px solid var(--edge);
  border-radius: 18px;
}
</style>
