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
    celebrate
  >
    <div class="un" data-testid="hero-unlock" :style="{ '--hc': accent }">
      <div class="un__stage">
        <div class="un__glow" aria-hidden="true" />
        <HeroArt :character="id" state="happy" fluid :alt="hero.name(id)" />
      </div>
      <p class="un__name">{{ hero.name(id) }}</p>
      <p class="un__arch">{{ hero.archetype(id) }}</p>
      <p class="un__line">{{ hero.voice(id) }}</p>
    </div>
    <template #actions>
      <UiButton data-testid="hero-unlock-choose" @click="choose">{{ t('heroUnlock.choose', { name: hero.name(id) }) }}</UiButton>
      <UiButton variant="ghost" data-testid="hero-unlock-later" @click="game.dismissHeroUnlock()">{{ t('heroUnlock.later') }}</UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.un {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  min-height: 0;
}
.un__stage {
  position: relative;
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  min-height: 0;
}
.un__glow {
  position: absolute;
  inset: 4% -10% 0;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--hc) 55%, transparent), transparent 72%);
}
.un__stage > :deep(.hero) {
  position: relative;
}
.un__name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 34px;
  line-height: 38px;
  color: var(--hc);
  text-shadow: 0 3px 14px rgb(0 0 0 / 0.85);
}
.un__arch {
  margin: 0;
  color: var(--text);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.85);
}
.un__line {
  margin: 6px 8px 0;
  min-height: 52px;
  text-align: center;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  color: var(--text);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.85);
}
</style>
