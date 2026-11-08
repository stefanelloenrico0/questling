<script setup lang="ts">
// Primitivo accessibile di Nuxt UI (UModal), completamente ridisegnato con il look di Questling.
// `celebrate`: schermata di festa a tutto schermo (level-up, nuovo eroe) con sfondo dipinto.
import celebrateScene from '../../assets/scenes/onb-glade.webp'

const open = defineModel<boolean>('open', { default: false })

withDefaults(defineProps<{ title: string; description?: string; dismissible?: boolean; celebrate?: boolean }>(), {
  description: undefined,
  dismissible: true,
  celebrate: false,
})
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :dismissible="dismissible"
    :ui="{
      overlay: celebrate ? 'bg-black/90' : 'bg-black/70',
      content: celebrate
        ? 'bg-transparent ring-0 shadow-none rounded-none divide-none overflow-hidden top-0 left-0 translate-x-0 translate-y-0 w-screen max-w-none h-dvh'
        : 'bg-transparent ring-0 shadow-none rounded-none divide-none overflow-visible max-w-sm w-[calc(100vw-48px)]',
    }"
  >
    <template #content>
      <div v-if="celebrate" class="celebrate">
        <img class="celebrate__bg" :src="celebrateScene" alt="" draggable="false" />
        <div class="celebrate__shade" aria-hidden="true" />
        <div class="celebrate__frame">
          <h2 class="celebrate__title">{{ title }}</h2>
          <p v-if="description" class="celebrate__desc">{{ description }}</p>
          <div class="celebrate__body"><slot /></div>
          <div class="celebrate__actions"><slot name="actions" /></div>
        </div>
      </div>
      <UiCard v-else tone="raised" class="ui-dialog-card">
        <h2 class="font-display mb-3 text-sm">{{ title }}</h2>
        <p v-if="description" class="mb-4 text-[var(--text-soft)]">{{ description }}</p>
        <slot />
        <div class="mt-4 flex justify-end">
          <slot name="actions" />
        </div>
      </UiCard>
    </template>
  </UModal>
</template>

<style scoped>
.ui-dialog-card {
  max-height: 85dvh;
  overflow-y: auto;
}
.celebrate {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--bg);
  overflow: hidden;
}
.celebrate__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.celebrate__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(11 16 32 / 0.78) 0%, rgb(11 16 32 / 0.15) 40%, rgb(11 16 32 / 0.2) 62%, rgb(11 16 32 / 0.9) 100%);
}
.celebrate__frame {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 28rem;
  margin: 0 auto;
  padding: calc(var(--safe-top) + 28px) 24px calc(var(--safe-bottom) + 20px);
}
.celebrate__title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 44px;
  line-height: 48px;
  text-align: center;
  color: #fff3d6;
  text-shadow: 0 3px 18px rgb(0 0 0 / 0.8);
  min-height: 96px;
}
.celebrate__desc {
  margin: 4px 0 0;
  text-align: center;
  font-size: 17px;
  line-height: 24px;
  color: var(--text);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.85);
}
.celebrate__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
.celebrate__actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding-top: 12px;
}
.celebrate__actions :deep(.ui-btn) {
  width: 100%;
}
</style>
