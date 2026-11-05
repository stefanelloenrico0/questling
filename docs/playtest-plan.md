# Piano di playtest (5–10 persone, 14 giorni)

Obiettivo (spec §13, Fase 4): capire se il design aggancia **prima di investire nell'arte**. L'app non ha analytics (D13), quindi le metriche vengono da **backup inviati volontariamente** e da un breve questionario.

## 1. Chi e come

- **5–10 persone** che non siano solo amici stretti compiacenti; almeno 2–3 che non conoscono il progetto. Meglio un mix di profili (chi usa già app di abitudini, chi no).
- **Come distribuire**
  - **PWA** (subito): link del sito (`https://questling-hazel.vercel.app`); su Android Chrome → *Aggiungi a schermata Home*. ⚠️ Nella PWA **le notifiche non funzionano** (sono solo del build nativo): chi la usa testa il gioco ma non i promemoria.
  - **Android**: closed testing su Google Play (o APK debug/AAB firmato per gli amici). Qui si testano anche le notifiche. Vedi `docs/release-android.md`.
  - iOS: TestFlight solo dopo la build su Mac (`docs/release-ios.md`).
- Dire ai tester: *"usala come se fosse tua per due settimane, non devi farla bene"*. Niente istruzioni su come usarla: l'onboarding deve bastare.

## 2. Cosa misurare

Da ogni **backup** (Impostazioni → Esporta backup), lanciando `node scripts/analyze-backup.mjs backup.json`:

| Metrica | Cosa dice | Soglia di attenzione (ipotesi) |
|---|---|---|
| `day1` | è tornato il giorno dopo? | meno della metà dei tester |
| `day7` | è ancora attivo al giorno 7? | meno di 1 su 3 |
| `activeFirstWeek` / `activeSecondWeek` | calo tra prima e seconda settimana | seconda settimana < metà della prima |
| `activeShare` | quota di giorni attivi | < 40% |
| `bestStreak` | quanto regge la serie | molti fermi a 2–3 giorni |
| `questsActive` / `questsArchived` | le missioni sono sostenibili o le abbandonano? | molte archiviate nei primi giorni |
| `xpPerActiveDay`, livello raggiunto | bilanciamento XP (rischio 5 della spec) | livello 3 troppo presto o fermo a 1 |
| `notificationsEnabled` | accettano i promemoria? | pochi |

Le soglie sono **ipotesi**: servono a decidere cosa guardare, non a "passare un esame". Il benchmark generico di settore sul giorno 30 è nell'ordine di una cifra bassa/media (`docs/competitor-analysis.md`).

## 3. Questionario (5 domande, a fine settimana 2)

1. Hai usato l'app quasi ogni giorno? Se no, cosa ti ha fatto smettere?
2. Qual è il **personaggio** che ti è capitato? Ti somigliava? Lo hai cambiato?
3. Hai letto qualche notifica/frase dell'eroe che ti ha fatto sorridere o infastidire? Quale?
4. Cosa non hai capito o ti ha frenato nei primi 5 minuti?
5. La useresti ancora tra un mese? Perché sì/no? Pagheresti qualcosa (per cosa)?

Aggiungere una domanda sull'**arte** (voto 1–5 e "cosa cambieresti"): serve a decidere quanto investire.

## 4. Come decidere

- **Va bene** → si investe nell'arte (rifare gli 8 sprite + 4 overlay), poi closed testing Play/TestFlight.
- **Si ferma presto** → capire *dove*: onboarding (giorno 0–1), carico di missioni (archiviazioni), ricompensa (livelli troppo lenti), assenza di notifiche. Correggere **prima** dell'arte.
- Annotare i risultati qui sotto, con data.

| Tester | Piattaforma | day1 | day7 | Giorni attivi/14 | Note |
|---|---|---|---|---|---|
| | | | | | |
