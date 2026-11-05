# Questling — specifica di progetto

> **Titolo provvisorio.** App mobile (iOS + Android) per darsi obiettivi giornalieri, settimanali e mensili, guidati da un personaggio pixel-art con una storia e una personalità. Quiz iniziale per assegnare il personaggio (cambiabile sempre), livelli, streak, notifiche. **Local-first**: tutto funziona offline senza account; account e sync Firebase sono opzionali (Fase 3).

Convenzioni di questo documento:
- **(stima)** = numero ragionato ma non misurato, da validare con playtest.
- **(da verificare)** = fatto esterno (versioni, policy store, quote di servizi) che può essere cambiato: controllalo prima di appoggiarti.

---

## 0. Istruzioni per Claude Code

1. Leggi tutto il file prima di scrivere codice. Lavora **una fase alla volta** (sezione 13) e **fermati a fine fase** con un riepilogo breve di cosa è fatto e cosa no.
2. Questo file non fissa versioni di librerie. Prima di installare, controlla le versioni stabili correnti di Nuxt, Capacitor e dei plugin, e segnala se una scelta della spec non è più valida.
3. Se una decisione è ambigua o due sezioni si contraddicono, **chiedi a Enrico** invece di indovinare. Le decisioni già prese sono nella sezione 2: non rimetterle in discussione senza un motivo concreto.
4. La logica di gioco vive in `core/` come **funzioni pure TypeScript**, senza import da Vue, Nuxt o Capacitor, ed è coperta da test Vitest. Prima la logica con i test, poi la UI.
5. Zero `any`. Niente stringhe utente hardcoded: tutto in `i18n/`. Un commit per task logico, a fine fase devono passare `typecheck`, `lint`, `test` e `generate`.
6. Fasi 0–2: **nessuna dipendenza da backend**. Firebase entra solo in Fase 3.
7. Package manager: **pnpm**.

Primo prompt suggerito: *«Leggi `questling-spec.md` e implementa la Fase 0. Fermati a fine fase.»*

---

## 1. Visione e posizionamento

**Pitch:** non una to-do list con i punti, ma un compagno di viaggio retro. Scegli (o ti viene assegnato da un quiz) un eroe pixel-art con la sua voce; le missioni che completi lo fanno crescere; le notifiche ti arrivano *nella sua voce*, con battute, non come promemoria sterili.

**Cosa lo distingue (ipotesi):** personalità + voce dell'eroe nelle notifiche + storia a capitoli che si sblocca coi livelli + estetica pixel curata. La meccanica (habit tracker con XP) di per sé non è nuova.

**Onestà sul mercato:** il segmento "habit tracker gamificato" è affollato. Esistono app note che fanno RPG-gamification delle abitudini (alcune anche in pixel-art). Questo documento **non** contiene una verifica aggiornata dei competitor: è un'analisi da fare prima di investire sull'arte (vedi Fase 4). Rischio noto di categoria: la maggior parte degli utenti abbandona le app di abitudini nelle prime settimane (dato generale di settore, non verificato qui). Il design sotto è costruito per massimizzare la voglia di tornare nei primi 14 giorni: level-up rapidi all'inizio, capitoli di storia, notifiche con carattere, nessuna colpevolizzazione.

**Fuori scope (esplicito):** social/amici, classifiche, pubblicità, acquisti in-app, push remote (server), widget, watch. Alcuni sono idee per dopo (sezione 13, Fase 4+).

---

## 2. Decisioni prese (modificabili) e domande aperte

| # | Decisione | Perché | Alternativa scartata |
|---|---|---|---|
| D1 | **Nuxt 4 (SPA, `ssr:false`) + Capacitor** per impacchettare iOS/Android | Stack già padroneggiato (Vue/Nuxt/Tailwind/Vercel); pixel-art + animazioni a sprite in DOM/CSS sono banali; si può testare subito come PWA nel browser del telefono | Expo/React Native e Flutter: richiedono un altro stack; vantaggio nativo irrilevante per questa UI |
| D2 | **Local-first**: stato in locale, funziona senza account né rete | Zero costi, zero attrito al primo avvio, privacy | DB remoto obbligatorio |
| D3 | **Firebase solo opzionale** (Auth + Firestore) per chi vuole registrarsi e avere i dati su più dispositivi | Gratis a questa scala (stima), scalabile, non va in pausa per inattività (da verificare) | Supabase: già noto, ma i progetti free vengono messi in pausa dopo inattività (da verificare), brutto per un'app hobby |
| D4 | **Notifiche = locali** (programmate sul dispositivo), non push remote | I promemoria sono prevedibili e non servono a un server; funzionano offline, nessun costo, nessun token | FCM push: serve solo per cose server-driven (sfide tra amici, ecc.), non per l'MVP |
| D5 | **Il livello appartiene al giocatore, non al personaggio.** Cambiare eroe non azzera nulla | Cambio "in qualsiasi momento" senza penalità; il personaggio è una *skin con personalità* | Livello per personaggio: punisce chi cambia |
| D6 | **Nessun bonus meccanico per personaggio** nell'MVP (solo voce, storia, estetica, missioni suggerite) | Evita exploit "cambio eroe per il bonus" e bilanciamento extra | Talenti con bonus XP (eventualmente v1.1, piccoli e con tetto) |
| D7 | **8 personaggi** base, tutti selezionabili da subito | Sufficiente varietà, gestibile come arte | 4 (poco varietà) o 12+ (arte ingestibile) |
| D8 | **Arte MVP: sprite 32×32**, 1 set base per personaggio + **overlay condivisi** per i tier di evoluzione | L'arte è il collo di bottiglia: 8 sprite + 4 overlay invece di 40 redisegni | Un redesign per tier (v2) |
| D9 | **Solo tema scuro**, portrait lock | Look retro coerente, meno superficie da testare | Tema chiaro |
| D10 | **Italiano al lancio**, i18n pronta per l'inglese | Niente traduzioni da mantenere subito | IT+EN dal giorno 1 |
| D11 | **Settimana ISO (da lunedì)**, giorno che cambia alle **04:00** locali | Chi fa tardi non perde la streak a mezzanotte | Mezzanotte / settimana configurabile |
| D12 | **Sviluppo/test su Android + PWA nel browser**; iOS in Fase 4 | Build iOS richiede macOS/Xcode (o CI macOS) | iOS subito |
| D13 | **Gratis, senza pubblicità, nessun tracking** nell'MVP | Semplicità e meno adempimenti privacy | Monetizzazione: da decidere dopo aver visto se qualcuno lo usa |

