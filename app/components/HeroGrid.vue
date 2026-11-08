<script setup lang="ts">
import type { CharacterId } from '../../core/types'

const model = defineModel<CharacterId | null>({ default: null })
const props = defineProps<{
  ids: readonly CharacterId[]
  label: string
  affinities?: Partial<Record<CharacterId, number | null>>
  /** id -> come sbloccarlo, per gli eroi ancora bloccati */
  locked?: Partial<Record<CharacterId, string>>
}>()

function pick(id: CharacterId): void {
  if (!props.locked?.[id]) model.value = id
}
</script>

<template>
  <div class="grid grid-cols-2 gap-1" role="radiogroup" :aria-label="label">
    <HeroCard
      v-for="id in ids"
      :id="id"
      :key="id"
      :selected="model === id"
      :affinity="affinities?.[id]"
      :locked-hint="locked?.[id]"
      @click="pick(id)"
    />
  </div>
</template>
