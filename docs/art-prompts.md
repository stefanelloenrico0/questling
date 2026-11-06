# Prompt per generare gli 8 eroi (opzione "strumento di immagini")

Per Midjourney, Leonardo, Adobe Firefly, Ideogram, DALL·E / ChatGPT, Flux, ecc. I prompt sono in inglese perché funzionano meglio. **Controlla i termini d'uso commerciale** dello strumento e del piano che usi (alcuni piani gratuiti non permettono l'uso commerciale) e conserva la prova (schermata/data).

## 1. Prompt di stile (da mettere SEMPRE all'inizio di ogni eroe)

```
Flat vector illustration of a cute chibi fantasy character, full body, front view, standing idle pose, big head (about one third of the total height), simple rounded shapes, soft gradient shading, no outlines or only a very thin darker-tone outline, clean flat colors with subtle highlights, friendly expressive face with large glossy eyes and blush cheeks, modern mobile game mascot style, polished and appealing, centered, isolated on a plain solid flat background of pure magenta (#FF00FF), no text, no watermark, no ground, no scene, 4:5 aspect ratio, high resolution
```

**Negative prompt** (dove supportato, es. Leonardo, Flux, Stable Diffusion):

```
pixel art, 8-bit, retro, photorealistic, 3D render, heavy black outlines, text, logo, watermark, background scenery, multiple characters, cropped, cut off, extra limbs, deformed hands, blurry
```

Midjourney: aggiungi `--ar 4:5 --style raw --no pixel art, text, background`. Lo sfondo magenta unito serve per **toglierlo facilmente** (vedi §4).

## 2. I personaggi (aggiungi questa riga al prompt di stile)

Mantieni lo stesso schema per tutti: *"[PROMPT DI STILE]. Character: …"*. Il **colore d'accento** è quello dell'app per quell'eroe: usalo come colore dominante.

1. **Ser Valdo** (cavaliere valoroso, accento azzurro `#41a6f6`)
   `Character: a brave young knight, steel helmet with a red plume and an open face, blue tabard over silver-blue plate armor with gold details, a round blue shield with a visible dent held on the left arm, a sword raised in the right hand, proud and slightly over-the-top solemn expression.`

2. **Kuro** (ninja, "l'Ombra", accento grigio-argento `#94b0c2`)
   `Character: a small stealthy ninja girl, midnight navy suit with a hood and mask leaving only the eyes visible, a long red scarf flowing behind her, a short katana on the back, calm and laconic look.`

3. **Fenna** (ranger dei boschi, accento verde `#38b764`)
   `Character: a sarcastic forest ranger, green hooded cloak, orange hair in a side braid, a bow on the shoulder and a small quiver, leather boots and satchel, confident smirk.`

4. **Zeffiro** (stregone distratto, accento ciano `#73eff7`)
   `Character: an absent-minded old wizard, tall purple pointed hat bent at the tip with a gold band and a star, long white beard and bushy eyebrows, purple robe with golden stars, a wooden staff topped with a glowing cyan crystal, one hand waving, dreamy forgetful expression.`

5. **Lumen** (custode della quiete, accento oro `#ffcd75`)
   `Character: a gentle calm cleric, long white and gold robe, a soft glowing halo above the head, a staff holding a small warm lantern, kind serene smile, closed or half-closed eyes.`

6. **Rondò** (bardo girovago, accento arancio `#ef7d57`)
   `Character: a theatrical wandering bard, wide feathered hat, orange jacket with a short cape, a lute, a showman pose with a charming grin.`

7. **Unità 404** (robot da cabinato arcade, accento lime `#a7f070`)
   `Character: a cute retro arcade-cabinet robot, boxy gray metal body, a square screen face glowing lime green showing simple eyes, one bent antenna, small arcade buttons on the chest, deadpan expression.`

8. **Brunilde** (nana fabbra, accento rosa `#e8707f`)
   `Character: a gruff but affectionate dwarf blacksmith woman, short and sturdy, orange braids, a soot-gray beard-like scarf, a dark red leather apron, a big hammer on the shoulder, warm grumpy smile.`

## 3. Come mantenerli coerenti (la cosa più importante)

1. Genera **per primo Zeffiro** (o Valdo) finché ti piace davvero.
2. Per tutti gli altri usa quell'immagine come **riferimento di stile**: Midjourney `--sref <url>`, Leonardo *Style Reference*, Firefly *Style Reference*, ChatGPT/DALL·E "usa lo stesso stile di questa immagine".
3. Stesso seed/modello/impostazioni per tutti, stessa inquadratura.
4. Genera 4 varianti per eroe e scegli la migliore; ritocca (mani, occhi) con l'editing dello strumento.

## 4. File da consegnare

- Un PNG per eroe con **sfondo trasparente**: togli il magenta con remove.bg, Photopea/Photoshop ("rimuovi sfondo") o Firefly.
- **Stessa tela e stessa scala** per tutti: 1024×1280 px, personaggio centrato, alto circa l'85% della tela, piedi a circa l'8% dal bordo basso, margine su tutti i lati (niente tagli).
- Nomi: `valdo.png`, `kuro.png`, `fenna.png`, `zeffiro.png`, `lumen.png`, `rondo.png`, `u404.png`, `brunilde.png` in una cartella.
- Facoltativo, per l'animazione "festa": `valdo-happy.png` ecc. (braccia alzate, occhi chiusi sorridenti). Con la posa sola ci pensa l'app (saltello e scintille).

Quando li hai, dammi la cartella e li integro (oggi `HeroArt` usa gli SVG in `app/assets/heroes`; per i PNG aggiungo il supporto in pochi minuti).

## 5. Altri due prompt utili

**Icona dell'app** (usa lo stesso riferimento di stile):
```
App icon, the face and pointed hat of the cute wizard mascot (purple hat, white beard, glowing cyan crystal), centered on a deep navy blue rounded-square gradient background, flat vector, soft shading, bold simple shapes readable at 48 px, no text
```

**Immagine di apertura (splash)**:
```
Flat vector illustration, the eight cute chibi fantasy heroes (knight, ninja, ranger, wizard, cleric, bard, retro robot, dwarf blacksmith) standing together in a friendly group, deep navy night background with soft stars, same art style as the reference, no text, 9:16
```

## 6. Attenzione alla proprietà intellettuale

Non scrivere nei prompt nomi di personaggi, film o marchi ("come Gandalf", "stile Zelda"): rischi somiglianze troppo forti. Non usare opere di artisti viventi per nome. Se un risultato somiglia a un personaggio noto, scartalo.