**Domande aperte** (default tra parentesi, applicali se non c'è risposta):
1. Per iOS hai già un Mac o una pipeline CI per buildare? (default: Android + PWA ora, iOS in Fase 4)
2. Chi fa l'arte? Disegno tu, la commissioni, o placeholder per ora? (default: placeholder generati da script in Fase 0)
3. Nome definitivo e bundle ID. (default: `Questling`, `com.stefanelloenrico.questling` — placeholder, **non modificabile dopo la pubblicazione**, confermare)
4. Lancio pubblico o solo cerchia ristretta (TestFlight / closed testing)? (default: cerchia ristretta)

---

## 3. Stack e architettura

**Runtime:** Nuxt 4 (`ssr: false`), Vue 3, TypeScript strict, Tailwind CSS 4, Pinia, VueUse, `@nuxtjs/i18n`. Nuxt UI v3 **solo per i primitivi accessibili** (Modal/Drawer/Toast) con tema completamente sovrascritto: i componenti visibili sono i nostri `Pixel*`.

**Nativo (Capacitor):** `@capacitor/local-notifications`, `@capacitor/preferences` (persistenza), `@capacitor/haptics`, `@capacitor/app` (resume/rollover giorno), `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/share` + `@capacitor/filesystem` (export backup).

**Validazione:** Zod per il parsing dello stato salvato/importato.

**Test:** Vitest (unit, `core/`), Playwright (e2e sulla PWA: onboarding e flusso Oggi).

### Struttura repo

```
questling/
  app/                      # srcDir Nuxt 4
    pages/                  # index (Oggi), quests, hero, settings, onboarding/*
    components/pixel/       # PixelButton, PixelCard, PixelBar, PixelDialog, PixelCheck, PixelSprite...
    components/             # QuestRow, HeroHeader, LevelUpModal, QuizQuestion...
    composables/            # useGame, useNotifications, useHaptics, useSfx
    stores/                 # game.ts (Pinia), settings.ts
    plugins/                # persistence.client.ts, app-lifecycle.client.ts
  core/                     # PURO, niente Vue/Capacitor
    xp.ts  levels.ts  periods.ts  streak.ts  quiz.ts  notifications-plan.ts  schema.ts
  data/
    characters.ts           # id, assi, accent, tier, sprite meta
    quiz.ts                 # domande e pesi
  i18n/locales/it/          # ui.json, characters.json, quiz.json, notifications.json
  public/sprites/           # {id}/idle.png, happy.png, overlays/tier2..5.png
  scripts/gen-placeholder-sprites.mjs
  tests/                    # unit (core) + e2e
  capacitor.config.ts
```

### Note di build (da verificare)
- `nuxt generate` → `webDir` di Capacitor. Su Capacitor le route profonde con reload possono rompersi: usare `router.options.hashMode: true` o verificare il fallback SPA su device.
- `viewport-fit=cover` + `env(safe-area-inset-*)` ovunque. Disabilitare overscroll/bounce.
- La stessa build gira come **PWA su Vercel** per iterare dal browser del telefono. Le notifiche locali funzionano solo nel build nativo: nel browser l'adapter è un no-op con log.
- App Store: un guscio WebView senza funzioni native rischia il rifiuto per "minimum functionality" (linea guida 4.2, da verificare). Qui ci sono notifiche locali + haptics + persistenza nativa: ok, ma non toglierli.

---

## 4. Design system pixel

**Unità base: 4 px.** Ogni dimensione, padding e bordo è multiplo di 4. Rendering immagini: `image-rendering: pixelated`, scala **intera** (×4, ×6, ×8), mai frazionaria.

### Palette (base: Sweetie 16 — verificare la licenza su Lospec prima del rilascio)

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#1a1c2c` | sfondo app |
| `--surface` | `#333c57` | card, pannelli |
| `--surface-2` | `#566c86` | bordi, elementi secondari |
| `--text` | `#f4f4f4` | testo principale (15.3:1 su bg) |
| `--text-soft` | `#94b0c2` | testo secondario (7.4:1 su bg) |
| `--xp` | `#ffcd75` | barra XP, monete |
| `--ok` | `#a7f070` | completato |
| `--warn` | `#ef7d57` | attenzione |
| `--danger` | `#b13e53` | solo decorazione (contrasto basso come testo) |

**Accent per personaggio** (colora bordi, barra, bottoni primari; contrasti calcolati su `--bg` / `--surface`):

| Personaggio | Accent | su bg | su surface |
|---|---|---|---|
| Valdo | `#41a6f6` | 6.4:1 | 4.2:1 |
| Kuro | `#94b0c2` | 7.4:1 | 4.8:1 |
| Fenna | `#38b764` | 6.5:1 | 4.2:1 |
| Zeffiro | `#73eff7` | 12.4:1 | 8.0:1 |
| Lumen | `#ffcd75` | 11.4:1 | 7.4:1 |
| Rondò | `#ef7d57` | 6.2:1 | 4.0:1 |
| Unità 404 | `#a7f070` | 12.3:1 | 8.0:1 |
| Brunilde | `#e8707f` (fuori palette, schiarito per il contrasto) | 5.7:1 | 3.7:1 |

Regola: nessun accent usato come colore di testo se il contrasto sul fondo è < 4.5:1; per elementi UI non testuali minimo 3:1.

### Tipografia (self-hosted, funziona offline)
- Titoli, numeri, livelli: **Press Start 2P** (solo ≥ 12 px, mai per paragrafi).
- Corpo: **Pixelify Sans** (fallback **VT323**). Corpo minimo 16 px.
- Pacchetti `@fontsource/*` (nomi da verificare), niente caricamento da CDN.

### Componenti
`PixelButton` (stati: idle, pressed = trasla 4 px giù, disabled), `PixelCard` (bordo a gradini via `box-shadow`, niente `border-radius`), `PixelBar` (XP, a blocchi da 4 px), `PixelCheck`, `PixelDialog`, `PixelToast`, `PixelSprite`, `StatChip`. Angoli "tagliati" con box-shadow a gradini (stile NES, **senza** dipendere da NES.css).

### Sprite
- Formato: spritesheet orizzontale, frame 32×32. `idle.png` = 4 frame, `happy.png` = 4 frame.
- Animazione CSS: `steps(4)` su `background-position`; ~0.8 s per ciclo idle.
- **Overlay tier** (condivisi da tutti i personaggi): T2 scintille, T3 stendardo accanto all'eroe, T4 aura pulsante, T5 corona/aureola + aura. Sovrapposti nel DOM allo stesso frame size.
- `prefers-reduced-motion`: solo primo frame, niente aura pulsante.
- **Placeholder (Fase 0):** `scripts/gen-placeholder-sprites.mjs` genera 8 sprite distinguibili (colore accent + una forma riconoscibile per classe: elmo, cappuccio, cappello a punta, aureola, antenna…) con `pngjs`, così l'app si sviluppa e si testa indipendentemente dall'arte vera.

### Audio e haptics
- SFX sintetizzati (libreria tipo ZzFX o Web Audio a mano; licenza da verificare), **nessun file audio**: tap, completa missione, level-up, errore. Toggle in Impostazioni.
- Haptics: impatto leggero al completamento, "success" al level-up.

### Accessibilità
Target touch ≥ 48×48 px, label ARIA in italiano, niente informazione affidata solo al colore (la missione completata ha anche check + testo barrato), `prefers-reduced-motion` rispettato.

---

## 5. Personaggi (8)

Ogni eroe ha una posizione sui 4 assi del quiz (sezione 6): **O** (+Ordine / −Caos), **M** (+Mente / −Corpo), **S** (+Sociale / −Solitario), **A** (+Audace / −Cauto). I testi vanno in `i18n/locales/it/characters.json`; i dati strutturali in `data/characters.ts`.

| id | Nome | Archetipo | O | M | S | A |
|---|---|---|---|---|---|---|
| `valdo` | Ser Valdo | Cavaliere valoroso | + | − | + | + |
| `kuro` | Kuro | Ninja, l'Ombra | + | − | − | − |
| `fenna` | Fenna | Ranger dei boschi | − | − | − | + |
| `zeffiro` | Zeffiro | Stregone distratto | − | + | − | − |
| `lumen` | Lumen | Custode della quiete (chierica) | + | + | + | − |
| `rondo` | Rondò | Bardo girovago | − | + | + | + |
| `u404` | Unità 404 | Robot da cabinato arcade | + | + | − | + |
| `brunilde` | Brunilde | Nana fabbra | − | − | + | − |

**Struttura per personaggio:** capitolo 1 della storia (scritto qui sotto), **capitoli 2–5** che si sbloccano ai livelli 5/10/15/20 (da bozzare nello stesso tono e far rivedere a Enrico), titoli per i 5 tier (livelli 1/5/10/15/20), frasi di notifica, missioni suggerite. Segnaposto nei testi: `{n}` = giorni di streak, `{name}` = nome dell'utente.

### Ser Valdo — il Cavaliere Valoroso
- **Aspetto:** elmo con cimiero rosso, armatura grigio-azzurra, scudo con un'ammaccatura.
- **Voce:** solenne, epica, un filo esagerata. Chiama l'utente "prode".
- **Storia (cap. 1):** Ser Valdo era lo scudiero più sbadato di Pietrasecca, finché un drago di scadenze arretrate non ha incendiato il granaio del regno. Da quel giorno ha giurato: una missione al giorno, senza saltarne nessuna. Sul suo scudo c'è un'ammaccatura. Dice che è "una storia lunga".
- **Titoli:** Scudiero → Cavaliere → Capitano → Paladino → Leggenda del Regno
- **Notifiche:** mattina «Alba sul regno, prode! Le missioni di oggi attendono il tuo valore.» · sera «Il sole cala e il dovere chiama: un ultimo assalto prima del tramonto?» · streak «La tua striscia di {n} giorni vacilla! Nessun cavaliere lascia la bandiera a terra.»
- **Missioni suggerite:** Allenamento di 20 min · Letto rifatto prima delle 9 · Un gesto gentile verso qualcuno · (settimanale) Chiamare un amico

### Kuro — l'Ombra
- **Aspetto:** tuta blu notte, sciarpa rossa che sventola, solo gli occhi visibili.
- **Voce:** laconica, frasi brevissime, mai esclamativi.
- **Storia (cap. 1):** Il Monastero della Lanterna addestra le ombre da mille anni. Kuro è l'unica a non essere mai arrivata in ritardo, nemmeno una volta. Parla poco, perché ogni parola è un passo di troppo.
- **Titoli:** Novizio → Ombra → Maestro d'Ombra → Gran Sensei → Ombra Eterna
- **Notifiche:** mattina «Alba. Tre missioni. Nessun rumore.» · sera «L'ombra cala. Ne resta una.» · streak «{n} giorni di silenzio e disciplina. Non spezzarli stasera.»
- **Missioni suggerite:** 10 min di meditazione · Zero social fino a pranzo · Pianificare domani la sera prima · (settimanale) Riordinare una zona della casa

### Fenna — la Ranger
- **Aspetto:** mantello verde, capelli arancio, arco in spalla.
- **Voce:** diretta, sarcastica, ama le metafore da sentiero.
- **Storia (cap. 1):** Fenna è cresciuta nella Foresta Sussurrante, dove i sentieri esistono solo se qualcuno li percorre. Ha smesso di chiedere la strada: la apre. Il suo arco non sbaglia bersaglio; il suo senso dell'orientamento, a volte sì.
- **Titoli:** Segugio → Ranger → Cacciatrice di Sentieri → Custode della Foresta → Leggenda dei Boschi
- **Notifiche:** mattina «Il bosco è sveglio. Tu? Allaccia gli scarponi.» · sera «Il sentiero non si cammina da solo. Una missione prima del buio.» · streak «{n} giorni di strada fatta. Non fermarti proprio ora.»
- **Missioni suggerite:** 30 min all'aperto · 8000 passi · 2 litri d'acqua · (settimanale) Un'uscita in natura

### Zeffiro — lo Stregone Distratto
- **Aspetto:** cappello viola a punta, barba bianca, bastone con gemma ciano.
- **Voce:** svagato, divaga, inventa formule magiche a caso.
- **Storia (cap. 1):** Zeffiro è stato il mago più brillante dell'Accademia dei Cieli, prima di dimenticare dove aveva messo la bacchetta (era dietro l'orecchio). Ricorda mille formule e mai dove ha parcheggiato. Ha scoperto che le missioni quotidiane funzionano meglio di qualsiasi incantesimo.
- **Titoli:** Apprendista → Mago → Arcimago Smemorato → Stregone Supremo → Saggio dei Cieli
- **Notifiche:** mattina «Buongiorno! Dovevo ricordarti qualcosa... ah sì, le missioni!» · sera «Ho perso la bacchetta (era in tasca). Intanto: le missioni?» · streak «Magia antica: la tua striscia di {n} giorni sta per svanire. Abracadabra, apri l'app!»
- **Missioni suggerite:** Leggere 15 pagine · Imparare una cosa nuova · Annotare un'idea · (settimanale) Finire un mini-progetto

