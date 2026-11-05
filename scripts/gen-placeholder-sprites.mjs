// Genera sprite placeholder 32x32 (spritesheet orizzontale, 4 frame) per gli 8 eroi
// + 4 overlay tier condivisi (T2..T5). Uso: npm run sprites
import { PNG } from 'pngjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sprites')
const F = 32
const FRAMES = 4

const heroes = [
  { id: 'valdo', accent: '#41a6f6', shape: 'helm' },
  { id: 'kuro', accent: '#94b0c2', shape: 'hood' },
  { id: 'fenna', accent: '#38b764', shape: 'cap' },
  { id: 'zeffiro', accent: '#73eff7', shape: 'hat' },
  { id: 'lumen', accent: '#ffcd75', shape: 'halo' },
  { id: 'rondo', accent: '#ef7d57', shape: 'feather' },
  { id: 'u404', accent: '#a7f070', shape: 'antenna' },
  { id: 'brunilde', accent: '#e8707f', shape: 'braids' },
]

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const OUT = hex('#1a1c2c')
const SKIN = hex('#f4f4f4')
const DARK = hex('#333c57')
const EYE = hex('#1a1c2c')
const RED = hex('#b13e53')
const ORANGE = hex('#ef7d57')
const LIME = hex('#a7f070')
const GOLD = hex('#ffcd75')
const CYAN = hex('#73eff7')

function sheet() {
  const png = new PNG({ width: F * FRAMES, height: F })
  png.data.fill(0)
  return png
}

function px(png, fx, x, y, c, a = 255) {
  if (x < 0 || y < 0 || x >= F || y >= F) return
  const i = (y * png.width + fx * F + x) * 4
  png.data[i] = c[0]
  png.data[i + 1] = c[1]
  png.data[i + 2] = c[2]
  png.data[i + 3] = a
}

function rect(png, fx, x, y, w, h, c, a = 255) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(png, fx, x + i, y + j, c, a)
}

function drawHero(png, fx, hero, happy) {
  const accent = hex(hero.accent)
  const bob = [0, -1, 0, 1][fx]
  const jump = happy ? [0, -3, -4, -2][fx] : bob
  const oy = 6 + jump
  // corpo
  rect(png, fx, 9, oy + 14, 14, 12, OUT)
  rect(png, fx, 10, oy + 15, 12, 10, accent)
  rect(png, fx, 10, oy + 21, 12, 4, DARK)
  // gambe
  rect(png, fx, 11, oy + 25, 4, 3, OUT)
  rect(png, fx, 17, oy + 25, 4, 3, OUT)
  // testa
  rect(png, fx, 10, oy + 4, 12, 11, OUT)
  rect(png, fx, 11, oy + 5, 10, 9, SKIN)
  // occhi
  if (happy) {
    rect(png, fx, 13, oy + 8, 2, 1, EYE)
    rect(png, fx, 17, oy + 8, 2, 1, EYE)
    rect(png, fx, 14, oy + 11, 4, 1, EYE)
  } else {
    rect(png, fx, 13, oy + 8, 2, 2, EYE)
    rect(png, fx, 17, oy + 8, 2, 2, EYE)
  }
  // forma distintiva per classe
  switch (hero.shape) {
    case 'helm':
      rect(png, fx, 10, oy + 1, 12, 5, accent)
      rect(png, fx, 15, oy - 2, 2, 3, RED)
      break
    case 'hood':
      rect(png, fx, 9, oy + 2, 14, 6, accent)
      rect(png, fx, 12, oy + 6, 8, 3, DARK)
      break
    case 'cap':
      rect(png, fx, 10, oy + 2, 12, 4, accent)
      rect(png, fx, 20, oy + 1, 4, 2, ORANGE)
      break
    case 'hat':
      rect(png, fx, 9, oy + 3, 14, 2, accent)
      rect(png, fx, 12, oy - 1, 8, 4, accent)
      rect(png, fx, 15, oy - 4, 3, 3, accent)
      break
    case 'halo':
      rect(png, fx, 11, oy, 10, 1, accent)
      rect(png, fx, 10, oy + 1, 1, 2, accent)
      rect(png, fx, 21, oy + 1, 1, 2, accent)
      break
    case 'feather':
      rect(png, fx, 10, oy + 2, 12, 3, accent)
      rect(png, fx, 20, oy - 3, 2, 6, LIME)
      break
    case 'antenna':
      rect(png, fx, 15, oy - 2, 2, 6, accent)
      rect(png, fx, 14, oy - 4, 4, 2, accent)
      break
    case 'braids':
      rect(png, fx, 8, oy + 5, 3, 10, accent)
      rect(png, fx, 21, oy + 5, 3, 10, accent)
      rect(png, fx, 10, oy + 3, 12, 2, accent)
      break
  }
}

function writePng(png, path) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, PNG.sync.write(png))
}

for (const hero of heroes) {
  for (const [name, happy] of [
    ['idle', false],
    ['happy', true],
  ]) {
    const png = sheet()
    for (let fx = 0; fx < FRAMES; fx++) drawHero(png, fx, hero, happy)
    writePng(png, join(ROOT, hero.id, `${name}.png`))
  }
}

// Overlay tier condivisi (stesso frame size, sovrapposti nel DOM)
function overlay(tier) {
  const png = sheet()
  for (let fx = 0; fx < FRAMES; fx++) {
    if (tier === 2) {
      // scintille
      const pts = [
        [4, 6],
        [27, 10],
        [6, 22],
        [26, 26],
      ]
      pts.forEach(([x, y], i) => {
        if ((i + fx) % 2 === 0) {
          rect(png, fx, x, y, 2, 2, GOLD)
          px(png, fx, x - 1, y, SKIN)
          px(png, fx, x + 2, y, SKIN)
        }
      })
    }
    if (tier === 3) {
      // stendardo accanto all'eroe
      rect(png, fx, 27, 8, 1, 20, DARK)
      rect(png, fx, 28, 9 + (fx % 2), 3, 5, RED)
    }
    if (tier >= 4) {
      // aura pulsante
      const a = [60, 90, 120, 90][fx]
      const c = tier === 5 ? GOLD : CYAN
      rect(png, fx, 5, 3, 22, 1, c, a)
      rect(png, fx, 5, 28, 22, 1, c, a)
      rect(png, fx, 4, 4, 1, 24, c, a)
      rect(png, fx, 27, 4, 1, 24, c, a)
    }
    if (tier === 5) {
      // corona
      rect(png, fx, 12, 2, 8, 1, GOLD)
      rect(png, fx, 12, 0, 1, 2, GOLD)
      rect(png, fx, 15, 0, 2, 2, GOLD)
      rect(png, fx, 19, 0, 1, 2, GOLD)
    }
  }
  return png
}

for (const t of [2, 3, 4, 5]) writePng(overlay(t), join(ROOT, 'overlays', `tier${t}.png`))

console.log(`Sprite placeholder generati in ${ROOT}`)
