// Genera icone launcher, splash e icona di stato (Android) dai placeholder pixel-art.
// Uso: pnpm icons   (da rilanciare quando arriva l'arte vera: sostituisce solo i PNG/vector generati)
import { PNG } from 'pngjs'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RES = join(ROOT, 'android', 'app', 'src', 'main', 'res')
const BG = [0x1a, 0x1c, 0x2c]
const ACCENT = [0x41, 0xa6, 0xf6]
const GOLD = [0xff, 0xcd, 0x75]

// Sprite sorgente: primo frame (32x32) dell'idle di Ser Valdo
const sheet = PNG.sync.read(readFileSync(join(ROOT, 'public', 'sprites', 'valdo', 'idle.png')))
const FRAME = 32

function bbox() {
  let minX = FRAME, minY = FRAME, maxX = -1, maxY = -1
  for (let y = 0; y < FRAME; y++) {
    for (let x = 0; x < FRAME; x++) {
      if (sheet.data[(y * sheet.width + x) * 4 + 3] > 0) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
      }
    }
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}
const BOX = bbox()

function canvas(w, h, fill) {
  const png = new PNG({ width: w, height: h })
  for (let i = 0; i < w * h; i++) {
    png.data[i * 4] = fill ? fill[0] : 0
    png.data[i * 4 + 1] = fill ? fill[1] : 0
    png.data[i * 4 + 2] = fill ? fill[2] : 0
    png.data[i * 4 + 3] = fill ? 255 : 0
  }
  return png
}

function put(png, x, y, c) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return
  const i = (y * png.width + x) * 4
  png.data[i] = c[0]; png.data[i + 1] = c[1]; png.data[i + 2] = c[2]; png.data[i + 3] = 255
}

/** Disegna lo sprite con scala INTERA (nearest neighbor), centrato su (cx, cy). */
function drawHero(png, scale, cx, cy) {
  const left = Math.round(cx - (BOX.w * scale) / 2)
  const top = Math.round(cy - (BOX.h * scale) / 2)
  for (let y = 0; y < BOX.h; y++) {
    for (let x = 0; x < BOX.w; x++) {
      const i = ((BOX.y + y) * sheet.width + (BOX.x + x)) * 4
      if (sheet.data[i + 3] === 0) continue
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        put(png, left + x * scale + dx, top + y * scale + dy, [sheet.data[i], sheet.data[i + 1], sheet.data[i + 2]])
      }
    }
  }
}

const fitScale = (size, fraction) => Math.max(1, Math.floor((size * fraction) / Math.max(BOX.w, BOX.h)))

function sparkles(png, unit, cx, cy, spread) {
  // quattro scintille a croce, come l'overlay del tier 2
  for (const [dx, dy] of [[-1, -1], [1, -0.4], [-0.8, 1], [1, 1.1]]) {
    const x = Math.round(cx + dx * spread), y = Math.round(cy + dy * spread)
    for (const [ox, oy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
      for (let a = 0; a < unit; a++) for (let b = 0; b < unit; b++) put(png, x + ox * unit + a, y + oy * unit + b, ox === 0 && oy === 0 ? GOLD : [0xf4, 0xf4, 0xf4])
    }
  }
}

function write(path, png) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, PNG.sync.write(png))
}

const DENSITY = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }

// Launcher legacy (48dp), tondo e foreground adattivo (108dp, contenuto nella safe zone 66dp)
for (const [d, f] of Object.entries(DENSITY)) {
  const legacy = Math.round(48 * f)
  const sq = canvas(legacy, legacy, BG)
  const frame = Math.max(2, Math.round(legacy / 24))
  for (let i = 0; i < legacy; i++) for (let t = 0; t < frame; t++) { // cornice accent
    put(sq, i, t, ACCENT); put(sq, i, legacy - 1 - t, ACCENT); put(sq, t, i, ACCENT); put(sq, legacy - 1 - t, i, ACCENT)
  }
  drawHero(sq, fitScale(legacy, 0.66), legacy / 2, legacy / 2 + legacy * 0.03)
  write(join(RES, `mipmap-${d}`, 'ic_launcher.png'), sq)

  const round = canvas(legacy, legacy, BG)
  drawHero(round, fitScale(legacy, 0.6), legacy / 2, legacy / 2 + legacy * 0.03)
  const r = legacy / 2
  for (let y = 0; y < legacy; y++) for (let x = 0; x < legacy; x++) {
    if ((x + 0.5 - r) ** 2 + (y + 0.5 - r) ** 2 > r * r) round.data[(y * legacy + x) * 4 + 3] = 0
  }
  write(join(RES, `mipmap-${d}`, 'ic_launcher_round.png'), round)

  const adaptive = Math.round(108 * f)
  const fg = canvas(adaptive, adaptive, null)
  drawHero(fg, fitScale(adaptive, 0.5), adaptive / 2, adaptive / 2 + adaptive * 0.02)
  write(join(RES, `mipmap-${d}`, 'ic_launcher_foreground.png'), fg)
}

// Splash: stesse dimensioni dei file esistenti del template Capacitor (default, port-*, land-*)
const splashDirs = ['drawable', ...['port', 'land'].flatMap((o) => Object.keys(DENSITY).map((d) => `drawable-${o}-${d}`))]
for (const dir of splashDirs) {
  const file = join(RES, dir, 'splash.png')
  if (!existsSync(file)) continue
  const { width: w, height: h } = PNG.sync.read(readFileSync(file))
  const png = canvas(w, h, BG)
  const scale = fitScale(Math.min(w, h), 0.32)
  drawHero(png, scale, w / 2, h / 2)
  sparkles(png, Math.max(2, Math.round(scale / 2)), w / 2, h / 2, BOX.w * scale * 0.75)
  write(file, png)
}

// Master per gli store (Fase 4) e per tool esterni
const master = canvas(1024, 1024, BG)
drawHero(master, fitScale(1024, 0.62), 512, 530)
sparkles(master, 12, 512, 520, 330)
write(join(ROOT, 'resources', 'icon.png'), master)

// Icona di stato delle notifiche: MONOCROMATICA (solo alfa), scudo 8x8
const SHIELD = ['########', '########', '########', '########', '.######.', '..####..', '...##...', '........']
let d = ''
SHIELD.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') d += `M${x},${y}h1v1h-1z` }))
const vector = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="8"
    android:viewportHeight="8">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="${d}" />
</vector>
`
mkdirSync(join(RES, 'drawable'), { recursive: true })
writeFileSync(join(RES, 'drawable', 'ic_stat_questling.xml'), vector)

// Sfondo adattivo e colori del tema
writeFileSync(join(RES, 'values', 'ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#1A1C2C</color>
</resources>
`)
writeFileSync(join(RES, 'values', 'colors.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#1A1C2C</color>
    <color name="colorPrimaryDark">#1A1C2C</color>
    <color name="colorAccent">#41A6F6</color>
    <color name="questlingBackground">#1A1C2C</color>
</resources>
`)

console.log('Icone, splash e icona di stato generate.')
