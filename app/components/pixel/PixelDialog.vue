<script setup lang="ts">
// Primitivo accessibile di Nuxt UI (UModal), completamente ridisegnato in stile pixel.
const open = defineModel<boolean>('open', { default: false })

defineProps<{ title: string; description?: string }>()
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{
      overlay: 'bg-black/70',
      content:
        'bg-transparent ring-0 shadow-none rounded-none divide-none overflow-visible max-w-sm w-[calc(100vw-48px)]',
    }"
  >
    <template #content>
      <PixelCard tone="accent" class="pixel-dialog-card">
        <h2 class="font-display mb-4 text-sm">{{ title }}</h2>
        <p v-if="description" class="mb-4 text-[var(--text-soft)]">{{ description }}</p>
        <slot />
        <div class="mt-4 flex justify-end">
          <slot name="actions" />
        </div>
      </PixelCard>
    </template>
  </UModal>
</template>

<style scoped>
.pixel-dialog-card {
  max-height: 85dvh;
  overflow-y: auto;
}
</style>
