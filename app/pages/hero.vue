<script setup lang="ts">
import { PALETTE } from '../../data/icons'
import { CHARACTERS } from '../../data/characters'
import bannerScene from '../assets/scenes/hero-banner.webp'
import { TIER_LEVELS } from '../../core/levels'
import type { CharacterId } from '../../core/types'

const game = useGameStore()
const { t } = useI18n()
const hero = useHero()
const toast = useUiToast()

const character = computed(() => game.character!)
const stats = computed(() => game.stats)
const unlocked = computed(() => game.state.unlockedChapters[character.value.id] ?? [1])
const allIds = CHARACTERS.map((c) => c.id)

// Eroi ancora bloccati -> come sbloccarli (con i progressi di oggi)
const locked = computed(() => {
  const out: Partial<Record<CharacterId, string>> = {}
  for (const c of CHARACTERS) {
    if (!c.unlock || c.id === character.value.id || game.availableHeroes.includes(c.id)) continue
    out[c.id] =
      c.unlock.kind === 'level'
        ? t('hero.unlockLevel', { n: c.unlock.value, now: game.heroProgressNow.level })
        : t('hero.unlockStreak', { n: c.unlock.value, now: game.heroProgressNow.bestStreak })
  }
  return out
})

const mode = ref<'view' | 'quiz'>('view')
const changeOpen = ref(false)
const draft = ref<CharacterId | null>(null)

function openChange(): void {
  draft.value = character.value.id
  changeOpen.value = true
}
function confirmChange(): void {
  if (draft.value) {
    game.chooseHero(draft.value)
    toast.show(t('hero.changeDone', { name: hero.name(draft.value) }))
  }
  changeOpen.value = false
}
function onQuizDone(payload: { answers: number[]; characterId: CharacterId }): void {
  game.applyQuiz(payload.answers, payload.characterId)
  mode.value = 'view'
  toast.show(t('hero.changeDone', { name: hero.name(payload.characterId) }))
}
</script>

<template>
  <div v-if="mode === 'quiz'" class="retake" data-testid="hero-quiz">
    <div class="onb retake__frame">
      <header class="retake__top">
        <button type="button" class="retake__back" :aria-label="t('hero.cancelQuiz')" data-testid="hero-quiz-cancel" @click="mode = 'view'">
          <UiIcon name="x" :size="26" />
        </button>
        <span class="retake__title">{{ t('hero.retakeTitle') }}</span>
      </header>
      <HeroQuiz @done="onQuizDone" />
    </div>
  </div>

  <div v-else class="flex flex-col gap-6" data-testid="page-hero">
    <div class="hero-card">
      <div class="hero-banner">
        <img class="hero-banner__img" :src="bannerScene" alt="" draggable="false" />
        <div class="hero-banner__art">
          <HeroArt :character="character.id" :tier="stats.tier" :size="300" :alt="hero.name(character.id)" />
        </div>
      </div>
      <div class="hero-who min-w-0">
        <h1 class="hero-who__name">{{ hero.name(character.id) }}</h1>
        <p class="text-[var(--text-soft)]">{{ hero.archetype(character.id) }}</p>
        <p class="mt-2 text-[var(--gold)]" style="font-weight: 700; font-size: 18px; line-height: 24px">
          {{ t('today.levelTitle', { level: stats.level.level, title: hero.levelTitle(character.id, stats.level.level) }) }}
        </p>
      </div>
      <p class="mt-4"><span class="text-[var(--text-soft)]">{{ t('hero.voice') }}:</span> {{ hero.voice(character.id) }}</p>
      <p class="mt-2"><span class="text-[var(--text-soft)]">{{ t('hero.appearance') }}:</span> {{ hero.appearance(character.id) }}</p>
      <div class="mt-4 flex flex-wrap">
        <UiButton data-testid="hero-change" @click="openChange">{{ t('hero.change') }}</UiButton>
        <UiButton variant="secondary" data-testid="hero-retake" @click="mode = 'quiz'">{{ t('hero.retake') }}</UiButton>
      </div>
    </div>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('hero.stats') }}</h2>
      <div class="grid grid-cols-2 gap-2.5">
        <StatChip icon="sparkles" :color="PALETTE.gold" :label="t('hero.statXp')" :value="stats.totalXp" />
        <StatChip icon="flame" :color="PALETTE.orange" :label="t('hero.statStreak')" :value="stats.streak.current" />
        <StatChip icon="trophy" :color="PALETTE.violet" :label="t('hero.statBest')" :value="stats.streak.best" />
        <StatChip icon="check" :color="PALETTE.green" :label="t('hero.statDone')" :value="stats.questsCompleted" />
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('hero.story') }}</h2>
      <UiCard v-for="n in 5" :key="n" :data-testid="`chapter-${n}`">
        <h3 class="font-display mb-2 text-xs">{{ t('common.chapter', { n }) }}</h3>
        <p v-if="unlocked.includes(n)">{{ hero.chapter(character.id, n) }}</p>
        <p v-else class="flex items-center gap-2 text-[var(--text-soft)]">
          <UiIcon name="lock" :size="22" />
          <span>{{ t('a11y.locked') }} · {{ t('hero.locked', { level: TIER_LEVELS[n - 1] }) }}</span>
        </p>
      </UiCard>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('hero.titlesTimeline') }}</h2>
      <UiCard>
        <ol class="flex flex-col gap-2">
          <li v-for="tier in 5" :key="tier" class="flex items-center justify-between gap-2" :class="{ 'text-[var(--text-soft)]': tier > stats.tier }">
            <span>{{ t('hero.tierLabel', { n: tier }) }} · {{ hero.tierTitle(character.id, tier) }}</span>
            <span class="font-display text-[10px]">
              {{ tier === stats.tier ? t('hero.current') : t('hero.unlockedAt', { level: TIER_LEVELS[tier - 1] }) }}
            </span>
          </li>
        </ol>
      </UiCard>
    </section>

    <UiDialog v-model:open="changeOpen" :title="t('hero.changeTitle')" :description="t('hero.changeNote')">
      <HeroGrid v-model="draft" :ids="allIds" :locked="locked" :label="t('hero.changeTitle')" />
      <template #actions>
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="changeOpen = false">{{ t('common.cancel') }}</UiButton>
          <UiButton :disabled="!draft" data-testid="hero-change-confirm" @click="confirmChange">
            {{ draft ? t('hero.changeConfirm', { name: hero.name(draft) }) : t('common.confirm') }}
          </UiButton>
        </div>
      </template>
    </UiDialog>
  </div>
</template>

<style scoped>
.retake {
  position: fixed;
  inset: 0;
  z-index: 40;
  padding: calc(var(--safe-top) + 12px) 20px calc(var(--safe-bottom) + 16px);
  background: var(--bg);
}
.retake__frame {
  height: 100%;
  max-width: 28rem;
  margin: 0 auto;
}
.retake__top {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  margin-left: -12px;
}
.retake__back {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  color: var(--text);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.retake__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-soft);
}
.hero-banner {
  position: relative;
  height: 340px;
  margin: -12px -20px 0;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(180deg, #000 78%, transparent);
  mask-image: linear-gradient(180deg, #000 78%, transparent);
}
.hero-who {
  position: relative;
  margin-top: -44px;
  text-align: center;
}
.hero-who__name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 36px;
  line-height: 40px;
  color: var(--text);
  text-shadow: 0 3px 14px rgb(0 0 0 / 0.7);
}
.hero-banner__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-banner__art {
  position: absolute;
  inset: auto 0 2px;
  display: flex;
  justify-content: center;
}
</style>
