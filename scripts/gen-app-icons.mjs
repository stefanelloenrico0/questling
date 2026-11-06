// Genera icone launcher, splash e icona di stato (Android) dagli SVG degli eroi, renderizzati con Chromium.
// Uso: npm run icons   (rilancialo quando cambi l'arte: sostituisce solo i file generati)
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RES = join(ROOT, 'android', 'app', 'src', 'main', 'res')
const HERO = 'zeffiro' // eroe usato per l'icona dell'app
const BG_TOP = '#2c2f63'
const BG_BOTTOM = '#14162a'

const svgOf = (id) => readFileSync(join(ROOT, 'app', 'assets', 'heroes', `${id}.svg`), 'utf8')
const fontData = readFileSync(join(ROOT, 'node_modules', '@fontsource', 'fredoka', 'files', 'fredoka-latin-600-normal.woff2')).toString('base64')

/** SVG con viewBox ritagliato (es. solo testa e cappello) e dimensioni in pixel. */
const cropped = (svg, viewBox, size) =>
  svg.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`).replace('<svg ', `<svg width="${size}" height="${size}" `)
const sized = (svg, w, h) => svg.replace('<svg ', `<svg width="${w}" height="${h}" `)

// cappello + viso + barba di Zeffiro, centrati
const FACE_VIEWBOX = '11 -34 218 218'

const page = (body, bg) => `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family: 'F'; src: url(data:font/woff2;base64,${fontData}) format('woff2'); font-weight: 600; }
  html, body { margin: 0; width: 100%; height: 100%; background: ${bg}; overflow: hidden; }
  body { display: grid; place-items: center; }
  .stack { display: grid; justify-items: center; gap: 4vmin; }
  .word { font: 600 9vmin/1 'F', sans-serif; color: #f4f6ff; letter-spacing: .02em; }
</style>${body}`

let browser
async function shot(path, w, h, body, { transparent = false, bg = `linear-gradient(180deg, ${BG_TOP}, ${BG_BOTTOM})`, round = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  await p.setContent(page(body, transparent ? 'transparent' : bg))
  const buf = await p.screenshot({ omitBackground: transparent })
  await ctx.close()
  let out = buf
  if (round) {
    const png = PNG.sync.read(buf)
    const r = w / 2
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x + 0.5 - r) ** 2 + (y + 0.5 - r) ** 2 > r * r) png.data[(y * w + x) * 4 + 3] = 0
    out = PNG.sync.write(png)
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, out)
}

const DENSITY = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
browser = await chromium.launch()
// per l'icona: solo cappello, viso e barba (senza braccia ne' bastone, che verrebbero tagliati)
const dropBetween = (svg, from, to) => {
  const a = svg.indexOf(from)
  const b = svg.indexOf(to)
  return a < 0 || b < a ? svg : svg.slice(0, a) + svg.slice(b)
}
const art = dropBetween(svgOf(HERO), '<!-- bastone', '<!-- barba')

for (const [d, f] of Object.entries(DENSITY)) {
  const legacy = Math.round(48 * f)
  await shot(join(RES, `mipmap-${d}`, 'ic_launcher.png'), legacy, legacy, cropped(art, FACE_VIEWBOX, Math.round(legacy * 0.86)))
  await shot(join(RES, `mipmap-${d}`, 'ic_launcher_round.png'), legacy, legacy, cropped(art, FACE_VIEWBOX, Math.round(legacy * 0.78)), { round: true })
  // adattivo: 108dp con il contenuto nella zona sicura (66dp)
  const adaptive = Math.round(108 * f)
  await shot(join(RES, `mipmap-${d}`, 'ic_launcher_foreground.png'), adaptive, adaptive, cropped(art, FACE_VIEWBOX, Math.round(adaptive * 0.6)), { transparent: true })
}

// splash (stesse dimensioni dei file del template Capacitor)
const splashDirs = ['drawable', ...['port', 'land'].flatMap((o) => Object.keys(DENSITY).map((d) => `drawable-${o}-${d}`))]
for (const dir of splashDirs) {
  const file = join(RES, dir, 'splash.png')
  if (!existsSync(file)) continue
  const { width: w, height: h } = PNG.sync.read(readFileSync(file))
  const heroH = Math.round(Math.min(w, h) * 0.46)
  await shot(file, w, h, `<div class="stack">${sized(svgOf(HERO), Math.round(heroH * (262 / 304)), heroH)}<div class="word">Questling</div></div>`)
}

// master per gli store (Fase 4) e per tool esterni
await shot(join(ROOT, 'resources', 'icon.png'), 1024, 1024, cropped(art, FACE_VIEWBOX, 880))
await browser.close()

// Icona di stato delle notifiche: MONOCROMATICA (solo alfa), scudo
mkdirSync(join(RES, 'drawable'), { recursive: true })
writeFileSync(
  join(RES, 'drawable', 'ic_stat_questling.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M12,2 L4,5.2 V11.4 C4,16.4 7.4,20.8 12,22 C16.6,20.8 20,16.4 20,11.4 V5.2 Z M12,5 L17,7.2 V11.4 C17,14.8 15,17.8 12,19 C9,17.8 7,14.8 7,11.4 V7.2 Z" />
</vector>
`,
)

// Sfondo adattivo e colori del tema
const colors = { bg: '#1B1E3D' }
writeFileSync(join(RES, 'values', 'ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${colors.bg}</color>
</resources>
`)
writeFileSync(join(RES, 'values', 'colors.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#14162A</color>
    <color name="colorPrimaryDark">#14162A</color>
    <color name="colorAccent">#41A6F6</color>
    <color name="questlingBackground">#14162A</color>
</resources>
`)

console.log('Icone, splash e icona di stato generate.')
