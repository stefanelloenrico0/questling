<script setup lang="ts">
import type { CharacterId } from '../../core/types'

const model = defineModel<CharacterId | null>({ default: null })
defineProps<{
  ids: readonly CharacterId[]
  label: string
  affinities?: Partial<Record<CharacterId, number | null>>
}>()
</script>

<template>
  <div class="grid grid-cols-2 gap-1" role="radiogroup" :aria-label="label">
    <HeroCard
      v-for="id in ids"
      :id="id"
      :key="id"
      :selected="model === id"
      :affinity="affinities?.[id]"
      @click="model = id"
    />
  </div>
</template>
