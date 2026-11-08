<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import type { AccountProviderId } from '../services/account'

// Layout "blank": la pagina e' raggiungibile anche senza profilo (ritrovare i dati su un dispositivo nuovo).
definePageMeta({ layout: 'blank' })

const account = useAccountStore()
const game = useGameStore()
const { t } = useI18n()
const localeTag = useLocaleTag()
const toast = useUiToast()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const resetMessage = ref<string | null>(null)
const deleteOpen = ref(false)
const deletePassword = ref('')

// Accesso con Apple: SPENTO finche' non e' configurato (Apple Developer + provider in Firebase, vedi docs/firebase-setup.md §5).
// Si accende con NUXT_PUBLIC_APPLE_SIGN_IN=true. Obbligatorio su iOS se si offre Google (linea guida 4.8); su Android non serve.
const showApple = String(useRuntimeConfig().public.appleSignIn) === 'true' && Capacitor.getPlatform() !== 'android'

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
    ? t('sync.last', { time: new Date(account.lastSyncAt).toLocaleString(localeTag.value, { dateStyle: 'short', timeStyle: 'short' }) })
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
    <UiCard v-if="!account.available" data-testid="account-unavailable">
      <p>{{ t('account.unavailable') }}</p>
    </UiCard>

    <p v-else-if="!account.ready" class="text-[var(--text-soft)]">{{ t('account.loading') }}</p>

    <!-- Collegato -->
    <template v-else-if="account.user">
      <UiCard tone="accent" data-testid="account-signed-in">
        <h2 class="font-display mb-2 text-xs">{{ t('account.signedInTitle') }}</h2>
        <p data-testid="account-email">{{ account.user.email }}</p>
        <p class="text-[var(--text-soft)]">{{ t('account.provider', { provider: providers }) }}</p>
      </UiCard>

      <UiCard>
        <h2 class="font-display mb-2 text-xs">{{ t('sync.title') }}</h2>
        <p data-testid="sync-status" :data-status="account.syncStatus" :data-count="account.syncCount">{{ statusText }}</p>
        <p v-if="syncErrorText" class="text-[var(--warn)]" role="alert">{{ syncErrorText }}</p>
        <p class="mb-3 text-[var(--text-soft)]" data-testid="sync-last">{{ lastSync }}</p>
        <UiButton :disabled="account.syncStatus === 'syncing'" data-testid="sync-now" @click="account.syncNow()">{{ t('sync.now') }}</UiButton>
      </UiCard>

      <UiCard>
        <UiButton variant="secondary" data-testid="account-signout" @click="account.signOut()">{{ t('account.signOut') }}</UiButton>
        <p class="mt-2 text-[var(--text-soft)]">{{ t('account.signOutNote') }}</p>
      </UiCard>

      <UiCard>
        <h2 class="font-display mb-2 text-xs">{{ t('account.dangerTitle') }}</h2>
        <UiButton variant="secondary" data-testid="account-delete" @click="deleteOpen = true">{{ t('account.delete.button') }}</UiButton>
      </UiCard>
    </template>

    <!-- Scollegato -->
    <template v-else>
      <p class="text-[var(--text-soft)]">{{ t('account.intro') }}</p>
      <UiCard data-testid="account-form">
        <UiSegmented v-model="modeModel" :label="t('account.mode')" :options="modeOptions" />
        <form class="mt-3 flex flex-col gap-3" @submit.prevent="submit">
          <UiInput v-model="email" type="email" inputmode="email" autocapitalize="none" :label="t('account.email')" data-testid="account-email-input" />
          <UiInput
            v-model="password"
            type="password"
            :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
            :label="t('account.password')"
            data-testid="account-password-input"
          />
          <p v-if="mode === 'signup'" class="text-[var(--text-soft)]">{{ t('account.passwordHint') }}</p>
          <p v-if="errorText" class="text-[var(--warn)]" role="alert" data-testid="account-error">{{ errorText }}</p>
          <p v-if="resetMessage" class="text-[var(--text-soft)]" data-testid="account-reset">{{ resetMessage }}</p>
          <UiButton type="submit" :disabled="account.busy || !email || !password" data-testid="account-submit">
            {{ mode === 'signin' ? t('account.submitSignIn') : t('account.submitSignUp') }}
          </UiButton>
          <div v-if="mode === 'signin'">
            <UiButton variant="secondary" :disabled="account.busy" data-testid="account-forgot" @click="forgot">{{ t('account.forgot') }}</UiButton>
          </div>
        </form>
      </UiCard>

      <p class="text-center text-[var(--text-soft)]">{{ t('account.orWith') }}</p>
      <div class="flex flex-col gap-2">
        <UiButton variant="secondary" :disabled="account.busy" data-testid="account-google" @click="account.signInWith('google')">{{ t('account.google') }}</UiButton>
        <UiButton v-if="showApple" variant="secondary" :disabled="account.busy" data-testid="account-apple" @click="account.signInWith('apple')">{{ t('account.apple') }}</UiButton>
      </div>
    </template>

    <div class="mt-2 flex flex-wrap items-center gap-2">
      <UiButton variant="secondary" data-testid="account-back" @click="back">{{ t('common.back') }}</UiButton>
      <NuxtLink to="/privacy" class="underline" data-testid="privacy-link">{{ t('account.privacyLink') }}</NuxtLink>
    </div>

    <UiDialog v-model:open="deleteOpen" :title="t('account.delete.title')" :description="t('account.delete.body')">
      <div class="flex flex-col gap-3">
        <UiInput
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
          <UiButton variant="secondary" @click="deleteOpen = false">{{ t('common.cancel') }}</UiButton>
          <UiButton :disabled="account.busy || (usesPassword && !deletePassword)" data-testid="delete-confirm" @click="confirmDelete">
            {{ t('account.delete.confirm') }}
          </UiButton>
        </div>
      </template>
    </UiDialog>
  </div>
</template>
