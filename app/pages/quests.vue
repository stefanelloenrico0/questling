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
    <PageHeader :title="t('quests.title')" :sub="t('quests.slotsLine', { used: rows.length, max })" />

    <UiSegmented v-model="periodModel" :label="t('quests.title')" :options="periodOptions" />

    <p class="sr-only" data-testid="quest-slots">{{ t('quests.slots', { used: rows.length, max }) }}</p>

    <p v-if="capReached" class="text-[var(--warn)]" data-testid="cap-message">
      {{ t('quests.capReached', { max, period: t(`period.${period}Plural`) }) }}
    </p>

    <p v-if="rows.length === 0" class="text-[var(--text-soft)]">
      {{ t('quests.empty', { period: t(`period.${period}Plural`) }) }}
    </p>

    <UiCard v-for="(row, i) in rows" :key="row.quest.id" tone="row" data-testid="quest-item">
      <div class="flex items-center gap-3">
        <UiIconTile :name="row.quest.icon" :size="48" />
        <div class="min-w-0 flex-1">
          <div class="break-words" style="font-weight: 700">{{ row.quest.title }}</div>
          <div class="text-[var(--text-soft)]" style="font-size: 15px; line-height: 20px">
            {{ row.quest.target > 1 ? t('quests.perPeriod', { target: row.quest.target }) : t('quests.oncePerPeriod') }}
            · <span class="text-[var(--gold)]">{{ t('quests.xpEach', { xp: row.xp }) }}</span>
          </div>
        </div>
        <div class="qctl">
          <button type="button" class="qctl__btn" :disabled="i === 0" :aria-label="t('quests.moveUp', { title: row.quest.title })" @click="game.moveQuest(period, row.quest.id, -1)">
            <UiIcon name="chevron-up" :size="20" />
          </button>
          <button type="button" class="qctl__btn" :disabled="i === rows.length - 1" :aria-label="t('quests.moveDown', { title: row.quest.title })" @click="game.moveQuest(period, row.quest.id, 1)">
            <UiIcon name="chevron-down" :size="20" />
          </button>
        </div>
        <button type="button" class="qedit" :aria-label="t('quests.editQuest', { title: row.quest.title })" data-testid="quest-edit" @click="openEdit(row.quest.id)">
          <UiIcon name="chevron-right" :size="26" />
        </button>
      </div>
    </UiCard>

    <div class="quests-fab">
      <UiButton :disabled="capReached" data-testid="quest-add" @click="openNew">
        <span class="flex items-center justify-center gap-2"><UiIcon name="plus" :size="22" />{{ t('quests.add') }}</span>
      </UiButton>
    </div>

    <QuestSheet v-model:open="sheetOpen" :quest-id="editingId" :default-period="period" />
  </div>
</template>

<style scoped>
.qctl {
  display: flex;
  flex-direction: column;
  flex: none;
}
.qctl__btn,
.qedit {
  display: grid;
  place-items: center;
  color: var(--text-soft);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.qctl__btn {
  width: 40px;
  height: 34px;
}
.qedit {
  flex: none;
  width: 44px;
  height: 48px;
  color: var(--text);
}
.qctl__btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.quests-fab {
  position: fixed;
  inset: auto 0 calc(84px + var(--safe-bottom)) 0;
  z-index: 15;
  display: flex;
  justify-content: center;
  padding: 0 20px;
  pointer-events: none;
}
.quests-fab > * {
  width: 100%;
  max-width: 24rem;
  pointer-events: auto;
  box-shadow: 0 10px 28px -8px rgb(0 0 0 / 0.7);
}
</style>
