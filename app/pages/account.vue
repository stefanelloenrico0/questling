<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import type { AccountProviderId } from '../services/account'

// Layout "blank": la pagina e' raggiungibile anche senza profilo (ritrovare i dati su un dispositivo nuovo).
definePageMeta({ layout: 'blank' })

const account = useAccountStore()
const game = useGameStore()
const { t } = useI18n()
const toast = usePixelToast()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const resetMessage = ref<string | null>(null)
const deleteOpen = ref(false)
const deletePassword = ref('')

// Apple e' obbligatorio su iOS se si offre Google (linea guida 4.8); su Android non serve e richiederebbe il flusso web.
const showApple = Capacitor.getPlatform() !== 'android'

const modeOptions = computed(() => [
  { value: 'signin', label: t('account.modeSignIn') },
  { value: 'signup', label: t('account.modeSignUp') },
])
const modeModel = computed({
  get: () => mode.value as string,
  set: (v: string) => (mode.value = v as 'signin' | 'signup'),
})

const providers = computed(() => (account.user?.providers ?? []).map((p: AccountProviderId) => t(`account.providers.${p.replace('.com', '')}`)).join(', '))
const usesPassword = computed(() => account.user?.providers[0] === 'password')

const statusText = computed(() => t(`sync.status.${account.syncStatus}`))
const lastSync = computed(() =>
  account.lastSyncAt
    ? t('sync.last', { time: new Date(account.lastSyncAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) })
    : t('sync.never'),
)
const errorText = computed(() => (account.authError ? t(`account.errors.${account.authError}`) : null))
const syncErrorText = computed(() => (account.syncError ? t(`account.errors.${account.syncError}`) : null))

async function submit(): Promise<void> {
  resetMessage.value = null
  const ok = mode.value === 'signin' ? await account.signIn(email.value, password.value) : await account.signUp(email.value, password.value)
  if (ok) password.value = ''
}

async function forgot(): Promise<void> {
  resetMessage.value = null
  if (!email.value.trim()) {
    resetMessage.value = t('account.resetNeedsEmail')
    return
  }
  if (await account.sendPasswordReset(email.value)) resetMessage.value = t('account.resetSent')
}

async function confirmDelete(): Promise<void> {
  if (await account.deleteAccount(deletePassword.value)) {
    deleteOpen.value = false
    deletePassword.value = ''
    toast.show(t('account.delete.done'))
  }
}

// Dispositivo nuovo: dopo il login i dati arrivano dal cloud e compare il profilo -> si entra direttamente.
watch(
  () => game.profile,
  (profile, previous) => {
    if (profile && !previous) void navigateTo('/')
  },
)

