<script setup lang="ts">
// Tre schermate brevi e saltabili. La seconda e' una mini-prova: si tocca una missione e si vede l'XP.
const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()

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
    class="flex flex-col gap-6 pt-2"
    data-testid="step-intro"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
    @keydown.right="go(1)"
    @keydown.left="go(-1)"
  >
    <UiCard tone="accent">
      <div class="intro-visual" aria-hidden="true">
        <template v-if="slide === 0">
          <HeroArt character="valdo" :size="104" />
          <HeroArt character="zeffiro" :size="124" />
          <HeroArt character="brunilde" :size="104" />
        </template>
        <div v-else-if="slide === 1" class="demo">
          <HeroArt character="kuro" :state="demoDone ? 'happy' : 'idle'" :size="104" class="mx-auto" />
          <UiBar :value="demoDone ? 10 : 0" :max="10" :label="t('common.xp')" />
          <p class="demo__gain" :class="{ 'demo__gain--on': demoDone }">{{ t('today.xpGain', { xp: 10 }) }}</p>
        </div>
        <template v-else>
          <HeroArt character="lumen" state="happy" :size="124" />
        </template>
      </div>

      <div v-if="slide === 1" class="my-3">
        <UiCheck v-model="demoDone" :label="t('onboarding.intro.s2Demo')" data-testid="intro-demo" />
        <p class="mt-2 text-[var(--text-soft)]" role="status">
          {{ demoDone ? t('onboarding.intro.s2Done') : t('onboarding.intro.s2Hint') }}
        </p>
      </div>
      <div v-else-if="slide === 2" class="my-3 flex flex-wrap">
        <StatChip :label="t('today.streak')" :value="t('onboarding.intro.s3Streak')" />
        <StatChip :label="t('today.shields')" :value="t('onboarding.intro.s3Shields')" />
      </div>

      <h2 class="font-display mb-3 text-sm">{{ t(`onboarding.intro.s${slide + 1}Title`) }}</h2>
      <p>{{ t(`onboarding.intro.s${slide + 1}Body`) }}</p>
      <p v-if="slide === 2" class="mt-2 text-[var(--text-soft)]">{{ t('onboarding.intro.s3Note') }}</p>
    </UiCard>

    <div class="flex items-center justify-center gap-3" role="group" :aria-label="t('onboarding.intro.swipeHint')">
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

    <div class="flex justify-between gap-2">
      <UiButton variant="secondary" data-testid="intro-skip" @click="emit('done')">{{ t('onboarding.intro.skip') }}</UiButton>
      <UiButton data-testid="intro-next" @click="go(1)">{{ t('onboarding.intro.next') }}</UiButton>
    </div>
  </section>
</template>

<style scoped>
.intro-visual {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  min-height: 132px;
}
.demo {
  width: 100%;
  display: grid;
  gap: 8px;
  text-align: center;
}
.demo__gain {
  font-family: var(--font-display, inherit);
  font-weight: 700;
  color: var(--xp);
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.demo__gain--on {
  opacity: 1;
  transform: none;
}
.dot {
  width: 12px;
  height: 12px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--edge);
  cursor: pointer;
  transition:
    width 0.2s ease,
    background 0.2s ease;
}
.dot--on {
  width: 28px;
  background: var(--accent);
}
@media (prefers-reduced-motion: reduce) {
  .demo__gain,
  .dot {
    transition: none;
  }
}
</style>
