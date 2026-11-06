<script setup lang="ts">
const { t } = useI18n()

const tabs: { to: string; label: string; icon: string }[] = [
  { to: '/', label: 'nav.today', icon: 'calendar-check' },
  { to: '/quests', label: 'nav.quests', icon: 'list-checks' },
  { to: '/hero', label: 'nav.hero', icon: 'shield' },
  { to: '/settings', label: 'nav.settings', icon: 'settings' },
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
        <span class="tabbar__icon"><UiIcon :name="tab.icon" :size="24" /></span>
        <span class="tabbar__label">{{ t(tab.label) }}</span>
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
  gap: 4px;
  padding: 8px 12px calc(8px + var(--safe-bottom));
  background: color-mix(in srgb, var(--bg-2) 92%, transparent);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--edge);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -12px 30px -16px rgb(0 0 0 / 0.7);
}
.tabbar__item {
  flex: 1 1 0;
  max-width: 104px;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.tabbar__icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 30px;
  border-radius: 999px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}
.tabbar__item--active {
  color: var(--text);
}
.tabbar__item--active .tabbar__icon {
  color: #14162a;
  background: var(--accent);
}
</style>
