<script setup lang="ts">
import { ICON_IDS, DEFAULT_ICON } from '../../data/icons'
import { DIFFICULTIES, PERIODS, type Difficulty, type Period } from '../../core/types'
import { MAX_TITLE_LENGTH } from '../../core/game'
import { TARGET_LIMITS, questXp } from '../../core/xp'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ questId: string | null; defaultPeriod: Period }>()
const emit = defineEmits<{ saved: [] }>()

const game = useGameStore()
const { t } = useI18n()
const fx = useFeedback()

const title = ref('')
const icon = ref<string>(DEFAULT_ICON)
const difficulty = ref<Difficulty>('medium')
const period = ref<Period>('daily')
const target = ref(1)
const error = ref<string | null>(null)
const confirmArchive = ref(false)

const editing = computed(() => props.questId !== null)
const limits = computed(() => TARGET_LIMITS[period.value])
const xp = computed(() => questXp(difficulty.value, period.value))

watch(open, (isOpen) => {
  if (!isOpen) return
  error.value = null
  confirmArchive.value = false
  const quest = props.questId ? game.state.quests.find((q) => q.id === props.questId) : null
  if (quest) {
    title.value = quest.title
    icon.value = quest.icon
    difficulty.value = quest.difficulty
    period.value = quest.period
    target.value = quest.target
  } else {
    title.value = ''
    icon.value = DEFAULT_ICON
    difficulty.value = 'medium'
    period.value = props.defaultPeriod
    target.value = 1
  }
})

watch(period, () => {
  target.value = Math.min(limits.value.max, Math.max(limits.value.min, target.value))
})

function save(): void {
  const res = props.questId
    ? game.editQuest(props.questId, { title: title.value, icon: icon.value, difficulty: difficulty.value, target: target.value })
    : game.addQuest({ title: title.value, icon: icon.value, difficulty: difficulty.value, period: period.value, target: target.value })
  if (!res.ok) {
    error.value = t(`quests.errors.${res.error}`)
    fx.error()
    return
  }
  fx.tap()
  open.value = false
  emit('saved')
}

function archive(): void {
  if (props.questId) game.removeQuest(props.questId)
  confirmArchive.value = false
  open.value = false
  emit('saved')
}

const periodOptions = computed(() =>
  PERIODS.map((p) => ({ value: p, label: t(`period.${p}Short`), disabled: editing.value && p !== period.value })),
)
const difficultyOptions = computed(() =>
  DIFFICULTIES.map((d) => ({ value: d, label: t(`difficulty.${d}`) })),
)
</script>

<template>
  <USlideover
    v-model:open="open"
    side="bottom"
    :title="editing ? t('quests.sheet.titleEdit') : t('quests.sheet.titleNew')"
    :description="t('quests.sheet.description')"
    :ui="{
      overlay: 'bg-black/70',
      content: 'bg-transparent ring-0 shadow-none rounded-none divide-none overflow-visible max-w-md mx-auto',
    }"
  >
    <template #content>
      <UiCard tone="accent" class="sheet" data-testid="quest-sheet">
        <h2 class="font-display mb-4 text-sm">
          {{ editing ? t('quests.sheet.titleEdit') : t('quests.sheet.titleNew') }}
        </h2>

        <form class="flex flex-col gap-4" @submit.prevent="save">
          <UiInput
            v-model="title"
            :label="t('quests.sheet.name')"
            :placeholder="t('quests.sheet.namePlaceholder')"
            :maxlength="MAX_TITLE_LENGTH"
            data-testid="quest-title"
          />

          <div class="flex flex-col gap-2">
            <span class="text-[var(--text-soft)]">{{ t('quests.sheet.icon') }}</span>
            <div class="icon-grid" role="radiogroup" :aria-label="t('quests.sheet.icon')">
              <button
                v-for="id in ICON_IDS"
                :key="id"
                type="button"
                role="radio"
                class="icon-btn"
                :class="{ 'icon-btn--on': icon === id }"
                :aria-checked="icon === id"
                :aria-label="t('quests.sheet.iconPick', { name: id })"
                @click="icon = id"
              >
                <UiIcon :name="id" :size="28" />
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-[var(--text-soft)]">{{ t('difficulty.label') }}</span>
            <UiSegmented v-model="difficulty" :label="t('difficulty.label')" :options="difficultyOptions" />
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-[var(--text-soft)]">{{ t('quests.sheet.period') }}</span>
            <UiSegmented v-model="period" :label="t('quests.sheet.period')" :options="periodOptions" />
            <p v-if="editing" class="text-[var(--text-soft)]">{{ t('quests.sheet.periodLocked') }}</p>
          </div>

          <div v-if="limits.max > 1" class="flex flex-col gap-2">
            <span class="text-[var(--text-soft)]">{{ t('quests.sheet.target') }}</span>
            <UiStepper
              v-model="target"
              :min="limits.min"
              :max="limits.max"
              :label="t('quests.sheet.target')"
              :value-label="t('quests.sheet.targetValue', { n: target })"
              :decrease-label="t('quests.sheet.decrease')"
              :increase-label="t('quests.sheet.increase')"
            />
          </div>

          <p class="text-[var(--xp)]">{{ t('quests.sheet.xpPreview', { xp }) }}</p>
          <p v-if="error" class="text-[var(--warn)]" role="alert" data-testid="quest-error">{{ error }}</p>

          <div class="flex flex-wrap justify-end gap-2">
            <UiButton v-if="editing" variant="secondary" @click="confirmArchive = true">{{ t('common.archive') }}</UiButton>
            <UiButton variant="secondary" @click="open = false">{{ t('common.cancel') }}</UiButton>
            <UiButton type="submit" data-testid="quest-save">{{ t('common.save') }}</UiButton>
          </div>
        </form>
      </UiCard>
    </template>
  </USlideover>

  <UiDialog v-model:open="confirmArchive" :title="t('quests.archiveTitle')" :description="t('quests.archiveBody')">
    <template #actions>
      <div class="flex gap-2">
        <UiButton variant="secondary" @click="confirmArchive = false">{{ t('common.cancel') }}</UiButton>
        <UiButton data-testid="archive-confirm" @click="archive">{{ t('quests.archiveConfirm') }}</UiButton>
      </div>
    </template>
  </UiDialog>
</template>

<style scoped>
.sheet {
  max-height: 88dvh;
  overflow-y: auto;
  padding-bottom: calc(16px + var(--safe-bottom));
}
.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}
.icon-btn {
  display: grid;
  place-items: center;
  min-width: 48px;
  min-height: 48px;
  color: var(--text);
  background: var(--bg-2);
  border: 1.5px solid var(--edge);
  border-radius: 14px;
  cursor: pointer;
}
.icon-btn--on {
  color: #14162a;
  background: var(--accent);
  border-color: var(--accent);
}
</style>
