<script setup lang="ts">
import { exportBackup, parseBackup, type BackupSummary } from '../../core/backup'
import type { AppState } from '../../core/types'
import type { ReminderPermission } from '../composables/useNotifications'

const game = useGameStore()
const { t } = useI18n()
const hero = useHero()
const toast = useUiToast()
const config = useRuntimeConfig()
const localeTag = useLocaleTag()

const name = ref(game.profile?.displayName ?? '')
const fileInput = ref<HTMLInputElement | null>(null)
const importError = ref<string | null>(null)
const preview = ref<{ state: AppState; summary: BackupSummary } | null>(null)
const previewOpen = ref(false)
const wipeOpen = ref(false)

const account = useAccountStore()
const notifications = useNotifications()
const fx = useFeedback()
const permission = ref<ReminderPermission>('unsupported')
onMounted(async () => {
  permission.value = await notifications.permission()
})

const cfg = computed(() => game.settings.notifications)

// Accendere i promemoria chiede il permesso (se manca). Se negato resta spento e l'app funziona uguale.
const enabled = computed({
  get: () => cfg.value.enabled,
  set: (v: boolean) => void setEnabled(v),
})
async function setEnabled(v: boolean): Promise<void> {
  if (v && permission.value !== 'granted' && permission.value !== 'unsupported') {
    permission.value = await notifications.requestPermission()
    if (permission.value !== 'granted') return
  }
  game.patchSettings({ notifications: { enabled: v } })
}
async function askPermission(): Promise<void> {
  permission.value = await notifications.requestPermission()
  if (permission.value === 'granted') {
    game.patchSettings({ notifications: { enabled: true } })
    await notifications.reschedule(true)
  }
}
const flag = (key: 'streakRisk' | 'weeklyMonthly' | 'comeback') =>
  computed({
    get: () => cfg.value[key],
    set: (v: boolean) => game.patchSettings({ notifications: { [key]: v } }),
  })
const streakRisk = flag('streakRisk')
const weeklyMonthly = flag('weeklyMonthly')
const comeback = flag('comeback')
const timeField = (key: 'morningTime' | 'eveningTime') =>
  computed({
    get: () => cfg.value[key],
    set: (v: string) => game.patchSettings({ notifications: { [key]: v } }),
  })
const morningTime = timeField('morningTime')
const eveningTime = timeField('eveningTime')

const sound = computed({
  get: () => game.settings.sound,
  set: (v: boolean) => {
    game.patchSettings({ sound: v })
    if (v) fx.tap()
  },
})
const haptics = computed({
  get: () => game.settings.haptics,
  set: (v: boolean) => game.patchSettings({ haptics: v }),
})

const dayStartOptions = [0, 1, 2, 3, 4, 5, 6].map((h) => ({ value: String(h), label: t('settings.dayStartOption', { h }) }))
const dayStart = computed({
  get: () => String(game.settings.dayStartHour),
  set: (v: string) => game.setDayStartHour(Number(v)),
})

function saveName(): void {
  game.rename(name.value)
  name.value = game.profile?.displayName ?? name.value
  toast.show(t('settings.nameSaved'))
}

async function doExport(): Promise<void> {
  try {
    const day = game.today
    await shareBackup(exportBackup(game.state, new Date()), `questling-backup-${day}.json`, t('settings.export'))
    toast.show(t('settings.exportDone'))
  } catch {
    toast.show(t('settings.exportError'))
  }
}

async function onFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // permette di riselezionare lo stesso file
  if (!file) return
  importError.value = null
  const result = parseBackup(await readFileText(file))
  if (!result.ok) {
    importError.value = t(`settings.importErrors.${result.reason}`)
    return
  }
  preview.value = { state: result.state, summary: result.summary }
  previewOpen.value = true
}

async function confirmImport(): Promise<void> {
  if (!preview.value) return
  await game.importState(preview.value.state)
  previewOpen.value = false
  preview.value = null
  toast.show(t('settings.importDone'))
  name.value = game.profile?.displayName ?? ''
}

