# Account e sincronizzazione: setup di Firebase (Fase 3)

Gli account sono **facoltativi**. Senza le variabili qui sotto l'app funziona solo in locale e la pagina Account dice che non è attiva. Questa guida serve per attivarli.

> Tutto ciò che riguarda piani gratuiti, quote e requisiti degli store è **da verificare** sulle pagine ufficiali prima del rilascio: cambia nel tempo.

## 1. Crea il progetto

1. [Firebase Console](https://console.firebase.google.com/) → **Aggiungi progetto** (Google Analytics: *disattivato*, l'app non traccia nulla).
2. **Build → Authentication → Inizia**, poi abilita i provider:
   - **Email/Password**
   - **Google** (imposta l'email di supporto)
   - **Apple** (serve un account Apple Developer; obbligatorio su iOS se offri Google, linea guida 4.8 — da verificare)
3. **Build → Firestore Database → Crea database**, in **modalità produzione**. Scegli la regione **europea** più vicina e annotala: va scritta nell'informativa privacy (`i18n/locales/it/privacy.json`).
4. **Impostazioni progetto → Le tue app → Aggiungi app Web** e copia la configurazione.

## 2. Variabili d'ambiente

Copia `.env.example` in `.env` (locale) e imposta le stesse variabili su Vercel (**Settings → Environment Variables**):

| Variabile | Valore |
|---|---|
| `NUXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NUXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NUXT_PUBLIC_FIREBASE_APP_ID` | `appId` |
| `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` (facoltativa) |

Questi valori **non sono segreti** (finiscono nel bundle web): la sicurezza è nelle regole di Firestore. Sono lette in fase di build (`nuxt generate`): dopo averle cambiate serve una nuova build.

In **Authentication → Impostazioni → Domini autorizzati** aggiungi il dominio di Vercel.

## 3. Regole di sicurezza

```bash
npx firebase login
npx firebase deploy --only firestore:rules --project <id-progetto>
```

Le regole sono in `firestore.rules`: ogni utente legge/scrive solo `users/{uid}/…`, ogni documento è validato campo per campo, `syncedAt` deve essere il timestamp del server, un documento non può essere sovrascritto da una versione più vecchia e gli eventi XP sono immutabili.

## 4. Android (login Google nativo)

1. In Firebase aggiungi un'**app Android** con l'ID pacchetto `com.stefanelloenrico.questling` (placeholder: **non modificabile dopo la pubblicazione**, confermalo prima).
2. Aggiungi le impronte **SHA-1/SHA-256** (debug: `./gradlew signingReport` da `android/`; release: quella della chiave di firma / di Play App Signing).
3. Scarica `google-services.json` in `android/app/`. È già nel `.gitignore` di `android/`; Gradle applica il plugin solo se il file esiste.
4. Abilita il provider Google (punto 1) e riesegui `npm run cap:sync`.

Il login nativo passa dal plugin `@capacitor-firebase/authentication` con `skipNativeAuth: true`: il token viene consegnato alla sessione del Firebase JS SDK, quindi c'è **una sola** sessione. Il plugin usa SDK di terze parti (Google Sign-In) che, secondo la sua documentazione, possono inizializzarsi e raccogliere dati: l'informativa lo dice. **Da verificare** per le dichiarazioni *Data safety* di Google Play.

## 5. iOS (Fase 4)

Serve macOS/Xcode: aggiungi l'app iOS in Firebase, `GoogleService-Info.plist`, la capability *Sign in with Apple* e segui la guida del plugin (`setup-apple.md`, `setup-google.md`).

## 6. Test con gli emulatori (nessun account Firebase necessario)

```bash
npm run test:rules   # regole di sicurezza + adapter Firestore su emulatore (richiede Java)
npm run e2e:cloud    # app configurata sugli emulatori, due "dispositivi" che si sincronizzano
```

Entrambi avviano gli emulatori su porte libere e li chiudono alla fine (`scripts/with-emulators.mjs`).

## 7. Costi e quote (da verificare)

Il piano gratuito di Firestore ha quote giornaliere su letture/scritture/cancellazioni. Un utente attivo fa poche decine di scritture al giorno. Il design è tutto client-side: **niente Cloud Functions** (richiederebbero il piano a consumo). Controlla le quote sulla pagina prezzi prima di invitare più persone, e imposta un **avviso di budget** nella console.

## 8. Privacy policy

`i18n/locales/it/privacy.json` è la fonte unica: la pagina in-app `/privacy` la legge direttamente e `npm run generate` crea `public/privacy.html` (URL pubblico da indicare negli store). **Completa i segnaposto `[DA COMPLETARE: …]`** (titolare, contatto, regione dei dati, tempi di conservazione presso il fornitore, età minima) e fai verificare il testo da un professionista prima della pubblicazione.
