# Da fare più avanti

Cose decise ma rimandate di proposito.

- **Accesso con Apple**: spento. Prima di pubblicare su iOS vanno configurati Apple Developer e Firebase, poi `NUXT_PUBLIC_APPLE_SIGN_IN=true`. Passi in `docs/firebase-setup.md` §5.
- **Build iOS**: serve un Mac con Xcode. Guida in `docs/release-ios.md`.
- **Arte**: gli eroi sono SVG disegnati nel progetto. In alternativa si possono generare PNG con i prompt di `docs/art-prompts.md` (il componente `HeroArt` va esteso per i PNG).
- **Playtest e verifica su telefono Android vero**: `docs/playtest-plan.md`.
- **Traduzioni**: italiano e inglese sono completi (`i18n/locales/it` e `en`). Per aggiungere una lingua: nuova cartella con gli stessi 7 file JSON, voce in `core/locale.ts`, `nuxt.config.ts` e `data/notification-texts.ts`; il test `tests/unit/locales.test.ts` confronta chiavi e segnaposto. Le missioni create dall'utente non si traducono (sono suoi dati). Il nome inglese di due eroi sbloccabili e' diverso: Capitan Salmastro = Captain Brine, Brace = Ember.
- **Account (v1.1)**: la v1 esce solo locale. Per riattivarli: variabili `NUXT_PUBLIC_FIREBASE_*`, `'@capacitor-firebase/authentication'` in `includePlugins` di `capacitor.config.ts`, `GoogleService-Info.plist` su iOS, Accedi con Apple, e **ripristinare l'informativa con la parte sugli account** (il testo precedente è nella cronologia git, commit prima del 10/11/2026).
- **Dall'audit del 10/11/2026** (in attesa di decisione): sfruttamento dell'XP creando e archiviando missioni; zoom bloccato (`user-scalable=no`); salvataggio che può fallire in silenzio; miniature degli eroi a piena risoluzione; progressione piatta dopo il livello 20; pausa/ritorno gentile per la streak; promemoria e giorni per singola missione; widget; tema chiaro.