async function confirmWipe(): Promise<void> {
  wipeOpen.value = false
  await game.wipe()
  await navigateTo('/onboarding')
}

const summaryRows = computed(() => {
  const s = preview.value?.summary
  if (!s) return []
  const rows: [string, string | number][] = [
    [t('settings.importSummary.name'), s.displayName ?? '—'],
    [t('settings.importSummary.hero'), s.characterId ? hero.name(s.characterId) : '—'],
    [t('settings.importSummary.level'), s.level],
    [t('settings.importSummary.xp'), s.totalXp],
    [t('settings.importSummary.quests'), s.activeQuests],
    [t('settings.importSummary.completions'), s.completions],
  ]
  if (s.exportedAt) rows.push([t('settings.importSummary.exportedAt'), new Date(s.exportedAt).toLocaleString(localeTag.value)])
  return rows
})
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="page-settings">
    <h1 class="font-display text-sm">{{ t('settings.title') }}</h1>

    <UiCard v-if="game.loadStatus === 'recovered'" tone="accent" data-testid="recovered-notice">
      <h2 class="font-display mb-2 text-xs">{{ t('settings.recoveredTitle') }}</h2>
      <p>{{ t('settings.recoveredBody') }}</p>
    </UiCard>

    <UiCard>
      <h2 class="font-display mb-3 text-xs">{{ t('settings.profile') }}</h2>
      <form class="flex flex-col gap-3" @submit.prevent="saveName">
        <UiInput v-model="name" :label="t('settings.name')" maxlength="24" data-testid="settings-name" />
        <div><UiButton type="submit" variant="secondary">{{ t('settings.nameSave') }}</UiButton></div>
      </form>
    </UiCard>

    <UiCard data-testid="settings-account">
      <h2 class="font-display mb-3 text-xs">{{ t('account.card.title') }}</h2>
      <p v-if="account.user" class="mb-2" data-testid="settings-account-email">{{ t('account.card.signedInAs', { email: account.user.email ?? '' }) }}</p>
      <p v-else class="mb-3 text-[var(--text-soft)]">{{ account.available ? t('account.card.body') : t('account.unavailable') }}</p>
      <UiButton variant="secondary" data-testid="settings-account-link" @click="navigateTo('/account')">{{ t('account.card.manage') }}</UiButton>
    </UiCard>

    <UiCard data-testid="settings-language">
      <h2 class="font-display mb-3 text-xs">{{ t('settings.language') }}</h2>
      <LanguageSwitch />
      <p class="mt-3 text-[var(--text-soft)]">{{ t('settings.languageHint') }}</p>
    </UiCard>

    <UiCard>
      <h2 class="font-display mb-3 text-xs">{{ t('settings.dayStart') }}</h2>
      <UiSegmented v-model="dayStart" :label="t('settings.dayStart')" :options="dayStartOptions" />
      <p class="mt-3 text-[var(--text-soft)]">{{ t('settings.dayStartHint') }}</p>
    </UiCard>

    <UiCard data-testid="settings-notifications">
      <h2 class="font-display mb-3 text-xs">{{ t('settings.notifications') }}</h2>
      <UiSwitch v-model="enabled" :label="t('settings.notificationsEnable')" :hint="t('settings.notificationsEnableHint')" data-testid="notif-enable" />
      <div v-if="cfg.enabled" class="mt-3 flex flex-col gap-3">
        <UiInput v-model="morningTime" type="time" :label="t('settings.morningTime')" data-testid="notif-morning" />
        <UiInput v-model="eveningTime" type="time" :label="t('settings.eveningTime')" data-testid="notif-evening" />
        <UiSwitch v-model="streakRisk" :label="t('settings.streakRisk')" />
        <UiSwitch v-model="weeklyMonthly" :label="t('settings.weeklyMonthly')" />
        <UiSwitch v-model="comeback" :label="t('settings.comeback')" />
        <p class="text-[var(--text-soft)]">{{ t('settings.quietHours') }}</p>
      </div>
      <p v-if="permission === 'unsupported'" class="mt-3 text-[var(--text-soft)]" data-testid="notif-web">{{ t('settings.permissionWeb') }}</p>
      <div v-else-if="permission === 'denied'" class="mt-3" data-testid="notif-denied">
        <p class="text-[var(--text-soft)]">{{ t('settings.permissionDenied') }}</p>
      </div>
      <div v-else-if="permission === 'prompt'" class="mt-3 flex flex-col gap-2">
        <p class="text-[var(--text-soft)]">{{ t('settings.permissionPrompt') }}</p>
        <div><UiButton variant="secondary" data-testid="notif-ask" @click="askPermission">{{ t('settings.permissionAsk') }}</UiButton></div>
      </div>
    </UiCard>

    <UiCard data-testid="settings-feedback">
      <h2 class="font-display mb-3 text-xs">{{ t('settings.feedback') }}</h2>
      <UiSwitch v-model="sound" :label="t('settings.sound')" :hint="t('settings.soundHint')" data-testid="sound-switch" />
      <UiSwitch v-model="haptics" :label="t('settings.haptics')" :hint="t('settings.hapticsHint')" />
    </UiCard>

    <UiCard>
      <h2 class="font-display mb-3 text-xs">{{ t('settings.data') }}</h2>
      <p class="mb-3 text-[var(--text-soft)]">{{ t('settings.dataHint') }}</p>
      <div class="flex flex-wrap">
        <UiButton data-testid="export" @click="doExport">{{ t('settings.export') }}</UiButton>
        <UiButton variant="secondary" data-testid="import" @click="fileInput?.click()">{{ t('settings.import') }}</UiButton>
      </div>
      <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" data-testid="import-file" @change="onFile" />
      <p v-if="importError" class="mt-3 text-[var(--warn)]" role="alert" data-testid="import-error">{{ importError }}</p>
    </UiCard>

    <UiCard>
      <h2 class="font-display mb-3 text-xs">{{ t('settings.privacy') }}</h2>
      <p class="mb-2 text-[var(--text-soft)]">{{ t('settings.privacyBody') }}</p>
      <NuxtLink to="/privacy" class="underline" data-testid="settings-privacy-link">{{ t('account.privacyLink') }}</NuxtLink>
    </UiCard>

    <UiCard>
      <h2 class="font-display mb-3 text-xs">{{ t('settings.danger') }}</h2>
      <UiButton variant="secondary" data-testid="wipe" @click="wipeOpen = true">{{ t('settings.wipe') }}</UiButton>
    </UiCard>

    <p class="text-center text-[var(--text-soft)]">{{ t('settings.version', { v: config.public.appVersion }) }}</p>

    <UiDialog v-model:open="previewOpen" :title="t('settings.importPreviewTitle')" :description="t('settings.importPreviewBody')">
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1" data-testid="import-summary">
        <template v-for="[k, v] in summaryRows" :key="k">
          <dt class="text-[var(--text-soft)]">{{ k }}</dt>
          <dd>{{ v }}</dd>
        </template>
      </dl>
      <template #actions>
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="previewOpen = false">{{ t('common.cancel') }}</UiButton>
          <UiButton data-testid="import-confirm" @click="confirmImport">{{ t('settings.importConfirm') }}</UiButton>
        </div>
      </template>
    </UiDialog>

    <UiDialog v-model:open="wipeOpen" :title="t('settings.wipeTitle')" :description="t('settings.wipeBody')">
      <template #actions>
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="wipeOpen = false">{{ t('common.cancel') }}</UiButton>
          <UiButton data-testid="wipe-confirm" @click="confirmWipe">{{ t('settings.wipeConfirm') }}</UiButton>
        </div>
      </template>
    </UiDialog>
  </div>
</template>
