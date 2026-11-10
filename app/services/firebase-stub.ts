// Sostituisce 'firebase/*' e il plugin nativo di login quando l'app e' costruita SENZA configurazione Firebase (v1 solo locale):
// il codice di account/sync non viene mai eseguito (account.available e' false) e il pacchetto resta piu' leggero.
// Vedi `vite.resolve.alias` in nuxt.config.ts. Con NUXT_PUBLIC_FIREBASE_* impostate non si usa.
const unavailable = (): never => {
  throw new Error('Firebase non e\' incluso in questa build (solo locale)')
}
export const Timestamp = { fromMillis: unavailable, fromDate: unavailable, now: unavailable }
export const collection = unavailable
export const doc = unavailable
export const getDocs = unavailable
export const query = unavailable
export const serverTimestamp = unavailable
export const where = unavailable
export const writeBatch = unavailable
export type Firestore = never
export default {}
