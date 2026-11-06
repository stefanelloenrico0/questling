<script setup lang="ts">
import { ICONS, isIconId } from '../../../data/icons'

// Icona Lucide: `name` e' un ID di missione (data/icons.ts) oppure un nome Lucide dell'interfaccia.
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 24 })
const icon = computed(() => `lucide:${isIconId(props.name) ? ICONS[props.name] : props.name}`)
</script>

<template>
  <UIcon :name="icon" class="ui-icon" :style="{ width: `${size}px`, height: `${size}px` }" aria-hidden="true" />
</template>

<style scoped>
.ui-icon {
  flex: none;
}
</style>
