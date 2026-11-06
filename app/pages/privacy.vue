<script setup lang="ts">
import policy from '../../i18n/locales/it/privacy.json'

definePageMeta({ layout: 'blank' })
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="page-privacy">
    <h1 class="font-display text-sm">{{ policy.title }}</h1>
    <p class="text-[var(--text-soft)]">{{ policy.updated }}</p>
    <UiCard v-for="section in policy.sections" :key="section.title">
      <h2 class="font-display mb-3 text-xs">{{ section.title }}</h2>
      <p v-for="p in section.paragraphs" :key="p" class="mb-2">{{ p }}</p>
    </UiCard>
    <div>
      <UiButton variant="secondary" @click="navigateTo('/')">{{ policy.back }}</UiButton>
    </div>
  </div>
</template>
