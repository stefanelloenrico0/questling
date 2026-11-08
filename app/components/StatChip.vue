<script setup lang="ts">
defineProps<{ label: string; value: string | number; icon?: string; color?: string }>()
</script>

<template>
  <div class="stat-chip">
    <UiIconTile v-if="icon" :name="icon" :size="40" :color="color" />
    <div class="stat-chip__text">
      <span class="stat-chip__label">{{ label }}</span>
      <span class="stat-chip__value num">{{ value }}</span>
    </div>
  </div>
</template>

<style scoped>
.stat-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px 12px;
  background: linear-gradient(180deg, rgb(32 43 69 / 0.7), rgb(18 26 46 / 0.8));
  border: 1px solid rgb(129 160 230 / 0.28);
  border-radius: var(--radius-m);
}
.stat-chip__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.stat-chip__label {
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.stat-chip__value {
  font-size: 24px;
  line-height: 30px;
  color: var(--text);
}
</style>
