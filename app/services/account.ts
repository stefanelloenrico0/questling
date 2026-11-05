// Servizio account: Firebase Auth (email/password, Google, Apple) + accesso al RemoteStore dell'utente.
// Nessun import da Nuxt: usabile e testabile fuori dall'app.
import { Capacitor } from '@capacitor/core'
import type { Auth, AuthCredential, User } from 'firebase/auth'
import type { RemoteStore } from '../../core/sync'
import { loadFirebase, type FirebaseConfig } from './firebase'

export type SocialProvider = 'google' | 'apple'
export type AccountProviderId = 'password' | 'google.com' | 'apple.com'

export interface AccountUser {
  uid: string
  email: string | null
  providers: AccountProviderId[]
}

export type AuthErrorCode =
  | 'invalid-credentials'
  | 'email-in-use'
  | 'weak-password'
  | 'invalid-email'
  | 'user-disabled'
  | 'network'
  | 'too-many-requests'
  | 'cancelled'
  | 'requires-recent-login'
  | 'account-exists-with-other-provider'
  | 'unknown'

/** Mappa gli errori Firebase in codici stabili (la UI li traduce). */
export function mapAuthError(e: unknown): AuthErrorCode {
  const code = String((e as { code?: unknown })?.code ?? '')
  if (/(wrong-password|invalid-credential|user-not-found|invalid-login-credentials)/.test(code)) return 'invalid-credentials'
  if (code.endsWith('email-already-in-use')) return 'email-in-use'
  if (code.endsWith('weak-password')) return 'weak-password'
  if (code.endsWith('invalid-email')) return 'invalid-email'
  if (code.endsWith('user-disabled')) return 'user-disabled'
  if (/(network-request-failed|unavailable)/.test(code)) return 'network'
  if (code.endsWith('too-many-requests')) return 'too-many-requests'
  if (/(popup-closed-by-user|cancelled-popup-request|popup-blocked|canceled|cancelled)/.test(code)) return 'cancelled'
  if (code.endsWith('requires-recent-login')) return 'requires-recent-login'
  if (code.endsWith('account-exists-with-different-credential')) return 'account-exists-with-other-provider'
  if (/user.*cancel|cancel/i.test(String((e as { message?: unknown })?.message ?? ''))) return 'cancelled'
  return 'unknown'
}

const toUser = (u: User): AccountUser => ({
  uid: u.uid,
  email: u.email,
  providers: u.providerData.map((p) => p.providerId).filter((p): p is AccountProviderId => p === 'password' || p === 'google.com' || p === 'apple.com'),
})

export interface AccountService {
  /** Registra l'ascolto dello stato di login. Restituisce la funzione per smettere. */
  onAuthChange(cb: (user: AccountUser | null) => void): Promise<() => void>
  signUp(email: string, password: string): Promise<void>
  signIn(email: string, password: string): Promise<void>
  signInWith(provider: SocialProvider): Promise<void>
  signOut(): Promise<void>
  sendPasswordReset(email: string): Promise<void>
  /** Ri-autentica, cancella TUTTI i dati nel cloud e poi l'account. */
  deleteAccount(opts: { password?: string }): Promise<void>
  remote(): Promise<RemoteStore | null>
}

export function createAccountService(config: FirebaseConfig): AccountService {
  const handles = () => loadFirebase(config)

  // Login social: sul nativo si passa dal plugin (i popup nella WebView non sono affidabili) e si
  // consegna il token alla sessione del SDK web; sul web si usa il popup.
  async function nativeCredential(kind: SocialProvider): Promise<AuthCredential> {
    const authMod = await import('firebase/auth')
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    if (kind === 'google') {
      const r = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true })
      return authMod.GoogleAuthProvider.credential(r.credential?.idToken ?? null, r.credential?.accessToken ?? null)
    }
    const r = await FirebaseAuthentication.signInWithApple({ skipNativeAuth: true })
    return new authMod.OAuthProvider('apple.com').credential({ idToken: r.credential?.idToken, rawNonce: r.credential?.nonce })
  }

  async function webProvider(kind: SocialProvider) {
    const authMod = await import('firebase/auth')
    return kind === 'google' ? new authMod.GoogleAuthProvider() : new authMod.OAuthProvider('apple.com')
  }

  async function reauthenticate(auth: Auth, user: User, password?: string): Promise<void> {
    const authMod = await import('firebase/auth')
    const providerId = user.providerData[0]?.providerId
    if (providerId === 'password') {
      if (!user.email || !password) throw Object.assign(new Error('password richiesta'), { code: 'auth/requires-recent-login' })
      await authMod.reauthenticateWithCredential(user, authMod.EmailAuthProvider.credential(user.email, password))
      return
    }
    const kind: SocialProvider = providerId === 'apple.com' ? 'apple' : 'google'
    if (Capacitor.isNativePlatform()) {
      await authMod.reauthenticateWithCredential(user, await nativeCredential(kind))
    } else {
      await authMod.reauthenticateWithPopup(user, await webProvider(kind))
    }
    void auth
  }

  return {
    async onAuthChange(cb) {
      const { auth } = await handles()
      const { onAuthStateChanged } = await import('firebase/auth')
      return onAuthStateChanged(auth, (u) => cb(u ? toUser(u) : null))
    },

    async signUp(email, password) {
      const { auth } = await handles()
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      await createUserWithEmailAndPassword(auth, email.trim(), password)
    },

    async signIn(email, password) {
      const { auth } = await handles()
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      await signInWithEmailAndPassword(auth, email.trim(), password)
    },

    async signInWith(kind) {
      const { auth } = await handles()
      const authMod = await import('firebase/auth')
      if (Capacitor.isNativePlatform()) await authMod.signInWithCredential(auth, await nativeCredential(kind))
      else await authMod.signInWithPopup(auth, await webProvider(kind))
    },

    async signOut() {
      const { auth } = await handles()
      const { signOut } = await import('firebase/auth')
      await signOut(auth)
      if (Capacitor.isNativePlatform()) {
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
        await FirebaseAuthentication.signOut().catch(() => {})
      }
    },

    async sendPasswordReset(email) {
      const { auth } = await handles()
      const { sendPasswordResetEmail } = await import('firebase/auth')
      try {
        await sendPasswordResetEmail(auth, email.trim())
      } catch (e) {
        // Esito neutro: non si rivela se un'email ha un account (user-not-found e' trattato come successo).
        if (!String((e as { code?: unknown })?.code ?? '').endsWith('user-not-found')) throw e
      }
    },

    async deleteAccount({ password }) {
      const { auth, db } = await handles()
      const user = auth.currentUser
      if (!user) throw Object.assign(new Error('non autenticato'), { code: 'auth/requires-recent-login' })
      // Prima la ri-autenticazione: cosi' non si resta mai con i dati cancellati e l'account ancora in vita.
      await reauthenticate(auth, user, password)
      const { FirestoreRemoteStore } = await import('./firestore-remote')
      await new FirestoreRemoteStore(db, user.uid).deleteAll()
      const { deleteUser } = await import('firebase/auth')
      await deleteUser(user)
    },

    async remote() {
      const { auth, db } = await handles()
      if (!auth.currentUser) return null
      const { FirestoreRemoteStore } = await import('./firestore-remote')
      return new FirestoreRemoteStore(db, auth.currentUser.uid)
    },
  }
}