const back = (): void => void navigateTo(game.profile ? '/settings' : '/onboarding')
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="page-account">
    <h1 class="font-display text-sm">{{ t('account.title') }}</h1>

    <!-- Non configurato -->
    <PixelCard v-if="!account.available" data-testid="account-unavailable">
      <p>{{ t('account.unavailable') }}</p>
    </PixelCard>

    <p v-else-if="!account.ready" class="text-[var(--text-soft)]">{{ t('account.loading') }}</p>

    <!-- Collegato -->
    <template v-else-if="account.user">
      <PixelCard tone="accent" data-testid="account-signed-in">
        <h2 class="font-display mb-2 text-xs">{{ t('account.signedInTitle') }}</h2>
        <p data-testid="account-email">{{ account.user.email }}</p>
        <p class="text-[var(--text-soft)]">{{ t('account.provider', { provider: providers }) }}</p>
      </PixelCard>

      <PixelCard>
        <h2 class="font-display mb-2 text-xs">{{ t('sync.title') }}</h2>
        <p data-testid="sync-status" :data-status="account.syncStatus" :data-count="account.syncCount">{{ statusText }}</p>
        <p v-if="syncErrorText" class="text-[var(--warn)]" role="alert">{{ syncErrorText }}</p>
        <p class="mb-3 text-[var(--text-soft)]" data-testid="sync-last">{{ lastSync }}</p>
        <PixelButton :disabled="account.syncStatus === 'syncing'" data-testid="sync-now" @click="account.syncNow()">{{ t('sync.now') }}</PixelButton>
      </PixelCard>

      <PixelCard>
        <PixelButton variant="secondary" data-testid="account-signout" @click="account.signOut()">{{ t('account.signOut') }}</PixelButton>
        <p class="mt-2 text-[var(--text-soft)]">{{ t('account.signOutNote') }}</p>
      </PixelCard>

      <PixelCard>
        <h2 class="font-display mb-2 text-xs">{{ t('account.dangerTitle') }}</h2>
        <PixelButton variant="secondary" data-testid="account-delete" @click="deleteOpen = true">{{ t('account.delete.button') }}</PixelButton>
      </PixelCard>
    </template>

    <!-- Scollegato -->
    <template v-else>
      <p class="text-[var(--text-soft)]">{{ t('account.intro') }}</p>
      <PixelCard data-testid="account-form">
        <PixelSegmented v-model="modeModel" :label="t('account.mode')" :options="modeOptions" />
        <form class="mt-3 flex flex-col gap-3" @submit.prevent="submit">
          <PixelInput v-model="email" type="email" inputmode="email" autocapitalize="none" :label="t('account.email')" data-testid="account-email-input" />
          <PixelInput
            v-model="password"
            type="password"
            :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
            :label="t('account.password')"
            data-testid="account-password-input"
          />
          <p v-if="mode === 'signup'" class="text-[var(--text-soft)]">{{ t('account.passwordHint') }}</p>
          <p v-if="errorText" class="text-[var(--warn)]" role="alert" data-testid="account-error">{{ errorText }}</p>
          <p v-if="resetMessage" class="text-[var(--text-soft)]" data-testid="account-reset">{{ resetMessage }}</p>
          <PixelButton type="submit" :disabled="account.busy || !email || !password" data-testid="account-submit">
            {{ mode === 'signin' ? t('account.submitSignIn') : t('account.submitSignUp') }}
          </PixelButton>
          <div v-if="mode === 'signin'">
            <PixelButton variant="secondary" :disabled="account.busy" data-testid="account-forgot" @click="forgot">{{ t('account.forgot') }}</PixelButton>
          </div>
        </form>
      </PixelCard>

      <p class="text-center text-[var(--text-soft)]">{{ t('account.orWith') }}</p>
      <div class="flex flex-col gap-2">
        <PixelButton variant="secondary" :disabled="account.busy" data-testid="account-google" @click="account.signInWith('google')">{{ t('account.google') }}</PixelButton>
        <PixelButton v-if="showApple" variant="secondary" :disabled="account.busy" data-testid="account-apple" @click="account.signInWith('apple')">{{ t('account.apple') }}</PixelButton>
      </div>
    </template>

    <div class="mt-2 flex flex-wrap items-center gap-2">
      <PixelButton variant="secondary" data-testid="account-back" @click="back">{{ t('common.back') }}</PixelButton>
      <NuxtLink to="/privacy" class="underline" data-testid="privacy-link">{{ t('account.privacyLink') }}</NuxtLink>
    </div>

    <PixelDialog v-model:open="deleteOpen" :title="t('account.delete.title')" :description="t('account.delete.body')">
      <div class="flex flex-col gap-3">
        <PixelInput
          v-if="usesPassword"
          v-model="deletePassword"
          type="password"
          autocomplete="current-password"
          :label="t('account.delete.passwordLabel')"
          data-testid="delete-password"
        />
        <p v-else class="text-[var(--text-soft)]">{{ t('account.delete.socialNote') }}</p>
        <p v-if="errorText" class="text-[var(--warn)]" role="alert" data-testid="delete-error">{{ errorText }}</p>
      </div>
      <template #actions>
        <div class="flex gap-2">
          <PixelButton variant="secondary" @click="deleteOpen = false">{{ t('common.cancel') }}</PixelButton>
          <PixelButton :disabled="account.busy || (usesPassword && !deletePassword)" data-testid="delete-confirm" @click="confirmDelete">
            {{ t('account.delete.confirm') }}
          </PixelButton>
        </div>
      </template>
    </PixelDialog>
  </div>
</template>