### Lumen — la Custode della Quiete
- **Aspetto:** veste bianca e oro, aureola, bastone con lanterna.
- **Voce:** dolce, calma, incoraggiante. **Mai colpevolizzante.**
- **Storia (cap. 1):** Lumen custodisce la Lanterna della Quiete, una luce che non si spegne finché qualcuno, da qualche parte, fa un piccolo passo avanti. Non giudica mai la tua giornata: la illumina soltanto.
- **Titoli:** Accolita → Custode → Sacerdotessa → Voce dell'Alba → Alba Eterna
- **Notifiche:** mattina «Buongiorno. Respira: oggi basta un passo piccolo.» · sera «Nessuna fretta. Una missione gentile prima di dormire?» · streak «Hai costruito {n} giorni di luce. Ne basta uno piccolo anche stasera.»
- **Missioni suggerite:** A letto entro le 23 · 5 min di respirazione · Un pasto con verdure · (settimanale) Un'ora senza telefono

### Rondò — il Bardo
- **Aspetto:** cappello piumato, giacca arancio, liuto.
- **Voce:** teatrale, battute, ogni tanto parla in rima baciata.
- **Storia (cap. 1):** Rondò canta ogni giorno come fosse la prima di una tournée: sempre su un palco diverso, spesso la piazza di un paese di cui non sa pronunciare il nome. Le sue ballate sono quasi sempre vere, e quasi sempre un po' più lunghe.
- **Titoli:** Giullare → Bardo → Menestrello → Maestro di Corte → Leggenda dei Cantastorie
- **Notifiche:** mattina «Su il sipario! Il giorno è un palco e le tue missioni sono le battute.» · sera «Ultimo atto: una missione ancora e l'applauso è garantito!» · streak «{n} giorni di ballata... non lasciare il ritornello a metà!»
- **Missioni suggerite:** Scrivere o creare 10 min · Ascoltare musica con attenzione · Scrivere a un amico · (settimanale) Mostrare una creazione a qualcuno

