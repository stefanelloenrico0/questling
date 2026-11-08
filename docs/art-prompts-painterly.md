# Prompt per gli eroi e le scene, stile "Night-Sky Storybook" dipinto

Stile delle tavole del manuale (direzione A). Modello: GPT Image 2.6 (`gpt_image_2_6`), 3:4, 2k, qualità alta, sfondo trasparente per gli eroi. Genera prima Zeffiro, approvalo, poi usalo come riferimento di stile per gli altri.

## Stile comune (all'inizio di ogni eroe)

```
Painterly storybook character illustration for a premium mobile game, semi-realistic stylized proportions (head about one fifth of body height), expressive friendly face, rich soft brushwork with visible painterly texture, warm lantern light from the front and a cool moonlight rim light from behind, deep midnight-blue and gold colour harmony, readable silhouette, consistent detail level across the roster, full body, front three-quarter view, standing idle pose, centered with a 8% margin on all sides, single character only, no text, no logo, no frame, no ground, no scene
```

## I personaggi (identità invariate rispetto all'app)

1. valdo, cavaliere: young knight, steel-blue plate armour with gold trim, helmet with a red plume and open face, round blue shield with a visible dent, sword at rest, proud and slightly over-solemn expression.
2. kuro, ninja: small stealthy ninja, midnight-navy suit with hood and face wrap leaving only the eyes, long red scarf, short katana on the back, calm laconic look.
3. fenna, ranger: sarcastic forest ranger, green hooded cloak, orange hair in a side braid, bow on the shoulder, small quiver, leather satchel, confident smirk.
4. zeffiro, mago: absent-minded old wizard, tall dusky-purple pointed hat bent at the tip with a gold band and star, long white beard, bushy eyebrows, violet robe with tiny gold stars, wooden staff with a glowing cyan crystal, one hand waving, dreamy kind expression.
5. lumen, chierica: gentle cleric, long white and gold robe, soft glowing halo above her head, staff holding a small warm lantern, serene smile, half-closed eyes.
6. rondo, bardo: theatrical wandering bard, wide-brim hat with a feather, orange jacket with a short cape, a lute, showman pose, charming grin.
7. u404, robot: charming retro arcade-cabinet robot, boxy grey-blue metal body, square screen face glowing lime green with simple eyes, one bent antenna, little arcade buttons on the chest, deadpan.
8. brunilde, fabbra: gruff but affectionate dwarf blacksmith woman, short and sturdy, orange braids, soot-grey scarf, dark red leather apron, big hammer on the shoulder, warm grumpy smile.
9. salmastro, pirata: soft-hearted pirate captain, tricorn hat with skull and a teal feather, eyepatch, brown beard, teal captain coat, parrot on the shoulder, brass spyglass in one hand.
10. plin, slime: philosopher slime, glossy lilac jelly body with soft inner glow, round golden glasses, thoughtful face, a small glowing lightbulb floating beside, a scroll under one tiny arm.
11. brace, drago: cheerful little red dragon, warm honey belly, small wings, small horns, a flame on the tip of the tail, big friendly eyes, playful stance.

Esempio di comando (da adattare con il percorso del riferimento):

```
higgsfield generate create gpt_image_2_6 --prompt "<STILE COMUNE>. Character: <riga del personaggio>" --aspect_ratio 3:4 --resolution 2k --quality high --background transparent --output_format png --wait
```

Per gli altri: aggiungi `--image <zeffiro.png>` e nel prompt "same painterly style, lighting and proportions as the reference image".

## File da produrre

- `app/assets/heroes/art/hero_<id>_full.webp` (o `.png`), 900×1200, alpha. Con il file presente `HeroArt` lo usa da solo.
- L'avatar e la sagoma "eroe misterioso" si ricavano da questa stessa immagine (ritaglio e filtro): non servono file separati.

## Scene (sfondi)

Formato 3:2 salvo diversa indicazione, nessun testo, nessun personaggio in primo piano. Cartella: `app/assets/scenes/`.

- `splash.webp`: `Painterly night landscape, huge pale moon, a fairytale castle with lit golden windows on distant hills, layered mountains and pine forest, a golden path winding toward the castle, deep midnight blue and soft violet sky with stars, warm lantern glow, storybook mood, no text` (taglio alto, 9:16 se possibile).
- `intro-1.webp`: `Painterly: a golden path winding through a moonlit valley toward a distant castle, fireflies, deep blue night, storybook`
- `intro-2.webp`: `Painterly: a glowing four-pointed gold star over a night forest, stars, soft magical light, storybook`
- `intro-3.webp`: `Painterly: a cosy campfire clearing in a night forest, warm light on pine trunks, moon above, storybook`
- `hero-banner.webp`: `Painterly: moonlit forest clearing with a soft circular glade of light in the center (empty, for placing a character), pine silhouettes, stars, storybook`

## Prima di usarle

- Controlla che nessuna immagine somigli a personaggi noti: scartala se succede.
- Sul piano di prova controlla i termini d'uso commerciale prima di pubblicare l'app.

## Come sono state generate quelle in uso (novembre 2026)

- Modello `gpt_image_2_6`, 3:4, 2k, qualità alta, `background: transparent`. Costo: 2,75 crediti ciascuna.
- Riferimenti di stile: la striscia «11 Heroes» ritagliata dal PDF `Questling_Complete_Design_Handbook.pdf` e il primo Zeffiro approvato. Senza riferimenti il modello produce pitture più realistiche e rustiche, lontane dalle tavole.
- Dal secondo giro in poi vanno entrambi i riferimenti (`image_references`).
- Plin: serve scrivere «Absolutely no hat, no clothing, no robe, no legs», altrimenti il modello lo veste da mago.
- Il fondo trasparente del modello lascia un alone sporco: lo strumento «remove background» di Higgsfield lo pulisce, ma sulle immagini in uso il ritaglio era già buono dopo il secondo tentativo.
- Conversione: `PNG 1744×2336 → WebP 900×1200` con ritaglio sul contorno, stessa scala per tutti e piedi sulla stessa linea di base (circa 200 KB l'uno). Le scene sono WebP da 1200×900 (schermata iniziale), 1280×720 (introduzioni) e 1200×800 (fondale eroe).
- Le immagini originali restano nella libreria Higgsfield dell'account.

Per cambiare un eroe: rigenera, converti e sostituisci `app/assets/heroes/art/hero_<id>_full.webp`.
