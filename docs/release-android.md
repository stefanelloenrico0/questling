# Rilascio Android (closed testing su Google Play)

> Requisiti, versioni e policy di Google Play cambiano: ogni punto marcato **(da verificare)** va controllato sulla [Play Console](https://play.google.com/console) / documentazione ufficiale prima di procedere.

## 0. Prerequisiti

- Account sviluppatore Google Play (tassa una tantum **(da verificare)**).
- **Closed testing obbligatorio** per gli account personali nuovi, con un numero minimo di tester per un periodo minimo prima della pubblicazione in produzione **(da verificare: numero e giorni attuali)**.
- Android Studio / Android SDK + JDK (qui `compileSdk`/`targetSdk` = 36; **(da verificare)** il livello API richiesto da Play).
- `applicationId` **`com.stefanelloenrico.questling`**: è un placeholder e **non è modificabile dopo la pubblicazione**. Confermalo prima.
- Variabili `NUXT_PUBLIC_FIREBASE_*` nel `.env` (se vuoi gli account nell'APK) e `google-services.json` in `android/app/` (`docs/firebase-setup.md`).

## 1. Chiave di firma (una volta)

```bash
keytool -genkeypair -v -keystore questling-upload.jks -alias questling -keyalg RSA -keysize 2048 -validity 10000
```

Conserva il file `.jks` **e le password in un posto sicuro fuori dal repository** (se lo perdi non puoi più aggiornare l'app, salvo recupero tramite Play App Signing). Consigliato: iscriversi a **Play App Signing** (Google tiene la chiave vera, tu usi una "upload key").

Crea `android/keystore.properties` (insieme a `*.jks` è già in `android/.gitignore`: non finisce mai nel repository):

```properties
storeFile=../questling-upload.jks
storePassword=...
keyAlias=questling
keyPassword=...
```

E in `android/app/build.gradle`, dentro `android { ... }`:

```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) { keystoreProperties.load(new FileInputStream(keystorePropertiesFile)) }

signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
    }
}
```

> Questo frammento **non è stato provato** (qui non c'è l'Android SDK): verificalo alla prima build.

## 2. Build

```bash
npm run cap:sync                 # genera il web e sincronizza i plugin in android/
cd android
./gradlew bundleRelease          # AAB firmato: android/app/build/outputs/bundle/release/app-release.aab
```

Prima di ogni invio incrementa `versionCode` (e `versionName`) in `android/app/build.gradle`: Play rifiuta un `versionCode` già usato.

## 3. Prova su dispositivo reale (prima di caricare)

Spuntare, su un telefono Android vero (anche Xiaomi/Samsung se possibile):

- [ ] Onboarding fino a Oggi, senza rete.
- [ ] Notifiche: arrivano all'ora giusta e **nella voce dell'eroe**; completando tutte le daily la serale di oggi sparisce; dopo il **riavvio del telefono** tornano all'apertura; rifiutando il permesso l'app funziona.
- [ ] Risparmio energetico aggressivo / app in background a lungo.
- [ ] Cambio fuso e ora legale.
- [ ] Login email e **Google** (serve `google-services.json` e le impronte SHA-1/256 della chiave di firma e di Play App Signing).
- [ ] Esporta/Importa backup; elimina account.
- [ ] Haptics e suoni; rotazione bloccata in verticale; area sicura (notch) e tastiera.

## 4. Play Console

1. **Crea l'app** → nome, lingua predefinita italiano, gratuita.
2. **Scheda dello store**: testi in `docs/store-listing.md`; icona 512×512 (da `resources/icon.png`, **arte placeholder**); *feature graphic* 1024×500 e screenshot (**da fare con l'arte vera**).
3. **Privacy policy**: URL `https://<tuo-dominio>/privacy.html` (completata con i tuoi dati; fai rivedere il testo).
4. **Sicurezza dei dati (Data safety)** — proposta di partenza, da verificare con la policy corrente:
   - Senza account **nessun dato lascia il dispositivo**.
   - Con account (opzionale): *email*, *ID utente*, *contenuto dell'app* (missioni/progressi) → raccolti per *funzionalità dell'app* (sincronizzazione), **non condivisi** con terzi per marketing, **cifrati in transito**, **eliminabili** dall'utente (in-app: Account → Elimina account; e indica l'URL/istruzioni).
   - Nessuna pubblicità, nessun analytics.
   - ⚠️ Il plugin di login nativo usa SDK Google che, secondo la sua documentazione, possono raccogliere dati: **da verificare** per la dichiarazione.
5. **Classificazione dei contenuti**, **target di età** (non per bambini), dichiarazione *app notifications*.
6. **Test chiuso** → crea la traccia, carica l'AAB, aggiungi i tester (email Google), invia il link di iscrizione.
7. Dopo il periodo minimo → richiesta di accesso alla produzione **(da verificare)**.

## 5. Dopo il rilascio

Tieni d'occhio crash e ANR nella Play Console; nessun analytics in-app, quindi i feedback arrivano dai tester (`docs/playtest-plan.md`).