### Unità 404 — il Robot
- **Aspetto:** corpo grigio, volto-schermo verde lime, antenna storta.
- **Voce:** deadpan, tecnica, umorismo da log di sistema. Prefissa le frasi con `>`.
- **Storia (cap. 1):** Ritrovata in un cabinato arcade dimenticato in una soffitta, l'Unità 404 ha un solo comando in memoria: ottimizzare. Ha capito che un'abitudine è un loop ben scritto. "Errore 404" è il suo scopo, che sta ancora cercando.
- **Titoli:** Prototipo → Unità Beta → Unità 1.0 → Unità Prime → Singolarità
- **Notifiche:** mattina «> BOOT completato. 3 missioni in coda. Eseguire? [S/n]» · sera «> WARNING: missioni non completate. Timeout in 3 ore.» · streak «> ERRORE IMMINENTE: striscia di {n} giorni a rischio reset.»
- **Missioni suggerite:** Inbox/To-do a zero · Una sessione di focus da 25 min · Registrare le spese · (settimanale) Revisione settimanale

### Brunilde — la Nana Fabbra
- **Aspetto:** trecce arancio, martello, grembiule rosso scuro, barba di fuliggine.
- **Voce:** burbera ma affettuosa, battute da taverna, proverbi sul ferro.
- **Storia (cap. 1):** Alla Forgia dei Tre Martelli, Brunilde batte un colpo al giorno, ogni giorno, da quando ha memoria. Il suo segreto: nessun colpo è decisivo, ma la lama arriva. Brontola, ma tiene un posto al fuoco per chiunque arrivi.
- **Titoli:** Garzona → Fabbra → Maestra Fabbra → Gran Maestra della Forgia → Leggenda dell'Incudine
- **Notifiche:** mattina «Forgia accesa, apprendista! Il ferro non si batte da solo.» · sera «Il ferro si batte finché è caldo: una missione prima di cena?» · streak «{n} giorni di colpi di martello! Non lasciar raffreddare la forgia.»
- **Missioni suggerite:** Cucinare un pasto vero · 15 min di riordino/fai-da-te · Lavare i piatti subito · (settimanale) Aggiustare o costruire qualcosa

**Pool di notifiche:** per ogni personaggio generare **almeno 10 varianti per slot** (mattina, sera, streak, ritorno, riepilogo settimanale, riepilogo mensile, level-up), nella stessa voce. Le tre frasi sopra sono il campione di tono. Enrico rivede.

**Personaggi sbloccabili (Fase 4, opzionali):** Pirata, Slime Filosofo, Drago — sbloccati da traguardi (livello 10/20, streak 30). Il quiz è già predisposto: un nuovo eroe è solo un nuovo vettore di segni sugli assi.

---

## 6. Quiz iniziale

**8 domande, 4 risposte ciascuna, 2 domande per asse.** Le prime quattro (una per asse) pesano di più (±3/±1), le seconde quattro di meno (±2/±1). L'ordine delle domande è fisso (O, M, S, A, O, M, S, A); l'ordine delle risposte nella UI va **mescolato** per evitare bias di posizione. Tono: leggero, divertente, mai un test psicologico serio (non presentarlo come tale).

