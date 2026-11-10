// Genera icone launcher, splash e icona di stato (Android) dall'arte dipinta degli eroi, renderizzata con Chromium.
// Uso: npm run icons   (rilancialo quando cambi l'arte: sostituisce solo i file generati)
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RES = join(ROOT, 'android', 'app', 'src', 'main', 'res')
const HERO = 'zeffiro' // eroe usato per l'icona dell'app
const BG_TOP = '#26346a'
const BG_BOTTOM = '#0b1020'

const b64 = (file) => readFileSync(file).toString('base64')
const heroUrl = `data:image/webp;base64,${b64(join(ROOT, 'app', 'assets', 'heroes', 'art', `hero_${HERO}_full.webp`))}`
const sceneUrl = `data:image/webp;base64,${b64(join(ROOT, 'app', 'assets', 'scenes', 'onb-splash.webp'))}`
const fontData = b64(join(ROOT, 'node_modules', '@fontsource', 'cormorant-garamond', 'files', 'cormorant-garamond-latin-700-normal.woff2'))

// Ritaglio dell'illustrazione (900x1200): cappello, viso e barba, senza bastone e braccia
const CROP = { x: 165, y: 40, size: 640 }
const IMG_W = 900

/** Volto dell'eroe dentro un quadrato di `box` px, con i bordi sfumati (niente braccia o bastone che spuntano). */
const face = (box) => {
  const s = box / CROP.size
  return `<div style="position:relative;width:${box}px;height:${box}px;overflow:hidden;-webkit-mask-image:radial-gradient(closest-side,#000 80%,transparent 100%);mask-image:radial-gradient(closest-side,#000 80%,transparent 100%)">
    <img src="${heroUrl}" style="position:absolute;left:${-CROP.x * s}px;top:${-CROP.y * s}px;width:${IMG_W * s}px;height:auto">
  </div>`
}

const page = (body, bg) => `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family: 'F'; src: url(data:font/woff2;base64,${fontData}) format('woff2'); font-weight: 700; }
  html, body { margin: 0; width: 100%; height: 100%; background: ${bg}; overflow: hidden; }
  body { display: grid; place-items: center; }
</style>${body}`

let browser
async function shot(path, w, h, body, { transparent = false, bg = `linear-gradient(180deg, ${BG_TOP}, ${BG_BOTTOM})`, round = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  await p.setContent(page(body, transparent ? 'transparent' : bg))
  await p.waitForTimeout(150)
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

/** Icona completa: cielo notturno con un alone dorato dietro il volto. */
const iconBody = (size, frac) => {
  const box = Math.round(size * frac)
  return `<div style="position:relative;width:${size}px;height:${size}px;display:grid;place-items:center;background:radial-gradient(closest-side at 50% 46%, rgba(233,184,94,.38), transparent 78%)">${face(box)}</div>`
}

const DENSITY = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
browser = await chromium.launch()

for (const [d, f] of Object.entries(DENSITY)) {
  const legacy = Math.round(48 * f)
  await shot(join(RES, `mipmap-${d}`, 'ic_launcher.png'), legacy, legacy, iconBody(legacy, 1))
  await shot(join(RES, `mipmap-${d}`, 'ic_launcher_round.png'), legacy, legacy, iconBody(legacy, 0.94), { round: true })
  // adattivo: 108dp con il contenuto nella zona sicura (66dp); lo sfondo e' un colore a parte
  const adaptive = Math.round(108 * f)
  await shot(join(RES, `mipmap-${d}`, 'ic_launcher_foreground.png'), adaptive, adaptive, face(Math.round(adaptive * 0.62)), { transparent: true })
}

// splash (stesse dimensioni dei file del template Capacitor): scena dipinta + nome
const splashDirs = ['drawable', ...['port', 'land'].flatMap((o) => Object.keys(DENSITY).map((d) => `drawable-${o}-${d}`))]
for (const dir of splashDirs) {
  const file = join(RES, dir, 'splash.png')
  if (!existsSync(file)) continue
  const { width: w, height: h } = PNG.sync.read(readFileSync(file))
  const word = Math.round(Math.min(w, h) * 0.16)
  await shot(
    file,
    w,
    h,
    `<div style="position:relative;width:${w}px;height:${h}px;background:#0b1020 url(${sceneUrl}) center bottom/cover no-repeat">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(11,16,32,.82) 0%, rgba(11,16,32,.1) 48%, rgba(11,16,32,.45) 100%)"></div>
      <div style="position:absolute;left:0;right:0;top:${Math.round(h * 0.17)}px;text-align:center;font:700 ${word}px/1 'F', Georgia, serif;color:#fff3d6;text-shadow:0 4px 28px rgba(0,0,0,.7), 0 0 40px rgba(233,184,94,.35)">Questling</div>
    </div>`,
  )
}

// master per gli store e per tool esterni
await shot(join(ROOT, 'resources', 'icon.png'), 1024, 1024, iconBody(1024, 1))

// iOS: icona 1024 SENZA canale alfa (Apple la rifiuta con trasparenza) e splash quadrata 2732 (la storyboard la riempie a tutto schermo,
// quindi su un iPhone resta visibile solo la fascia centrale: nome piu' piccolo e castello spostato verso il centro)
const IOS = join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets')
if (existsSync(IOS)) {
  const toRgb = (file) => {
    const png = PNG.sync.read(readFileSync(file))
    for (let i = 3; i < png.data.length; i += 4) png.data[i] = 255
    writeFileSync(file, PNG.sync.write(png, { colorType: 2 }))
  }
  const iconFile = join(IOS, 'AppIcon.appiconset', 'AppIcon-512@2x.png')
  await shot(iconFile, 1024, 1024, iconBody(1024, 1))
  toRgb(iconFile)
  const S = 2732
  // la scena (orizzontale) sta come fascia nella meta' bassa, con il cielo che sfuma sopra e sotto; il castello cade al centro
  const SW = 1800
  const splashBody = `<div style="position:relative;width:${S}px;height:${S}px;background:linear-gradient(180deg,#0b1020 0%,#1b2550 42%,#0b1020 100%);overflow:hidden">
      <img src="${sceneUrl}" style="position:absolute;width:${SW}px;left:${Math.round(S / 2 - 0.6 * SW)}px;top:${Math.round(S * 0.37)}px;-webkit-mask-image:linear-gradient(transparent 0%,#000 30%,#000 78%,transparent 100%);mask-image:linear-gradient(transparent 0%,#000 30%,#000 78%,transparent 100%)">
      <div style="position:absolute;left:0;right:0;top:${Math.round(S * 0.2)}px;text-align:center;font:700 ${Math.round(S * 0.075)}px/1 'F', Georgia, serif;color:#fff3d6;text-shadow:0 4px 28px rgba(0,0,0,.7), 0 0 40px rgba(233,184,94,.35)">Questling</div>
    </div>`
  for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    const file = join(IOS, 'Splash.imageset', name)
    await shot(file, S, S, splashBody)
    toRgb(file)
  }
}
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

// Sfondo adattivo e colori del tema (palette "Night-Sky Storybook")
const colors = { bg: '#1B2550' }
writeFileSync(join(RES, 'values', 'ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${colors.bg}</color>
</resources>
`)
writeFileSync(join(RES, 'values', 'colors.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#0B1020</color>
    <color name="colorPrimaryDark">#0B1020</color>
    <color name="colorAccent">#E9B85E</color>
    <color name="questlingBackground">#0B1020</color>
</resources>
`)

console.log('Icone, splash e icona di stato generate.')
