<script setup lang="ts">
import type { IconId } from '../../data/icons'

const { t } = useI18n()

const tabs: { to: string; label: string; icon: IconId }[] = [
  { to: '/', label: 'nav.today', icon: 'sun' },
  { to: '/quests', label: 'nav.quests', icon: 'book' },
  { to: '/hero', label: 'nav.hero', icon: 'shield' },
  { to: '/settings', label: 'nav.settings', icon: 'key' },
]
</script>

<template>
  <div class="app-shell">
    <main class="mx-auto w-full max-w-md px-4 pt-4 pb-32">
      <slot />
    </main>
    <nav class="tabbar" :aria-label="t('nav.label')">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="tabbar__item"
        active-class="tabbar__item--active"
        exact-active-class="tabbar__item--active"
      >
        <PixelIcon :name="tab.icon" :scale="3" />
        <span>{{ t(tab.label) }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.tabbar {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 20;
  display: flex;
  justify-content: center;
  padding-bottom: var(--safe-bottom);
  background: var(--surface);
  box-shadow: 0 -4px 0 0 var(--surface-2);
}
.tabbar__item {
  flex: 1 1 0;
  max-width: 112px;
  min-height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-soft);
  font-size: 16px;
  text-decoration: none;
  border-top: 4px solid transparent;
}
.tabbar__item--active {
  color: var(--text);
  border-top-color: var(--accent);
}
.tabbar__item--active :deep(svg) {
  color: var(--accent);
}
</style>
