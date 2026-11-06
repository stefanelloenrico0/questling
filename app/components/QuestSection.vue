<script setup lang="ts">
import { periodProgress, type QuestRowView } from '../../core/selectors'

const props = defineProps<{ title: string; rows: QuestRowView[] }>()
const { t } = useI18n()
const progress = computed(() => periodProgress(props.rows))
</script>

<template>
  <UiCard>
    <div class="mb-2 flex items-center justify-between">
      <h2 class="font-display text-xs">{{ title }}</h2>
      <span class="font-display text-xs" data-testid="section-progress">{{ t('today.progress', { done: progress.done, total: progress.total }) }}</span>
    </div>
    <QuestRow v-for="row in rows" :key="row.quest.id" :row="row" />
  </UiCard>
</template>