| # | Asse | Domanda | Risposte (peso) |
|---|---|---|---|
| 1 | O | Sabato mattina, zero impegni. Come parte la giornata? | Ho già una lista con gli orari (+3) · Ho un'idea di massima, poi vedo (+1) · Mi sveglio e decido al volo (−1) · Dove mi porta il vento (−3) |
| 2 | M | Ti regalano un'ora libera. La usi per… | imparare qualcosa di nuovo (+3) · un puzzle o un gioco di strategia (+1) · una camminata o un giro in bici (−1) · allenarmi finché non sudo (−3) |
| 3 | S | La serata perfetta è… | un casino bello con tanti amici (+3) · cena con 3–4 persone (+1) · con una persona sola (−1) · io, il divano e i miei progetti (−3) |
| 4 | A | Ti propongono il bungee jumping. | Primo della fila! (+3) · Ci sto, ma urlo (+1) · Mi serve un giorno per pensarci (−1) · Ho già valutato i rischi: no grazie (−3) |
| 5 | O | La tua scrivania (o il tuo zaino) è… | un posto per ogni cosa (+2) · abbastanza in ordine (+1) · caos creativo, ma so dove sta tutto (−1) · un buco nero con dentro oggetti misteriosi (−2) |
| 6 | M | Davanti a un problema… | mi fermo e ragiono con calma (+2) · cerco prima informazioni e consigli (+1) · provo cose finché una funziona (−1) · lo affronto di petto, poi si vedrà (−2) |
| 7 | S | Quando ti fai un obiettivo… | lo dico a tutti, così non posso mollare (+2) · lo racconto a un amico (+1) · lo tengo per me finché non va bene (−1) · nessuno lo saprà finché non è fatto (−2) |
| 8 | A | Nuovo videogioco: come inizi? | Difficoltà massima, si impara morendo (+2) · Normale, niente tutorial (+1) · Leggo prima la guida (−1) · Facile: mi godo la storia (−2) |

### Scoring (`core/quiz.ts`)

```ts
type Axes = { O: number; M: number; S: number; A: number }  // somma pesi per asse, range -5..+5

// segni per personaggio (sezione 5)
// score_c = O*sO + M*sM + S*sS + A*sA      (s* = ±1)
// vincitore = argmax(score_c)
// affinità % = round(50 + 50 * score_c / (|O|+|M|+|S|+|A|))   // solo cosmetica, se somma > 0
```

- **Esito:** mostrare il vincitore con l'affinità e due "vicini" (2° e 3° punteggio). L'utente conferma o sceglie un altro.
- **Pareggio al primo posto:** mostrare i finalisti a pari merito come "Sei a metà tra X e Y: scegli tu". Se la somma dei valori assoluti è 0 (tutte le risposte si annullano), 3 personaggi a caso con pareggio dichiarato.
- **Simulazione eseguita (risposte uniformi su tutte le 65.536 combinazioni di somme per asse):** ogni personaggio esce il 12,5% delle volte; i pareggi al primo posto sono ~21,9% (stima della frequenza reale: dipende da come rispondono gli utenti). Inerente alla struttura 8-su-16 sui segni: per questo il pareggio è gestito in UI e non nascosto con una regola arbitraria.
- Ripetibile da Eroe → "Rifai il quiz". Il risultato **non blocca** nulla: l'eroe si cambia sempre a mano.

Test obbligatori: ogni combinazione di 4 segni estrema restituisce il personaggio atteso; pareggio rilevato; somma zero gestita; i pesi non cambiano mescolando l'ordine delle risposte.

---

## 7. Meccaniche di gioco

### Missioni
- Tre periodi: **daily**, **weekly**, **monthly**.
- `target`: daily = 1 (checkbox); weekly = 1–7 volte; monthly = 1–31 volte. Il progresso aumenta a ogni tap; **l'XP si assegna solo quando il target è raggiunto**, una volta per periodo (niente farming a tap).
- Difficoltà scelta dall'utente: **easy 5 / medium 10 / hard 20** XP base.
- **Moltiplicatore periodo:** daily ×1, weekly ×4, monthly ×12. Esempio: medium weekly = 40 XP, medium monthly = 120 XP.
- **Tetto missioni attive** (anti-inflazione di XP): max **7 daily, 4 weekly, 3 monthly** (stima, da tarare). La difficoltà è autodichiarata: non si previene il "barare", è un'app single-player.
- **Annullare** un completamento è consentito per il periodo corrente (e per "ieri" fino alle 04:00 di oggi): genera un `XpEvent` negativo. Il livello è derivato, quindi può scendere; niente animazione di "level-down".

### XP, bonus
- **Bonus "tutte fatte":** +10 XP, una volta al giorno, quando tutte le missioni daily attive di quel giorno sono completate (solo se ce ne sono ≥ 2). Si ritira se si annulla.
- **Traguardi streak:** 7 giorni +25 XP, 30 giorni +100, 100 giorni +300 (stima, da bilanciare).

### Livelli (`core/levels.ts`)

```ts
export const xpToNext = (level: number) => Math.round(50 * level ** 1.1)

export function levelFromXp(totalXp: number) {
  let level = 1
  let rest = Math.max(0, totalXp)
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level)
    level++
  }
  return { level, xpInLevel: rest, xpToNext: xpToNext(level) }
}
```

Il livello **non si memorizza**: si deriva dalla somma degli `XpEvent`.

**Perché esponente 1.1:** con 1.4 (la prima ipotesi) il livello 20 richiedeva ~527 giorni (1,4 anni) a costanza piena e ~752 (2 anni) al 70%; con 1.1 si arriva a Lv 20 in 247 giorni al 100% e 353 (circa 1 anno) al 70% (stima), mentre i primi livelli restano velocissimi (Lv 2 dopo il primo giorno) per l'aggancio iniziale.

