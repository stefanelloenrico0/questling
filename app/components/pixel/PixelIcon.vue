<script setup lang="ts">
import { ICONS, isIconId } from '../../../data/icons'

// Icona 8x8 pixel, disegnata come SVG a spigoli vivi. Scala intera.
const props = withDefaults(defineProps<{ name: string; scale?: number }>(), { scale: 4 })

const path = computed(() => {
  const rows = isIconId(props.name) ? ICONS[props.name] : ICONS.star
  let d = ''
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') d += `M${x} ${y}h1v1h-1z`
  })
  return d
})
</script>

<template>
  <svg
    viewBox="0 0 8 8"
    :width="8 * scale"
    :height="8 * scale"
    shape-rendering="crispEdges"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    style="flex: none"
  >
    <path :d="path" />
  </svg>
</template>
