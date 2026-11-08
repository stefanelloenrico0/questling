<script setup lang="ts">
const { t } = useI18n()

const tabs: { to: string; label: string; icon: string }[] = [
  { to: '/', label: 'nav.today', icon: 'calendar-check' },
  { to: '/quests', label: 'nav.quests', icon: 'list-checks' },
  { to: '/hero', label: 'nav.hero', icon: 'shield' },
  { to: '/stats', label: 'nav.stats', icon: 'chart-column' },
]
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <NuxtLink to="/settings" class="topbar__gear" active-class="topbar__gear--active" :aria-label="t('nav.settings')">
        <UiIcon name="settings" :size="24" />
      </NuxtLink>
    </header>

    <main class="mx-auto w-full max-w-md px-5 pt-3 pb-36">
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
.topbar {
  position: relative;
  height: 0;
  max-width: 28rem;
  margin: 0 auto;
  z-index: 10;
}
.topbar__gear {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  color: var(--text-soft);
  border-radius: 999px;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}
.topbar__gear:active,
.topbar__gear--active {
  color: var(--gold);
  background: var(--surface-active);
}

.tabbar {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 20;
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px calc(6px + var(--safe-bottom));
  background: color-mix(in srgb, var(--bg-2) 94%, transparent);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--edge);
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
  color: var(--text-muted);
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  text-decoration: none;
}
.tabbar__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 30px;
  border-radius: 999px;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}
.tabbar__item--active {
  color: var(--text);
  font-weight: 700;
}
.tabbar__item--active .tabbar__icon {
  color: var(--gold);
  background: var(--surface-active);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gold) 38%, transparent);
}
</style>
