# Da fare più avanti

Cose decise ma rimandate di proposito.

- **Accesso con Apple**: spento. Prima di pubblicare su iOS vanno configurati Apple Developer e Firebase, poi `NUXT_PUBLIC_APPLE_SIGN_IN=true`. Passi in `docs/firebase-setup.md` §5.
- **Build iOS**: serve un Mac con Xcode. Guida in `docs/release-ios.md`.
- **Arte**: gli eroi sono SVG disegnati nel progetto. In alternativa si possono generare PNG con i prompt di `docs/art-prompts.md` (il componente `HeroArt` va esteso per i PNG).
- **Playtest e verifica su telefono Android vero**: `docs/playtest-plan.md`.
- **Traduzioni**: italiano e inglese sono completi (`i18n/locales/it` e `en`). Per aggiungere una lingua: nuova cartella con gli stessi 7 file JSON, voce in `core/locale.ts`, `nuxt.config.ts` e `data/notification-texts.ts`; il test `tests/unit/locales.test.ts` confronta chiavi e segnaposto. Le missioni create dall'utente non si traducono (sono suoi dati). Il nome inglese di due eroi sbloccabili e' diverso: Capitan Salmastro = Captain Brine, Brace = Ember.
