# Rilascio iOS (TestFlight → App Store)

> Il progetto iOS (`ios/`) è già generato e configurato: iPhone, solo verticale, icona e splash dipinte. **Non è mai stato compilato**: serve macOS con Xcode (qui si lavora da Windows, quindi la build si fa su un Mac in cloud). Ogni punto **(da verificare)** va controllato sulla documentazione Apple corrente.

## Cosa è già pronto nel repository

- `ios/App`: progetto Xcode con **Swift Package Manager** (niente CocoaPods).
- Solo **iPhone** (`TARGETED_DEVICE_FAMILY = 1`) e solo **verticale**: niente screenshot per iPad.
- **Icona** 1024×1024 **senza canale alfa** e **splash** dalla stessa arte dell'app: si rigenerano con `npm run icons`.
- `ITSAppUsesNonExemptEncryption = false` (l'app non usa crittografia propria: salta la domanda sull'export a ogni invio).
- **v1 solo locale**: il plugin di login Firebase è escluso dalle app native (`includePlugins` in `capacitor.config.ts`). Niente "Accedi con Apple" richiesto, niente SDK Firebase/Google.
- `appId` / Bundle ID: `com.stefanelloenrico.questling` (**definitivo dopo la pubblicazione**).

## 0. Prerequisiti

- **Account Apple Developer Program** attivo (a pagamento annuale).
- Un **Mac in cloud** con Xcode recente (versione richiesta da App Store **(da verificare)**), Node ≥ 22.21 e git.
- Il codice del progetto sul Mac: `git clone` dal repository.

## 1. Sul Mac in cloud: preparare il progetto

```bash
git clone <url-del-repository> questling && cd questling
npm install
npm run cap:sync:ios     # genera il web SENZA chiavi Firebase e lo copia in ios/App/App/public
npm run cap:ios          # apre ios/App/App.xcodeproj in Xcode
```

`cap:sync:ios` usa `.env.e2e` (vuoto di proposito): così la v1 non include gli account anche se sul Mac c'è un `.env`. Va rilanciato ogni volta che cambia il codice web.

## 2. In Xcode: firma e invio

1. Seleziona il progetto **App** → target **App** → **Signing & Capabilities**: spunta *Automatically manage signing*, scegli il tuo **Team** (account Apple Developer). Il Bundle Identifier deve essere `com.stefanelloenrico.questling`.
2. In **General**: *Version* `1.0`, *Build* `1` (la *Build* va incrementata a ogni invio, la *Version* quando cambi release).
3. In **App Store Connect** (appstoreconnect.apple.com) → *Apps* → **+** → *Nuova app*: piattaforma iOS, nome **Questling**, lingua principale italiano, Bundle ID `com.stefanelloenrico.questling`, SKU a piacere.
4. In Xcode: destinazione **Any iOS Device (arm64)** → menu **Product → Archive** → **Distribute App** → **App Store Connect** → **Upload**.
5. Dopo qualche minuto la build compare in App Store Connect → **TestFlight** (elaborazione e controlli automatici).

## 3. Provarla sul tuo iPhone (TestFlight, senza revisione)

1. App Store Connect → **TestFlight** → *Gruppi* → **Test interni**: aggiungi il tuo Apple ID come tester interno (devi essere un utente del team).
2. Sul tuo iPhone installa l'app **TestFlight** dall'App Store, accetta l'invito e installa Questling.
3. Controlla: onboarding fino a Oggi senza rete, **notifiche** all'ora giusta e nella voce dell'eroe (concedi il permesso), haptics, tastiera che non copre il campo del nome, area sicura (notch/Dynamic Island), riavvio del telefono, esportazione del backup (foglio di condivisione).

## 4. Cose specifiche di iOS da controllare

- **Notifiche locali**: l'iPhone limita le notifiche pendenti a **64** **(da verificare)**; il piano ne programma al massimo 15. Il permesso si chiede già in modo contestuale.
- **Linea guida 4.2 (funzionalità minime)**: un guscio WebView può essere respinto. Qui ci sono notifiche locali, haptics, storage nativo e condivisione: non toglierli. Nelle note per la revisione elenca queste funzioni native.
- **Privacy (App Privacy / "etichette nutrizionali")**: nella v1 solo locale: **dati non raccolti**. Va compilata in App Store Connect coerentemente con l'informativa.
- **Informativa privacy**: serve un **URL pubblico** (`privacy.html` generata da `npm run privacy`), da inserire in App Store Connect.
- **Classificazione per età**: compila il questionario (nessun contenuto sensibile).
- **Safe area e gesture**: l'app usa `env(safe-area-inset-*)`; prova su un iPhone con notch/Dynamic Island.

## 5. App Store

1. App Store Connect → la tua app → **Versione 1.0**: testi in `docs/store-listing.md` (italiano) e `docs/store-listing.en.md` (inglese); **screenshot** per iPhone 6,9" (1320×2868) e 6,5" (1284×2778 o 1242×2688) **(da verificare le misure richieste)**; URL della privacy policy; assistenza (un indirizzo email o una pagina).
2. Seleziona la build caricata, compila *Note per la revisione* (l'app è solo locale, nessun account da fornire).
3. **Invia per la revisione**: di solito 1–3 giorni **(da verificare)**. Un primo invio può essere respinto con richieste di correzione.

## 6. Quando arriveranno gli account (v1.1)

- Aggiungi `'@capacitor-firebase/authentication'` a `includePlugins` in `capacitor.config.ts`, poi `npm run cap:sync` (usa il tuo `.env`).
- In Firebase aggiungi l'app iOS e scarica `GoogleService-Info.plist` nel progetto Xcode.
- **Obbligo**: se offri il login Google su iOS devi offrire anche **Sign in with Apple** (linea guida 4.8 **(da verificare)**): capability in Xcode e provider Apple in Firebase (`docs/firebase-setup.md`, e `NUXT_PUBLIC_APPLE_SIGN_IN=true`).
- Dalla documentazione del plugin: opzione `experimental.ios.spm.packageOptions` con `symlink: true` (evita una collisione di identità dei pacchetti SwiftPM, richiede Capacitor CLI ≥ 8.4) **(da verificare)**; verifica `application(_:open:options:)` in `AppDelegate.swift`.
- Consentire l'eliminazione dell'account dall'app (linea 5.1.1(v)): c'è (Account → Elimina account).