**Riferimento di bilanciamento:** utente tipico = 3 daily medium + 1 weekly medium + 1 monthly medium. Mese a costanza 100%: 30 × (3×10 + 10 bonus) + 4 × 40 + 120 = **1480 XP**. A costanza 70%: **~1036 XP** (stima, 70% è un'ipotesi, non un dato). Quindi ≈49 XP/giorno a 100% e ≈35 a 70%.

### Tier di evoluzione e storia
Tier ai livelli **1 / 5 / 10 / 15 / 20**: cambia il titolo (sezione 5), si applica l'overlay (sezione 4) e si sblocca il **capitolo di storia** corrispondente. Con la curva sopra, a costanza 70% (stima): Lv 5 ≈ 16 giorni, Lv 10 ≈ 78, Lv 15 ≈ 189, Lv 20 ≈ 353.

### Streak (`core/streak.ts`)
- Un giorno "conta" se almeno **una daily** è completata (giorno = chiave `dayKey`, cambio alle 04:00).
- **Scudo:** si guadagna 1 scudo ogni 7 giorni di streak (max 2). Un giorno saltato consuma automaticamente uno scudo se disponibile (la streak non cresce ma non si azzera); senza scudi si azzera.
- Il giorno corrente non rompe la streak finché non è finito ("a rischio" ≠ "persa").
- **Derivata, non memorizzata:** funzione pura che riscorre i giorni dal primo giorno attivo. 365 giorni = costo trascurabile.
- Test minimi: 7 giorni consecutivi → +1 scudo; salto con scudo → continua; salto senza scudo → 0; 2 salti con 1 scudo → 0; passaggio DST; passaggio mezzanotte→04:00; undo che rompe un traguardo.

### Chiavi di periodo (`core/periods.ts`)

```ts
// Il "giorno" cambia alle dayStartHour (default 4). Costruito dal calendario locale (a prova di DST).
export function dayKey(now: Date, dayStartHour = 4): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (now.getHours() < dayStartHour) d.setDate(d.getDate() - 1)
  return ymd(d)   // 'YYYY-MM-DD' con getFullYear/getMonth/getDate locali
}
// weekKey: settimana ISO del giorno logico → '2026-W45' (4 nov 2026 è in W45)
// monthKey: primi 7 caratteri di dayKey → '2026-11'
```

---

## 8. Modello dati e persistenza

```ts
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Period = 'daily' | 'weekly' | 'monthly'
export type CharacterId =
  | 'valdo' | 'kuro' | 'fenna' | 'zeffiro' | 'lumen' | 'rondo' | 'u404' | 'brunilde'

export interface Quest {
  id: string                 // ULID
  title: string
  icon: string               // id da un set fisso di ~24 icone pixel
  difficulty: Difficulty
  period: Period
  target: number             // daily=1, weekly 1..7, monthly 1..31
  order: number
  createdAt: string          // ISO
  updatedAt: string
  archivedAt?: string | null // soft delete (serve anche al sync)
}

export interface Completion {
  id: string                 // `${questId}_${periodKey}` → deterministico, idempotente
  questId: string
  periodKey: string          // '2026-11-04' | '2026-W45' | '2026-11'
  count: number              // 0..target
  completedAt?: string | null
  updatedAt: string
}

export interface XpEvent {   // log append-only; XP totali = somma dei delta
  id: string                 // ULID
  at: string
  delta: number              // negativo in caso di undo
  reason: 'quest' | 'daily_bonus' | 'streak_milestone' | 'adjustment'
  refId?: string             // id completamento o dayKey
}

export interface Profile {
  displayName: string
  characterId: CharacterId
  quizAnswers?: number[]     // indici risposta, per poter rifare/rivedere
  onboardedAt: string
  updatedAt: string
}

export interface Settings {
  locale: 'it' | 'en'
  dayStartHour: number       // default 4
  notifications: {
    enabled: boolean
    morningTime: string      // 'HH:mm' default '09:00'
    eveningTime: string      // default '20:30'
    streakRisk: boolean; weeklyMonthly: boolean; comeback: boolean
  }
  sound: boolean; haptics: boolean
}

export interface AppState {
  schemaVersion: number
  profile: Profile | null
  quests: Quest[]
  completions: Completion[]
  xpEvents: XpEvent[]
  unlockedChapters: Record<CharacterId, number[]>
  settings: Settings
  lastOpenAt: string
}
```

**Persistenza (Fasi 0–2):** `@capacitor/preferences` (storage nativo, più robusto del solo localStorage del WebView, che in casi rari può essere svuotato) con una chiave `questling:v1:state`. Scrittura **debounced ~300 ms** + flush su `appStateChange` verso background. `schemaVersion` + funzione di **migrazione** a catena. Parsing con Zod: se lo stato salvato è corrotto, **non** sovrascriverlo: tenere una copia `…:corrupt:<timestamp>` e ripartire.

**Volume dati (stima):** ~1.100 completamenti/anno ≈ pochi centinaia di KB in 3 anni → JSON in un'unica chiave va bene. Compattazione opzionale oltre 90 giorni (aggregati per giorno) rimandata finché non serve.

**Backup manuale (MVP):** Impostazioni → Esporta (JSON via Share/Filesystem) e Importa (validazione Zod, anteprima, conferma prima di sovrascrivere). Rete di sicurezza prima del sync.

---

## 9. Notifiche (locali)

**Perché locali:** i promemoria sono prevedibili, non serve un server; funzionano offline, nessun costo, nessun token da gestire. Le push remote (FCM) servirebbero solo per eventi server-driven (sfide tra amici ecc.): fuori scope.

### Piano deterministico (`core/notifications-plan.ts`)
Funzione **pura** `planNotifications({ state, now }) → PlannedNotification[]`. L'adapter nativo (`useNotifications`) fa: **cancella tutto il pendente → riprogramma il piano**. Idempotente, richiamato su: apertura app, ogni completamento/undo, cambio impostazioni, cambio personaggio, rientro in foreground, cambio fuso orario.

```ts
export interface PlannedNotification {
  id: number            // deterministico: yyyymmdd*10 + slot (es. 202611041) → entra in int32
  at: Date
  slot: 'morning' | 'evening' | 'streak_risk' | 'weekly' | 'monthly' | 'comeback'
  title: string         // nome dell'eroe
  body: string          // dal pool dell'eroe, scelto in modo deterministico (hash giorno+slot), mai la stessa due giorni di fila
  route: string         // deep link all'apertura ('/')
}
```

**Regole:**
- Orizzonte: **prossimi 7 giorni** (iOS ha un limite di ~64 notifiche pendenti, da verificare: 7×2 + comeback resta ben sotto).
- **Max 2 al giorno:** `morning` (alle `morningTime`, solo se esistono daily) + 1 slot serale scelto per priorità: **streak_risk** (streak ≥ 3 e nessuna daily fatta oggi, ~21:00) > **weekly** (domenica sera se ci sono weekly incomplete; lunedì mattina "nuova settimana") / **monthly** (primo del mese; ultimi 3 giorni se monthly incomplete) > **evening** standard (`eveningTime`) solo se oggi non è tutto fatto.
- Se nella giornata corrente tutte le daily sono completate, **cancellare** la serale di oggi (il re-plan sul completamento lo fa da solo).
- **comeback:** se l'app non viene aperta per 3 giorni, 1 notifica al giorno +3 e una al +7, poi **stop**. Si annulla all'apertura.
- Mai notifiche fuori 08:00–22:00. Il tono non colpevolizza mai (anche per Valdo/Brunilde: sono battute, non rimproveri).

### Permessi
- **Non chiedere al primo avvio.** Chiedere in un momento contestuale: dopo aver creato le prime missioni, con una schermata nella voce dell'eroe che spiega *cosa* manderà. Se rifiuta: l'app funziona uguale, con un invito discreto in Impostazioni.
- Android 13+: permesso runtime `POST_NOTIFICATIONS`. Canale `reminders`. Icona di stato monocromatica. Allarmi esatti vs inesatti su Android 12+: **da verificare** (consigliato inesatti: l'orario preciso al minuto non serve).
- **Test su device reali:** riavvio telefono, risparmio batteria aggressivo di alcuni produttori (Xiaomi, Samsung…), cambio fuso, ora legale.

---

## 10. Schermate e flussi

### Onboarding (primo avvio)
`Splash` → `Intro` (3 schermate brevi, saltabili) → `Quiz` (8 domande, barra di progresso) → `Rivelazione` (animazione: silhouette → eroe, affinità %, 2 vicini, pareggio gestito) → `Nome` (come ti chiama l'eroe) → `Prime missioni` (3 suggerite dall'eroe pre-selezionate + "aggiungi tue") → `Permesso notifiche` (contestuale) → `Oggi`.
Obiettivo: dal primo avvio a "Oggi" in **~90 secondi** (stima, da misurare).

### Oggi (home)
```
┌──────────────────────────────┐
│ [sprite idle]   Ser Valdo    │
│  "balloon con frase del dì"  │
│  Lv 7 · Capitano             │
│  ▓▓▓▓▓▓░░░░  312/425 XP      │
│  streak 12 · scudi 1         │
├──────────────────────────────┤
│  OGGI                  2/3   │
│  [x] Allenamento 20 min +10  │
│  [x] Letto rifatto      +10  │
│  [ ] Gesto gentile      +10  │
├──────────────────────────────┤
│  SETTIMANA             1/2   │
│  [ ] Chiama un amico   0/1   │
│  MESE                        │
│  [ ] Libro finito      0/1   │
├──────────────────────────────┤
│  Oggi  Missioni  Eroe  ···   │
└──────────────────────────────┘
```
Completare: animazione check, "+10 XP" che sale, haptics, SFX, barra XP che si riempie. Al level-up: modale con fanfara, nuovo livello, titolo/tier se cambia, capitolo sbloccato.

### Missioni
Tab daily/weekly/monthly. Crea/modifica in bottom sheet (titolo, icona, difficoltà, periodo, target). Riordino drag. Archivia (soft delete). Mostra il tetto raggiunto con messaggio chiaro.

### Eroe
Scheda personaggio: sprite, titolo, storia a **capitoli** (bloccati con lucchetto fino al livello), statistiche (streak attuale/migliore, missioni completate, XP totali), timeline dei tier. **Cambia eroe** (griglia degli 8, conferma con testo "il tuo livello resta tuo") e **Rifai il quiz**.

### Impostazioni
Notifiche (on/off, orari, tipi), inizio giorno, suono, haptics, lingua, Esporta/Importa, Privacy, Account (Fase 3), Elimina tutti i dati locali.

### Statistiche (Fase 4)
Heatmap ultime 12 settimane a quadratini pixel, totale per periodo, record di streak.

---

## 11. Account e sync (Fase 3, opzionale)

**Principio:** l'app resta pienamente utilizzabile senza account. Registrarsi = "voglio i miei dati su più dispositivi e al sicuro".

**Auth:** Firebase Auth con email/password + Google + Apple. Su nativo i login social richiedono un plugin nativo (es. `@capacitor-firebase/authentication`, da verificare): i popup web nel WebView sono inaffidabili. **Se su iOS offri Google, devi offrire anche Sign in with Apple** (o equivalente a tutela privacy, linea guida 4.8, da verificare).

**Dati (Firestore):**
```
users/{uid}/profile/main
users/{uid}/quests/{questId}
users/{uid}/completions/{questId_periodKey}
users/{uid}/xpEvents/{eventId}
```
- `xpEvents` e `completions` hanno id deterministici/ULID → l'unione tra dispositivi è **idempotente** (niente conflitti reali). `quests` e `profile`: **last-write-wins** per `updatedAt` con tombstone (`archivedAt`).
- Sync = **outbox locale** (coda di modifiche) + pull incrementale `where updatedAt > lastSyncAt`. La fonte di verità resta lo stato locale; Firestore è una replica. Non affidarsi alla persistenza offline di Firestore come store principale.
- **Primo login:** unione locale ∪ remoto per id, mai sovrascrittura cieca; mostrare un riepilogo prima di confermare.

**Regole di sicurezza (punto di partenza, da irrobustire con validazione dei campi):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

**Costi (stima, da verificare sulla pagina prezzi):** il piano gratuito di Firestore ha quote giornaliere dell'ordine di decine di migliaia di letture e ~20k scritture (valori da verificare). Un utente attivo fa ~10 scritture/giorno (completamento + evento XP + profilo) → ordine di **~2.000 utenti attivi al giorno** prima di toccare la quota di scrittura (stima grossolana). Il design è **tutto client-side**: niente Cloud Functions (che richiedono il piano a consumo, da verificare).

**Eliminazione account:** obbligatoria in-app se si permette la registrazione (linea guida 5.1.1(v), da verificare). Implementazione client-side: cancella i documenti sotto `users/{uid}` poi `deleteUser`.

---

## 12. Privacy e conformità store

- **Nessun tracking/analytics nell'MVP** (D13). Se in futuro entrano analytics: consenso esplicito.
- **Privacy policy** pubblica (anche una pagina statica) richiesta da entrambi gli store. Con account: indicare email, dati salvati, finalità, come eliminarli; GDPR (titolare, diritti, cancellazione).
- **Google Play:** modulo *Data safety*; verificare livello API target richiesto; se l'account sviluppatore è personale e recente, potrebbe valere l'obbligo di closed testing con un numero minimo di tester per un periodo minimo (da verificare).
- **App Store:** nessuna notifica obbligatoria per usare l'app; niente richieste di permesso al primo avvio; descrizione onesta di cosa fanno le notifiche.
- Icone/arte/suoni: tenere traccia delle licenze (font OFL, eventuali SFX/asset terzi). Non usare asset di marchi o personaggi esistenti.

---

## 13. Piano a fasi e criteri di accettazione

Le stime di tempo sono **(stima)**, assumendo uso intensivo di Claude Code.

### Fase 0 — Fondamenta (~1 sessione)
Nuxt 4 + Tailwind 4 + Nuxt UI (override) + i18n + Pinia + Capacitor (Android) inizializzati; font self-hosted; token di design; componenti `Pixel*` base e pagina `/kit` che li mostra tutti; sprite placeholder generati; deploy PWA su Vercel.
**Accettazione:** `pnpm dev`, `typecheck`, `lint`, `test`, `generate` verdi; `/kit` mostra bottoni, card, barra, sprite animato degli 8 placeholder; build Android debug si avvia su emulatore/dispositivo.

### Fase 1 — Core locale (MVP giocabile, ~2–3 weekend)
`core/` con test (xp, levels, periods, streak, quiz); store + persistenza + migrazioni + Zod; onboarding completo col quiz; Oggi; CRUD missioni con tetti; completa/annulla; level-up; Eroe (cambio, rifai quiz, capitoli); Impostazioni base; Esporta/Importa.
**Accettazione:** vedi *Definition of Done* qui sotto.

### Fase 2 — Nativo (~1 weekend)
Notifiche locali (piano deterministico + adapter), permesso contestuale, haptics, SFX, lifecycle app (rollover giorno e re-plan al resume), icona/splash.
**Accettazione:** su device Android reale: promemoria mattina/sera arrivano all'ora giusta nella voce dell'eroe; completando tutte le daily la serale di oggi sparisce; dopo riavvio telefono il piano è riprogrammato all'apertura; rifiutando il permesso l'app funziona.

### Fase 3 — Account e sync (~1–2 weekend)
Firebase Auth (email, Google, Apple) + Firestore con outbox, merge al primo login, eliminazione account, privacy policy.
**Accettazione:** due dispositivi convergono senza perdere completamenti; offline → online sincronizza; account eliminato = dati remoti rimossi; senza account tutto invariato.

### Fase 4 — Rifinitura e rilascio
Statistiche/heatmap, traguardi, personaggi sbloccabili, **arte vera** (sostituire i placeholder), build iOS (TestFlight), asset store, closed testing Play, inglese. **Prima di investire sull'arte:** analisi competitor aggiornata e 5–10 persone che lo usano per 2 settimane.

### Definition of Done — MVP (fine Fase 1)
- Primo avvio → quiz → eroe → prime missioni → Oggi, senza account e senza rete.
- Completare/annullare aggiorna XP, livello, streak, bonus e persiste dopo aver chiuso l'app.
- Cambio giorno alle 04:00 corretto (test con orologio simulato, incluso DST).
- Cambiare eroe non altera XP/livello/streak.
- Stato corrotto o import non valido non cancella i dati esistenti.
- Copertura test su `core/` ≥ 90% (obiettivo); nessuna stringa utente fuori da `i18n/`.
- Funziona come PWA su Vercel e come build Android debug.

---

## 14. Rischi (valutazione onesta)

1. **Arte = collo di bottiglia.** L'app vive di look. Gli sprite generati da AI tendono a non rispettare una vera griglia di pixel e vanno ripuliti a mano; asset da pack gratuiti vanno controllati per licenza; la commissione ha un costo da preventivare (non stimato qui). Mitigazione: placeholder in Fase 0, overlay condivisi per i tier.
2. **Retention.** Mercato affollato e abbandono alto nelle prime settimane. Le leve di questo design (level-up rapidi, storia a capitoli, voce nelle notifiche, niente colpevolizzazione, scudi streak) sono ipotesi: vanno testate con persone reali, non date per buone.
3. **Percezione "web in un guscio".** Una WebView può sembrare poco nativa (scroll, safe area, tastiera). Mitigazione: safe-area ovunque, no overscroll, haptics, transizioni sobrie.
4. **Affidabilità notifiche su Android** (risparmio energetico dei produttori). Mitigazione: re-plan a ogni apertura, test su più marche, nessuna funzione che dipenda *solo* dalla notifica.
5. **Bilanciamento XP** è tutto in stima. Tenere costanti in un unico file (`core/xp.ts`) e loggare in locale la distribuzione per tararla.
6. **Policy store e quote Firebase** cambiano: ogni "(da verificare)" va controllato alla fonte prima della Fase 3/4.

---

## Appendice A — Tabella livelli (`xpToNext = round(50 · L^1.1)`)

Giorni stimati: 100% = 49,3 XP/giorno · 70% = 34,5 XP/giorno (stima, utente tipico della sezione 7).

| Lv | XP per il livello successivo | XP cumulativi per raggiungere Lv | Giorni @100% | Giorni @70% |
|---:|---:|---:|---:|---:|
| 1 | 50 | 0 | 0 | 0 |
| 2 | 107 | 50 | 1 | 1 |
| 3 | 167 | 157 | 3 | 5 |
| 4 | 230 | 324 | 7 | 9 |
| 5 | 294 | 554 | 11 | 16 |
| 6 | 359 | 848 | 17 | 25 |
| 7 | 425 | 1207 | 24 | 35 |
| 8 | 492 | 1632 | 33 | 47 |
| 9 | 561 | 2124 | 43 | 62 |
| 10 | 629 | 2685 | 54 | 78 |
| 11 | 699 | 3314 | 67 | 96 |
| 12 | 769 | 4013 | 81 | 116 |
| 13 | 840 | 4782 | 97 | 138 |
| 14 | 911 | 5622 | 114 | 163 |
| 15 | 983 | 6533 | 132 | 189 |
| 16 | 1056 | 7516 | 152 | 218 |
| 17 | 1128 | 8572 | 174 | 248 |
| 18 | 1202 | 9700 | 197 | 281 |
| 19 | 1275 | 10902 | 221 | 316 |
| 20 | 1349 | 12177 | 247 | 353 |

(I giorni non includono i bonus dei traguardi streak, che accelerano leggermente.)
