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
  gap: 2px;
  min-width: 84px;
  padding: 10px 14px;
  margin: 4px;
  background: var(--bg-2);
  border: 1px solid var(--edge);
  border-radius: var(--radius-m);
}
.stat-chip__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-soft);
}
.stat-chip__value {
  font-size: 20px;
  color: var(--xp);
}
</style>
