<script setup lang="ts">
import scene1 from '../../assets/scenes/onb-1.webp'
import scene2 from '../../assets/scenes/onb-2.webp'
import scene3 from '../../assets/scenes/onb-3.webp'
// Tre schermate a tutto schermo, saltabili. La seconda e' una mini-prova: si tocca una missione e si vede l'XP.
const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()

const SCENES = [scene1, scene2, scene3]
const SLIDES = 3
const slide = ref(0)
const demoDone = ref(false)
let startX = 0

function go(delta: number): void {
  const next = slide.value + delta
  if (next < 0) return
  if (next >= SLIDES) emit('done')
  else slide.value = next
}

function onTouchStart(e: TouchEvent): void {
  startX = e.touches[0]?.clientX ?? 0
}

function onTouchEnd(e: TouchEvent): void {
  const dx = (e.changedTouches[0]?.clientX ?? startX) - startX
  if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
}
</script>

<template>
  <section
    class="onb-screen intro"
    data-testid="step-intro"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
    @keydown.right="go(1)"
    @keydown.left="go(-1)"
  >
    <OnboardingScene :src="SCENES[slide]" />

    <div class="intro__skip">
      <UiButton variant="ghost" compact data-testid="intro-skip" @click="emit('done')">{{ t('onboarding.intro.skip') }}</UiButton>
    </div>

    <div class="intro__copy onb-head">
      <h2 class="onb-title">{{ t(`onboarding.intro.s${slide + 1}Title`) }}</h2>
      <p class="onb-sub">{{ t(`onboarding.intro.s${slide + 1}Body`) }}</p>
    </div>

    <div class="intro__stage">
      <div v-if="slide === 1" class="intro__demo glass">
        <div class="intro__demo-bar">
          <div class="flex-1"><UiBar :value="demoDone ? 10 : 0" :max="10" :label="t('common.xp')" /></div>
          <span class="intro__gain num" :class="{ 'intro__gain--on': demoDone }">{{ t('today.xpGain', { xp: 10 }) }}</span>
        </div>
        <UiCheck v-model="demoDone" :label="t('onboarding.intro.s2Demo')" data-testid="intro-demo" />
        <p class="intro__hint" role="status">{{ demoDone ? t('onboarding.intro.s2Done') : t('onboarding.intro.s2Hint') }}</p>
      </div>
      <div v-else-if="slide === 2" class="intro__chips">
        <StatChip :label="t('today.streak')" :value="t('onboarding.intro.s3Streak')" />
        <StatChip :label="t('today.shields')" :value="t('onboarding.intro.s3Shields')" />
      </div>
      <p v-if="slide === 2" class="intro__note">{{ t('onboarding.intro.s3Note') }}</p>

      <div class="intro__heroes" aria-hidden="true">
        <template v-if="slide === 0">
          <HeroArt character="valdo" :size="170" />
          <HeroArt character="zeffiro" :size="210" />
          <HeroArt character="brunilde" :size="170" />
        </template>
        <HeroArt v-else-if="slide === 1" character="kuro" :state="demoDone ? 'happy' : 'idle'" :size="210" />
        <HeroArt v-else character="lumen" state="happy" :size="220" />
      </div>
    </div>

    <div class="onb-actions intro__actions">
      <div class="intro__nav">
        <div class="intro__dots" role="group" :aria-label="t('onboarding.intro.swipeHint')">
          <button
            v-for="n in SLIDES"
            :key="n"
            type="button"
            class="dot"
            :class="{ 'dot--on': slide === n - 1 }"
            :aria-label="t('onboarding.intro.dots', { n, total: SLIDES })"
            :aria-current="slide === n - 1 ? 'step' : undefined"
            @click="slide = n - 1"
          />
        </div>
        <UiButton data-testid="intro-next" @click="go(1)">{{ t('onboarding.intro.next') }} →</UiButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.intro__skip {
  position: absolute;
  top: -4px;
  right: -8px;
  z-index: 2;
}
.intro__copy {
  position: relative;
  z-index: 1;
  padding-top: 52px;
}
.intro__stage {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 12px;
  min-height: 0;
}
.intro__demo {
  padding: 14px 16px;
}
.intro__demo-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}
.intro__gain {
  min-width: 64px;
  text-align: right;
  color: var(--gold);
  opacity: 0.35;
  transition: opacity 0.25s ease;
}
.intro__gain--on {
  opacity: 1;
}
.intro__hint {
  min-height: 44px;
  margin: 4px 0 0;
  font-size: 15px;
  color: var(--text-soft);
}
.intro__chips {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.intro__note {
  margin: 0 auto;
  max-width: 32ch;
  text-align: center;
  font-size: 15px;
  color: var(--text);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.8);
}
.intro__heroes {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0;
  margin-bottom: -8px;
}
.intro__heroes > :deep(.hero:not(:first-child)) {
  margin-left: -20px;
}
.intro__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.intro__dots {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 8px;
}
.dot {
  width: 11px;
  height: 11px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgb(245 240 229 / 0.35);
  cursor: pointer;
  transition:
    width 0.2s ease,
    background 0.2s ease;
}
.dot--on {
  width: 26px;
  background: var(--gold);
}
@media (prefers-reduced-motion: reduce) {
  .intro__gain,
  .dot {
    transition: none;
  }
}
</style>
