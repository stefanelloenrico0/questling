<script setup lang="ts">
import { PERIODS, type Period } from '../../core/types'
import { QUEST_CAPS } from '../../core/xp'

const game = useGameStore()
const { t } = useI18n()

const period = ref<Period>('daily')
const sheetOpen = ref(false)
const editingId = ref<string | null>(null)

const rows = computed(() => game.rows(period.value))
const capReached = computed(() => game.capReached(period.value))
const max = computed(() => QUEST_CAPS[period.value])
const periodOptions = computed(() => PERIODS.map((p) => ({ value: p, label: t(`period.${p}Short`) })))

const periodModel = computed({
  get: () => period.value as string,
  set: (v: string) => (period.value = v as Period),
})

function openNew(): void {
  editingId.value = null
  sheetOpen.value = true
}
function openEdit(id: string): void {
  editingId.value = id
  sheetOpen.value = true
}
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="page-quests">
    <h1 class="font-display text-sm">{{ t('quests.title') }}</h1>

    <PixelSegmented v-model="periodModel" :label="t('quests.title')" :options="periodOptions" />

    <div class="flex items-center justify-between">
      <span class="font-display text-xs" data-testid="quest-slots">{{ t('quests.slots', { used: rows.length, max }) }}</span>
      <PixelButton :disabled="capReached" data-testid="quest-add" @click="openNew">{{ t('quests.add') }}</PixelButton>
    </div>

    <p v-if="capReached" class="text-[var(--warn)]" data-testid="cap-message">
      {{ t('quests.capReached', { max, period: t(`period.${period}Plural`) }) }}
    </p>

    <p v-if="rows.length === 0" class="text-[var(--text-soft)]">
      {{ t('quests.empty', { period: t(`period.${period}Plural`) }) }}
    </p>

    <PixelCard v-for="(row, i) in rows" :key="row.quest.id" data-testid="quest-item">
      <div class="flex items-center gap-3">
        <PixelIcon :name="row.quest.icon" :scale="4" />
        <div class="min-w-0 flex-1">
          <div class="break-words">{{ row.quest.title }}</div>
          <div class="text-[var(--text-soft)]">
            {{ row.quest.target > 1 ? t('quests.perPeriod', { target: row.quest.target }) : t('quests.oncePerPeriod') }}
            · {{ t('quests.xpEach', { xp: row.xp }) }}
          </div>
        </div>
      </div>
      <div class="mt-2 flex justify-end">
        <PixelButton variant="secondary" compact :disabled="i === 0" :aria-label="t('quests.moveUp', { title: row.quest.title })" @click="game.moveQuest(period, row.quest.id, -1)">▲</PixelButton>
        <PixelButton variant="secondary" compact :disabled="i === rows.length - 1" :aria-label="t('quests.moveDown', { title: row.quest.title })" @click="game.moveQuest(period, row.quest.id, 1)">▼</PixelButton>
        <PixelButton variant="secondary" :aria-label="t('quests.editQuest', { title: row.quest.title })" data-testid="quest-edit" @click="openEdit(row.quest.id)">{{ t('common.edit') }}</PixelButton>
      </div>
    </PixelCard>

    <QuestSheet v-model:open="sheetOpen" :quest-id="editingId" :default-period="period" />
  </div>
</template>
