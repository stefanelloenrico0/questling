<script setup lang="ts">
defineProps<{ label: string; value: string | number }>()
</script>

<template>
  <div class="stat-chip">
    <span class="stat-chip__label">{{ label }}</span>
    <span class="stat-chip__value font-display">{{ value }}</span>
  </div>
</template>

<style scoped>
.stat-chip {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  min-width: 80px;
  padding: 8px 12px;
  margin: 4px;
  background: var(--bg);
  box-shadow:
    0 -4px 0 0 var(--surface-2),
    0 4px 0 0 var(--surface-2),
    -4px 0 0 0 var(--surface-2),
    4px 0 0 0 var(--surface-2);
}
.stat-chip__label {
  font-size: 16px;
  color: var(--text-soft);
}
.stat-chip__value {
  font-size: 12px;
  color: var(--xp);
}
</style>
