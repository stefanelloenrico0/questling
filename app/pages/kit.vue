<script setup lang="ts">
import { CHARACTERS } from '../../data/characters'

definePageMeta({ layout: 'blank' })

const { t } = useI18n()
const toast = usePixelToast()

const dialogOpen = ref(false)
const checked = ref(false)
const xp = ref(312)
const tiers = [1, 2, 3, 4, 5] as const

const palette = [
  { name: '--bg', value: '#1a1c2c' },
  { name: '--surface', value: '#333c57' },
  { name: '--surface-2', value: '#566c86' },
  { name: '--text', value: '#f4f4f4' },
  { name: '--text-soft', value: '#94b0c2' },
  { name: '--xp', value: '#ffcd75' },
  { name: '--ok', value: '#a7f070' },
  { name: '--warn', value: '#ef7d57' },
  { name: '--danger', value: '#b13e53' },
]
</script>

<template>
  <div class="flex flex-col gap-8 pb-12">
    <h1 class="font-display text-lg">{{ t('kit.title') }}</h1>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('kit.buttons') }}</h2>
      <div class="flex flex-wrap">
        <PixelButton>{{ t('kit.primary') }}</PixelButton>
        <PixelButton variant="secondary">{{ t('kit.secondary') }}</PixelButton>
        <PixelButton disabled>{{ t('kit.disabled') }}</PixelButton>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('kit.cards') }}</h2>
      <PixelCard>
        <h3 class="font-display mb-2 text-xs">{{ t('kit.cardTitle') }}</h3>
        <p>{{ t('kit.cardBody') }}</p>
      </PixelCard>
      <PixelCard tone="accent">
        <p>{{ t('kit.cardBody') }}</p>
      </PixelCard>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('kit.bars') }}</h2>
      <PixelBar :value="xp" :max="425" :label="t('a11y.xpBar')" />
      <p class="text-[var(--text-soft)]">{{ xp }}/425 {{ t('kit.xpLabel') }}</p>
      <div class="flex">
        <PixelButton variant="secondary" @click="xp = Math.max(0, xp - 50)">−50</PixelButton>
        <PixelButton variant="secondary" @click="xp = Math.min(425, xp + 50)">+50</PixelButton>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('kit.checks') }}</h2>
      <PixelCard>
        <PixelCheck v-model="checked" :label="t('kit.checkLabel')" />
      </PixelCard>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('kit.chips') }}</h2>
      <div class="flex flex-wrap">
        <StatChip :label="t('kit.level')" :value="7" />
        <StatChip :label="t('kit.streak')" :value="12" />
        <StatChip :label="t('kit.shields')" :value="1" />
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('kit.sprites') }}</h2>
      <div class="grid grid-cols-2 gap-4">
        <PixelCard v-for="c in CHARACTERS" :key="c.id" class="flex flex-col items-center gap-2" :style="{ '--accent': c.accent }" tone="accent">
          <PixelSprite :character="c.id" :scale="4" :alt="t(`characters.${c.id}.name`)" />
          <span class="font-display text-[10px]" :style="{ color: c.accent }">{{ t(`characters.${c.id}.name`) }}</span>
          <span class="text-center text-sm text-[var(--text-soft)]">{{ t(`characters.${c.id}.archetype`) }}</span>
          <PixelSprite :character="c.id" state="happy" :scale="2" :alt="t(`characters.${c.id}.name`)" />
        </PixelCard>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('kit.tiers') }}</h2>
      <div class="flex flex-wrap gap-4">
        <PixelCard v-for="tier in tiers" :key="tier" class="flex flex-col items-center gap-2">
          <PixelSprite character="valdo" :tier="tier" :scale="4" :alt="`Tier ${tier}`" />
          <span class="font-display text-[10px]">T{{ tier }}</span>
        </PixelCard>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('kit.dialog') }} / {{ t('kit.toast') }}</h2>
      <div class="flex flex-wrap">
        <PixelButton @click="dialogOpen = true">{{ t('kit.openDialog') }}</PixelButton>
        <PixelButton variant="secondary" @click="toast.show(t('kit.toastText'))">{{ t('kit.showToast') }}</PixelButton>
      </div>
      <PixelDialog v-model:open="dialogOpen" :title="t('kit.dialogTitle')" :description="t('kit.dialogBody')">
        <template #actions>
          <PixelButton @click="dialogOpen = false">{{ t('kit.close') }}</PixelButton>
        </template>
      </PixelDialog>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="font-display text-xs">{{ t('kit.palette') }}</h2>
      <div class="grid grid-cols-3 gap-2">
        <div v-for="p in palette" :key="p.name" class="flex flex-col gap-1">
          <div class="h-12" :style="{ background: p.value, boxShadow: '0 0 0 4px var(--surface-2)' }" />
          <span class="text-xs text-[var(--text-soft)]">{{ p.name }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
