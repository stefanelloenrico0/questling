<script setup lang="ts">
const game = useGameStore()
const override = useAccentOverride()

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
    <MergeDialog />
  </UApp>
</template>
