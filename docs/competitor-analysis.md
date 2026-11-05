# Analisi competitor (novembre 2026)

> **Cosa è e cosa no.** Ricerca web fatta il 5 novembre 2026 per la richiesta della spec (§1, §13 Fase 4): *"analisi competitor aggiornata prima di investire sull'arte"*. È una **prima mappatura**, non una verifica sugli store: le fonti sono in gran parte aggregatori, blog e schede app di terzi, che si contraddicono su prezzi e numeri. **Non ho aperto le pagine ufficiali di App Store / Google Play**: prima di prendere decisioni economiche vanno controllate lì. Dove il dato è incerto lo dico.

## 1. Il quadro in una riga

La nicchia "habit tracker gamificato con personaggio pixel-art" è **affollata di app piccole e nuove** accanto a due grandi nomi (Habitica per l'RPG, Finch per il compagno "cozy"). Il pixel-art da solo **non** distingue: lo fanno in molti. Quello che si vede dalle schede è che il prodotto lo vende l'**arte** e la **sensazione di compagnia**.

## 2. Chi c'è

| App | Cosa è (secondo le fonti) | Modello | Note |
|---|---|---|---|
| **Habitica** | Il riferimento: abitudini/daily/to-do come RPG con avatar pixel-art, equipaggiamento, mostri, party e gilde. | Gratis completo; abbonamento (~$4,99/mese secondo alcune fonti, altre dicono di più: **da verificare su habitica.com**) per cosmetici, gemme, niente pubblicità. Chi paga non progredisce più in fretta. | Critiche ricorrenti: la perdita di salute per le daily saltate stressa alcuni utenti; promemoria più deboli delle app dedicate; tono "infantile" per chi non ama pixel-art/dungeon. |
| **Finch** | Compagno virtuale ("pet") per self-care, non pixel-art. | Gratis + acquisti in-app (la scheda Apple riporta 9 acquisti da $7,99 a $39,99; stime blog diverse). | Voto ~4,9 su store; Google Play "10M+ installazioni" (cifre variabili tra fonti). Riferimento per **tono gentile e retention emotiva**. |
| **Habit Hunter** | RPG habit tracker per iOS. | Gratis. | In una scheda: 4,6 su 780 voti; alcune recensioni lo dicono "macchinoso". |
| **Habicat** | Pixel-art, il personaggio si rafforza con le abitudini (iOS/iPad). | n/d | "Editor's Choice" su App Store ma 0 voti nella scheda trovata. |
| **Nudge Habit Tracker** | Drago pixel-art che cresce (iOS/iPad), uscita aprile 2026. | n/d | 3 voti: non provata. |
| **Pixelio** | Android, XP e monete fanno salire un personaggio pixel. | Gratis | Nella scheda: "niente investitori, pubblicità o tracciamento invasivo". |
| **Streakhunter** | Pixel RPG habit tracker, Android-first, in beta chiusa. | Gratis | Segnale: **altri indie stanno facendo la stessa cosa adesso**. |
| **Productivitism** | iOS+Android: personaggi pixel per ruoli di vita, abitudini come quest. | Gratis (early access) | |
| **QuestPet** | iPhone: animaletti pixel che crescono con quest personalizzate. | n/d | |
| **Oscar: Pixel Habit Tracker** | iOS/iPad: ogni log riempie un pixel di un'immagine, una lontra reagisce ai traguardi. | n/d | **Senza account, funziona offline.** |

## 3. Cosa dice sulla retention

Non ho trovato un benchmark **specifico per habit tracker**. Le cifre generiche (blog di vendor, quindi con interessi commerciali e definizioni di "attivo" non omogenee):

- tutte le app: giorno 30 attorno al **5–7%**;
- salute e fitness: giorno 30 tra l'**8% e il 15%** a seconda della fonte;
- le serie (streak) sono la leva più citata, ma senza numeri affidabili.

**Conseguenza:** l'obiettivo realistico di un'app così è un "giorno 30" a una cifra bassa o media. Le ipotesi di retention del design (level-up rapidi, capitoli, voce, scudi) vanno misurate col playtest (`docs/playtest-plan.md`), non date per buone.

## 4. Dove Questling è distinto (ipotesi) e dove no

| Leva di Questling | Anche altri? | Valutazione |
|---|---|---|
| Habit tracker con personaggio pixel-art | **Sì, molti** | Non è un differenziatore. Conta la qualità dell'arte. |
| Local-first, senza account, offline | Oscar sì; Habitica no | Utile ma **non esclusivo**. Va comunicato bene. |
| Niente pubblicità/tracking | Pixelio lo dichiara | Idem: tavolo d'ingresso, non vantaggio. |
| **Voce dell'eroe nelle notifiche** (560 frasi, 8 personalità) | Non emerso dalla ricerca | **Candidato differenziatore.** Da verificare confrontando le notifiche reali dei concorrenti. |
| Storia a capitoli sbloccata dai livelli | Habitica ha lore sparsa | Possibile, dipende dalla scrittura. |
| Quiz che assegna l'eroe | Non emerso | Possibile. |
| **Italiano nativo** | **Non verificato** | Se i concorrenti non hanno localizzazione italiana è un vantaggio concreto di mercato. **Controllare negli store.** |
| Nessuna colpevolizzazione (scudi streak, Lumen) | Habitica penalizza le daily saltate | Allineato con la critica più ricorrente a Habitica. |

## 5. Rischi emersi

1. **L'arte decide.** Le schede dei concorrenti vendono lo stile. Con l'arte attuale (placeholder) non c'è competizione: è giusto rifarla **prima** del lancio pubblico, ma dopo aver validato il resto.
2. **Mercato in rapida crescita di cloni.** Diverse app nate nel 2026 con pochissimi voti: la nicchia si satura, la scoperta organica è difficile.
3. **Monetizzazione.** Habitica e Finch vivono di cosmetici/abbonamenti; D13 (gratis, senza pubblicità) è una scelta di semplicità ma non un modello di business.
4. **Dati poco affidabili.** Prezzi e numeri variano tra le fonti: non usarli in decisioni senza verifica.

## 6. Da fare per chiudere l'analisi (30–60 minuti, a mano)

- [ ] Cercare sull'**App Store italiano** e su **Google Play Italia**: "habit tracker", "abitudini", "gamification", "RPG abitudini", "pixel". Annotare per i primi 10 risultati: lingua dell'interfaccia, prezzo, voti, ultimo aggiornamento.
- [ ] Installare **Habitica** e **Finch** per una settimana: guardare **le loro notifiche** (tono, frequenza, colpevolizzazione) e l'onboarding.
- [ ] Leggere le recensioni a **1–3 stelle** di Habitica e Habit Hunter: sono la lista dei problemi da non ripetere.
- [ ] Confermare i prezzi sulle pagine ufficiali.

## Fonti consultate (tutte di terzi; vedi avvertenza)

- Habitica: [Toolradar – pricing](https://toolradar.com/tools/habitica/pricing), [scheda App Store via AppFollow](https://apps.appfollow.io/ios/habitica-gamified-taskmanager/994882113?country=au), [recensione 2026](https://crm.org/news/habitica-an-organizational-tool-for-retro-gamers), [Gappsy](https://gappsy.com/tools/habitica/)
- Panoramiche gamified/pixel: [AppsHunter – gamify tasks](https://appshunter.io/ios/topics/gamify-tasks), [Habit Hunter (AppFollow)](https://apps.appfollow.io/ios/habit-hunter-habit-tracker/1417258775?country=mx), [Nudge Habit Tracker](https://appshunter.io/ios/app/nudge-habit-tracker/id6761636953), [Habicat (App Store)](https://apps.apple.com/us/app/id6444766871), [Oscar: Pixel Habit Tracker (App Store)](https://apps.apple.com/app/id6766126900), [QuestPet (App Store)](https://apps.apple.com/mx/app/questpet/id6755695483), [Streakhunter (Product Hunt)](https://www.producthunt.com/@streakhunter), [Pixelio (Similarweb)](https://www.similarweb.com/zh-tw/app/google/com.luxstudio.pixelioapp/)
- Finch: [App Pricing Lab](https://apppricinglab.com/app/apple/1528595748), [FoxData](https://foxdata.com/en/blogs/finch-as-app-store-editors-choice-a-self-care-companion/), [Habitbox review](https://habitbox.app/blog/finch-app-review)
- Retention: [Braze](https://www.braze.com/resources/articles/mobile-app-retention), [AppStorys](https://appstorys.com/blog-Retention-Rates-Mobile-Apps-By-Industry), [Enable3](https://enable3.io/blog/app-retention-benchmarks-2025), [Appalize](https://www.appalize.com/blog/mobile-trends/app-retention-rate-benchmarks-by-category-in-2026)
