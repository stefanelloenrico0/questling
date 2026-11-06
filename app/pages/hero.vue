<script setup lang="ts">
import { CHARACTERS } from '../../data/characters'
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
  <div v-if="mode === 'quiz'" class="flex flex-col gap-4" data-testid="hero-quiz">
    <h1 class="font-display text-sm">{{ t('hero.retakeTitle') }}</h1>
    <p class="text-[var(--text-soft)]">{{ t('hero.retakeNote') }}</p>
    <HeroQuiz @done="onQuizDone" />
    <div>
      <UiButton variant="secondary" @click="mode = 'view'">{{ t('hero.cancelQuiz') }}</UiButton>
    </div>
  </div>

  <div v-else class="flex flex-col gap-6" data-testid="page-hero">
    <UiCard tone="accent">
      <div class="flex items-center gap-4">
        <HeroArt :character="character.id" :tier="stats.tier" :size="176" :alt="hero.name(character.id)" />
        <div class="min-w-0">
          <h1 class="font-display text-sm">{{ hero.name(character.id) }}</h1>
          <p class="text-[var(--text-soft)]">{{ hero.archetype(character.id) }}</p>
          <p class="font-display mt-2 text-xs text-[var(--xp)]">
            {{ t('today.levelTitle', { level: stats.level.level, title: hero.levelTitle(character.id, stats.level.level) }) }}
          </p>
        </div>
      </div>
      <p class="mt-4"><span class="text-[var(--text-soft)]">{{ t('hero.voice') }}:</span> {{ hero.voice(character.id) }}</p>
      <p class="mt-2"><span class="text-[var(--text-soft)]">{{ t('hero.appearance') }}:</span> {{ hero.appearance(character.id) }}</p>
      <div class="mt-4 flex flex-wrap">
        <UiButton data-testid="hero-change" @click="openChange">{{ t('hero.change') }}</UiButton>
        <UiButton variant="secondary" data-testid="hero-retake" @click="mode = 'quiz'">{{ t('hero.retake') }}</UiButton>
      </div>
    </UiCard>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('hero.stats') }}</h2>
      <div class="flex flex-wrap">
        <StatChip :label="t('hero.statXp')" :value="stats.totalXp" />
        <StatChip :label="t('hero.statStreak')" :value="stats.streak.current" />
        <StatChip :label="t('hero.statBest')" :value="stats.streak.best" />
        <StatChip :label="t('hero.statDone')" :value="stats.questsCompleted" />
      </div>
      <div><UiButton variant="secondary" data-testid="hero-stats-link" @click="navigateTo('/stats')">{{ t('stats.link') }}</UiButton></div>
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
      <HeroGrid v-model="draft" :ids="allIds" :label="t('hero.changeTitle')" />
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
