# Questling

Habit tracker gamificato in italiano e inglese. Scegli un eroe dipinto (quiz di 8 domande o scelta diretta), completa missioni giornaliere, settimanali e mensili, guadagna XP, sali di livello, sblocca capitoli della storia e nuovi eroi. Le notifiche arrivano nella voce dell'eroe, senza colpevolizzare.

- **Local-first**: tutto funziona offline e senza account. Account e sincronizzazione cloud (Firebase) sono opzionali e spenti nella v1.
- **Nessuna pubblicità, nessun tracciamento, nessun analytics.**
- **Stack**: Nuxt 4 (SPA) · Vue 3 · Tailwind 4 · Nuxt UI 4 · Pinia · Zod · Capacitor 8 (Android e iOS) · Vitest · Playwright.

## Avvio

```bash
npm install
npm run dev          # sviluppo su http://localhost:3000
```

Node ≥ 22.21 consigliato.

## Comandi principali

| Comando | Cosa fa |
|---|---|
| `npm run lint` / `npm run typecheck` | Controlli statici |
| `npm test` | Test unitari (Vitest), con soglie di copertura su `core/` e `data/` |
| `npm run e2e` | Costruisce l'app **senza Firebase** e lancia i test Playwright |
| `npm run test:rules` | Test delle regole Firestore sugli emulatori (serve Java) |
| `npm run e2e:cloud` | Test di account e sincronizzazione sugli emulatori |
| `npm run generate` | Build statica (usa il tuo `.env`) |
| `npm run icons` | Rigenera icone e splash Android/iOS dall'arte dipinta |
| `npm run privacy` | Rigenera `public/privacy.html` e `privacy-en.html` da `i18n/locales/*/privacy.json` |
| `npm run cap:sync:local` / `cap:sync:ios` | Build **solo locale** e sincronizzazione con Android / iOS |

## Struttura

```
core/    Logica di gioco pura e testata (XP, livelli, streak, periodi, notifiche, sync, backup). Nessun import da Vue/Nuxt.
data/    Dati statici: eroi, missioni suggerite, aree di interesse, traguardi, icone.
app/     Interfaccia: pagine, componenti, layout, store Pinia, servizi (Firebase, notifiche), plugin.
i18n/    Testi italiano e inglese (ui, eroi, notifiche, quiz, statistiche, privacy).
tests/   unit/ (Vitest) · e2e/ (Playwright, app solo locale) · e2e-cloud/ · rules/ (emulatori Firebase)
android/ ios/   Progetti nativi Capacitor.
docs/    Guide di rilascio, direzione grafica, prompt dell'arte, analisi dei competitor, piano di playtest.
```

## Arte

Eroi e scene sono illustrazioni dipinte in `app/assets/heroes/art/` e `app/assets/scenes/`; icone dell'interfaccia in `app/assets/ui/`. Come sono state generate: `docs/art-prompts-painterly.md`. Direzione grafica: `docs/design-brief.md` ("Night-Sky Storybook").

## Rilascio

- Android: `docs/release-android.md`
- iOS: `docs/release-ios.md`
- Cose rimandate di proposito: `docs/da-fare.md`
- La **v1 è solo locale**: il codice Firebase non entra nel pacchetto quando `NUXT_PUBLIC_FIREBASE_API_KEY` non è impostata. Per la v1.1 con gli account vedi `docs/firebase-setup.md`.

## Specifica

`questling-spec.md` è la specifica originale, con un riquadro iniziale che elenca ciò che è cambiato da allora.
