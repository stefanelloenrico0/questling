<script setup lang="ts">
const game = useGameStore()
const override = useAccentOverride()

// attributo lang della pagina: segue la lingua scelta (accessibilita' e sillabazione)
useHead({ htmlAttrs: { lang: computed(() => game.settings.locale) } })

const accent = computed(() => override.value ?? game.character?.accent ?? '#41a6f6')
watchEffect(() => {
  if (import.meta.client) document.documentElement.style.setProperty('--accent', accent.value)
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <LevelUpModal />
    <HeroUnlockModal />
    <MergeDialog />
  </UApp>
</template>
