# Rilascio iOS (TestFlight → App Store)

> **Non provato**: serve un Mac con Xcode e un account Apple Developer, che qui non ci sono. Questa guida è il percorso da seguire; ogni punto **(da verificare)** va controllato sulla documentazione Apple corrente.

## 0. Prerequisiti

- Mac con Xcode (versione richiesta dall'App Store **(da verificare)**), account **Apple Developer Program** (a pagamento annuale).
- Stesso `appId` dell'Android: `com.stefanelloenrico.questling` (placeholder: **definitivo dopo la pubblicazione**).
- Node ≥ 22.21, `npm install` nel progetto.

## 1. Aggiungere la piattaforma (una volta, sul Mac)

```bash
npm install @capacitor/ios      # stessa versione 8.x degli altri pacchetti Capacitor
npx cap add ios
npm run cap:sync                # build web + sync plugin
npx cap open ios
```

- **Plugin di login Firebase**: nella documentazione del plugin, aggiungi a `capacitor.config.ts` l'opzione `experimental.ios.spm.packageOptions` con `symlink: true` per `@capacitor-firebase/authentication` (evita una collisione di identità dei pacchetti SwiftPM; richiede Capacitor CLI ≥ 8.4) **(da verificare)**.
- Se non usi il login Google su iOS, valuta di disattivare il *package trait* `Google` come indica il README del plugin, per non linkare l'SDK inutilmente.

## 2. Firebase su iOS (se vuoi gli account)

1. In Firebase aggiungi un'**app iOS** con il bundle id e scarica `GoogleService-Info.plist` nel progetto Xcode.
2. **Sign in with Apple**: abilita la capability in Xcode (*Signing & Capabilities*) e il provider Apple in Firebase (`docs/firebase-setup.md`).
3. **Obbligo**: se offri il login Google su iOS devi offrire anche *Sign in with Apple* (linea guida 4.8 **(da verificare)**). Nell'app il pulsante Apple compare già fuori da Android.
4. Nel `AppDelegate.swift` verifica la funzione `application(_:open:options:)` come indicato dal README del plugin.

## 3. Cose specifiche di iOS da controllare

- **Notifiche locali**: l'iPhone limita le notifiche pendenti a **64** **(da verificare)**; il piano ne programma al massimo 15. Il permesso si chiede già in modo contestuale.
- **Linea guida 4.2 (funzionalità minime)**: un guscio WebView può essere respinto. Qui ci sono notifiche locali, haptics e storage nativo: non toglierli.
- **Privacy**: compila le *App Privacy* ("etichette nutrizionali") in App Store Connect coerentemente con l'informativa. **Richiesto**: poter **eliminare l'account dall'app** se permetti la registrazione (linea 5.1.1(v) **(da verificare)**): c'è (Account → Elimina account).
- **Icone/splash**: `resources/icon.png` (1024×1024) è un placeholder: sostituire con l'arte vera.
- **Safe area e gesture**: l'app usa `env(safe-area-inset-*)`; prova su un iPhone con notch/Dynamic Island.

## 4. TestFlight

1. In Xcode: *Product → Archive* → *Distribute App* → *App Store Connect → Upload*.
2. In App Store Connect → **TestFlight**: aggiungi tester interni (fino a un limite **(da verificare)**) o esterni (richiede una breve revisione Apple).
3. Raccogli i risultati con `docs/playtest-plan.md`.

## 5. App Store

Testi in `docs/store-listing.md`; screenshot per le dimensioni richieste (**da fare con l'arte vera**); URL della privacy policy; età; note per la revisione (spiega che gli account sono opzionali e fornisci un account di prova **solo se** la revisione lo richiede).
