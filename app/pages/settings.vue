<script setup lang="ts">
import { PALETTE } from '../../data/icons'
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
  <div class="flex flex-col gap-5" data-testid="page-settings">
    <PageHeader :title="t('settings.title')" />

    <UiCard v-if="game.loadStatus === 'recovered'" tone="accent" data-testid="recovered-notice">
      <h2 class="font-display mb-2 text-xs">{{ t('settings.recoveredTitle') }}</h2>
      <p>{{ t('settings.recoveredBody') }}</p>
    </UiCard>

    <SettingsGroup :title="t('settings.profile')">
      <form class="prof" @submit.prevent="saveName">
        <HeroAvatar v-if="game.character" :character="game.character.id" :size="68" :alt="hero.name(game.character.id)" />
        <div class="prof__form">
          <UiInput v-model="name" :label="t('settings.name')" maxlength="24" data-testid="settings-name" />
          <UiButton type="submit" variant="secondary" compact>{{ t('settings.nameSave') }}</UiButton>
        </div>
      </form>
    </SettingsGroup>

    <SettingsGroup :title="t('account.card.title')" data-testid="settings-account">
      <SettingsRow
        icon="globe"
        :color="PALETTE.cyan"
        :label="t('account.card.manage')"
        :value="account.user ? t('settings.accountOn') : ''"
        to="/account"
        testid="settings-account-link"
      >
        <p v-if="account.user" class="sr-note" data-testid="settings-account-email">{{ t('account.card.signedInAs', { email: account.user.email ?? '' }) }}</p>
        <p v-else class="sr-note">{{ account.available ? t('account.card.body') : t('account.unavailable') }}</p>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup :title="t('settings.preferences')">
      <SettingsRow icon="languages" :color="PALETTE.green" :label="t('settings.language')" data-testid="settings-language">
        <LanguageSwitch />
        <p class="sr-note">{{ t('settings.languageHint') }}</p>
      </SettingsRow>
      <SettingsRow icon="sun-moon" :color="PALETTE.gold" :label="t('settings.dayStart')">
        <UiSegmented v-model="dayStart" :label="t('settings.dayStart')" :options="dayStartOptions" />
        <p class="sr-note">{{ t('settings.dayStartHint') }}</p>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup :title="t('settings.notifications')" data-testid="settings-notifications">
      <UiSwitch v-model="enabled" icon="bell" :color="PALETTE.orange" :label="t('settings.notificationsEnable')" :hint="t('settings.notificationsEnableHint')" data-testid="notif-enable" />
      <template v-if="cfg.enabled">
        <SettingsRow icon="sun" :color="PALETTE.gold" :label="t('settings.morningTime')">
          <template #end><input v-model="morningTime" type="time" class="sr-time num" :aria-label="t('settings.morningTime')" data-testid="notif-morning" /></template>
        </SettingsRow>
        <SettingsRow icon="moon" :color="PALETTE.violet" :label="t('settings.eveningTime')">
          <template #end><input v-model="eveningTime" type="time" class="sr-time num" :aria-label="t('settings.eveningTime')" data-testid="notif-evening" /></template>
        </SettingsRow>
        <UiSwitch v-model="streakRisk" icon="flame" :color="PALETTE.orange" :label="t('settings.streakRisk')" />
        <UiSwitch v-model="weeklyMonthly" icon="calendar-check" :color="PALETTE.sky" :label="t('settings.weeklyMonthly')" />
        <UiSwitch v-model="comeback" icon="heart" :color="PALETTE.rose" :label="t('settings.comeback')" />
        <p class="sr-note sr-note--pad">{{ t('settings.quietHours') }}</p>
      </template>
      <p v-if="permission === 'unsupported'" class="sr-note sr-note--pad" data-testid="notif-web">{{ t('settings.permissionWeb') }}</p>
      <div v-else-if="permission === 'denied'" class="sr-note sr-note--pad" data-testid="notif-denied">
        <p>{{ t('settings.permissionDenied') }}</p>
      </div>
      <div v-else-if="permission === 'prompt'" class="sr-note sr-note--pad flex flex-col gap-2">
        <p>{{ t('settings.permissionPrompt') }}</p>
        <div><UiButton variant="secondary" compact data-testid="notif-ask" @click="askPermission">{{ t('settings.permissionAsk') }}</UiButton></div>
      </div>
    </SettingsGroup>

    <SettingsGroup :title="t('settings.feedback')" data-testid="settings-feedback">
      <UiSwitch v-model="sound" icon="volume-2" :color="PALETTE.violet" :label="t('settings.sound')" :hint="t('settings.soundHint')" data-testid="sound-switch" />
      <UiSwitch v-model="haptics" icon="vibrate" :color="PALETTE.teal" :label="t('settings.haptics')" :hint="t('settings.hapticsHint')" />
    </SettingsGroup>

    <SettingsGroup :title="t('settings.data')">
      <SettingsRow icon="database" :color="PALETTE.teal" :label="t('settings.export')" :hint="t('settings.dataHint')" button testid="export" @click="doExport" />
      <SettingsRow icon="database" :color="PALETTE.sky" :label="t('settings.import')" button testid="import" @click="fileInput?.click()" />
      <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" data-testid="import-file" @change="onFile" />
      <p v-if="importError" class="sr-note sr-note--pad text-[var(--warn)]" role="alert" data-testid="import-error">{{ importError }}</p>
    </SettingsGroup>

    <SettingsGroup :title="t('settings.privacy')">
      <SettingsRow icon="shield" :color="PALETTE.sky" :label="t('account.privacyLink')" :hint="t('settings.privacyBody')" to="/privacy" testid="settings-privacy-link" />
    </SettingsGroup>

    <SettingsGroup :title="t('settings.danger')">
      <SettingsRow icon="skull" :label="t('settings.wipe')" button danger testid="wipe" @click="wipeOpen = true" />
    </SettingsGroup>

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

<style scoped>
.prof {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;
}
.prof__form {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}
.prof__form > :first-child {
  width: 100%;
}
.sr-note {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-soft);
}
.sr-note--pad {
  margin: 0;
  padding: 10px 14px 14px;
}
.sr-time {
  flex: none;
  min-width: 112px;
  padding: 8px 10px;
  font-size: 20px;
  color: var(--text);
  text-align: center;
  color-scheme: dark;
  background: rgb(11 16 32 / 0.6);
  border: 1px solid var(--edge-control);
  border-radius: var(--radius-s);
  user-select: text;
  -webkit-user-select: text;
}
</style>
