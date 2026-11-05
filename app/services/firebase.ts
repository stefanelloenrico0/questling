// Inizializzazione LAZY di Firebase: i moduli si caricano solo se l'app e' configurata, e dopo il
// primo render. Senza account l'app non li tocca mai (resta piccola e funziona offline).
import { Capacitor } from '@capacitor/core'
import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  messagingSenderId: string
  emulatorAuth: string
  emulatorFirestore: string
}

export interface FirebaseHandles {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

export const isConfigured = (c: Partial<FirebaseConfig> | undefined): boolean => !!(c?.apiKey && c.projectId && c.appId)

let cached: Promise<FirebaseHandles> | null = null

export function loadFirebase(config: FirebaseConfig): Promise<FirebaseHandles> {
  cached ??= (async () => {
    const [appMod, authMod, fsMod] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')])
    const app = appMod.initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain || undefined,
      projectId: config.projectId,
      appId: config.appId,
      messagingSenderId: config.messagingSenderId || undefined,
    })
    // Nella WebView di Capacitor getAuth() (iframe/popup) e' inaffidabile: si usa initializeAuth con la sola
    // persistenza e i login social passano dal plugin nativo. Sul web restano i popup.
    const auth = Capacitor.isNativePlatform()
      ? authMod.initializeAuth(app, { persistence: [authMod.indexedDBLocalPersistence, authMod.browserLocalPersistence] })
      : authMod.getAuth(app)
    // Firestore SENZA persistenza offline: lo store principale e' quello locale dell'app (spec §11)
    const db = fsMod.getFirestore(app)
    if (config.emulatorAuth) authMod.connectAuthEmulator(auth, `http://${config.emulatorAuth}`, { disableWarnings: true })
    if (config.emulatorFirestore) {
      const [host, port] = config.emulatorFirestore.split(':') as [string, string]
      fsMod.connectFirestoreEmulator(db, host, Number(port))
    }
    return { app, auth, db }
  })()
  return cached
}
