# Brief grafico per un generatore di temi / moodboard

Da incollare in un generatore (Midjourney, Galileo/Stitch, Figma AI, v0, Uizard, ecc.). Poi mandami le immagini: moodboard, palette, schermate, tutto ciò che esce. Io le traduco nell'app (Nuxt/Vue + Tailwind, mobile first).

## Il prompt

```
Design a premium visual identity and mobile UI for "Questling", a habit-tracking app disguised as a small role-playing adventure. Mobile first (390 px wide), iOS and Android. Provide THREE clearly different art directions (A, B, C) so I can pick one.

WHAT THE APP IS
Questling turns daily, weekly and monthly goals into "quests". The user picks (or is matched by a short personality quiz to) a companion hero with its own voice, story and personality. Completing quests gives XP, levels, streaks (with "shields" that forgive a missed day) and unlocks story chapters, new titles and new heroes. The hero writes the reminders in its own voice, with humour, never scolding. The feeling: a warm, witty, trustworthy companion that makes a boring routine feel like a journey. Not a gamified to-do list full of badges and noise; a calm, beautiful product that happens to have a hero.

AUDIENCE
Adults 20-45 who tried habit trackers and found them cold or childish. They want something that feels crafted and a little magical, like a well-made indie game or a premium wellbeing app (think the polish of Finch, Alto's Odyssey, Monument Valley, Headspace, Things 3, Linear), not a kids' game and not corporate software.

TONE / PERSONALITY
Premium, warm, characterful, calm confidence, gentle humour. Rich but restrained. Atmosphere over decoration. Soft depth, tactile surfaces, considered motion. No guilt, no aggression, no neon gamer clichés.

DIRECTIONS TO EXPLORE (make A, B, C genuinely different, for example)
A) Night-sky storybook: deep, luminous dark mode, glowing accents, painterly gradients, a sense of lantern light.
B) Warm paper and ink: a light, tactile, hand-crafted feel with a beautiful dark counterpart, editorial typography.
C) Soft modern game UI: glassy or clay-like layered surfaces, generous rounded shapes, playful but refined.
Each direction must work in dark mode; say whether it also has a light mode.

WHAT TO DELIVER FOR EACH DIRECTION
1. Moodboard (textures, lighting, materials, reference imagery).
2. Colour palette with hex values: background layers, surfaces, text levels, success/warning/danger, XP/gold, plus the system for tinting the UI with a per-hero accent colour.
3. Typography: a display face and a body face (Google Fonts only), sizes and weights for title, heading, body, caption, numbers.
4. Shape language: corner radii, borders, shadows or glows, spacing rhythm, icon style (line weight, fill).
5. Key components: primary and secondary button (idle, pressed, disabled), quest row with checkbox (done / not done), progress bar for XP, stat chip (streak, shields), bottom tab bar (4 tabs), segmented control, toggle, modal, toast, text field.
6. High-fidelity mockups of these screens, 390 x 844:
   - Welcome / splash, with the lineup of heroes
   - Onboarding: 3 intro slides, the personality quiz (question card with 4 answers), the hero reveal (affinity %, nearest alternatives), name, focus areas (6 tiles, choose up to 3), first quests checklist, "your rhythm" (two time pickers + a day-end selector), notification permission in the hero's voice, "all set" summary
   - Today: hero header (hero, speech bubble with the hero's line of the day, level and title, XP bar, streak and shields), then quest sections Daily / Week / Month with check rows
   - Quests: list per period with reorder, and the "new quest" bottom sheet (title, icon grid, difficulty, period, times per period)
   - Hero: portrait, voice, story in 5 chapters (locked chapters with a padlock), titles timeline (5 tiers), stats, and the "change hero" picker including locked "mystery hero" silhouettes
   - Stats: 12-week heatmap, totals, achievements (reached / locked)
   - Settings: grouped cards (language, day start, notifications, sound, data, privacy)
   - Level-up celebration modal, and "new hero unlocked" modal
   - A local notification as it appears on the lock screen, in the hero's voice

HARD CONSTRAINTS
- There are 11 heroes (knight, ninja, forest ranger, absent-minded wizard, gentle cleric, wandering bard, arcade-cabinet robot, dwarf blacksmith, pirate, philosopher slime, little fire dragon). Each has its own accent colour (blue, silver, green, cyan, gold, orange, lime, pink, teal, violet, red). The interface must stay beautiful and legible when tinted with ANY of them, so show the same screen with two or three different hero accents.
- Hero illustrations are separate artwork. Leave clear, well-composed slots for a full-body character (about 3:4 portrait) and design the UI so a flat vector chibi hero and a more painterly one would both fit. Do not redraw the heroes.
- Dark mode is required. Text contrast WCAG AA at least. Touch targets 48 px or more. Respect reduced motion.
- Must be implementable with plain CSS/Tailwind, SVG and a bundled icon set (Lucide style). No heavy photography, no video backgrounds.
- Languages: Italian and English, so allow for text about 30% longer than English in buttons and labels.
- Offline-first and privacy-friendly: no social features, no leaderboards, no ads, no feeds.

AVOID
Generic purple-to-blue gradients on white, cream-and-terracotta "AI" look, Inter-only typography, emoji as icons, cartoonish badges everywhere, loud neon, cluttered dashboards, glassmorphism overload, pixel art or retro 8-bit.

MOTION (describe briefly)
One signature interaction (the quest check), level-up, hero reveal, screen transitions. Calm, springy, never flashy.
```

## Cosa mandarmi

- Le immagini della direzione che ti piace di più (anche più di una, se ti piacciono pezzi diversi).
- Se il generatore dà palette e font, copiali (nomi dei font o esadecimali).
- Se puoi, due o tre schermate chiave: Oggi, onboarding (rivelazione eroe) e scheda Eroe.
- Una riga su cosa ti piace e cosa no: mi serve più dei dettagli.

## Direzione scelta: A, Night-Sky Storybook

Scelta dal manuale grafico (PDF `Questling_Complete_Design_Handbook.pdf`, non nel repository). Applicata finora:
- token di colore, spaziatura e raggi in `app/assets/css/main.css` (bordi dei controlli a 3:1, non a 1,5:1 come nel PDF);
- Cormorant Garamond (titoli da 24 px in su) e Source Sans 3 (testo e interfaccia), incorporati con `@fontsource`;
- accenti degli 11 eroi (versione per tema scuro) in `data/characters.ts`;
- barra in basso Oggi / Missioni / Eroe / Statistiche, Impostazioni dall'ingranaggio in alto;
- paesaggio notturno in SVG (`NightScene.vue`) in splash, intro e scheda Eroe.

Anche fatto: gli avvisi di streak sono riscritti in tono gentile (11 eroi, 2 lingue), come chiede il manuale.

Da fare: tema chiaro e illustrazioni degli eroi in stile pittorico (si sostituiscono dietro `HeroArt` senza toccare l'interfaccia).
