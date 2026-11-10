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
  color: var(--text);
  background: rgb(11 16 32 / 0.42);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 0.14);
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
  inset: auto 0 calc(12px + var(--safe-bottom)) 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  gap: 2px;
  max-width: calc(28rem - 24px);
  margin: 0 auto;
  padding: 6px;
  width: calc(100% - 32px);
  background: linear-gradient(180deg, rgb(40 54 88 / 0.74), rgb(18 26 46 / 0.86));
  backdrop-filter: blur(22px) saturate(1.5);
  -webkit-backdrop-filter: blur(22px) saturate(1.5);
  border: 1px solid color-mix(in srgb, var(--accent) 26%, rgb(160 185 240 / 0.3));
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    0 14px 34px -10px rgb(0 0 0 / 0.75),
    0 0 26px -14px var(--accent);
}
.tabbar__item {
  flex: 1 1 0;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 999px;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}
.tabbar__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 26px;
}
.tabbar__item--active {
  color: var(--text);
  font-weight: 700;
  background: linear-gradient(180deg, rgb(233 184 94 / 0.26), rgb(233 184 94 / 0.1));
  box-shadow:
    inset 0 0 0 1px rgb(233 184 94 / 0.45),
    0 0 18px -8px var(--gold);
}
.tabbar__item--active .tabbar__icon {
  color: var(--gold);
}
</style>
