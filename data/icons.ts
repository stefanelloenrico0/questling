// Icone delle missioni: ID stabili salvati nello stato -> icone Lucide (set outline moderno, incluso offline nel bundle).
// Per aggiungerne una basta una riga: il nome Lucide va anche in BUNDLED_ICONS (lo fa questo file).
export const ICONS = {
  sword: 'sword',
  shield: 'shield',
  book: 'book-open',
  heart: 'heart',
  star: 'star',
  flame: 'flame',
  drop: 'droplet',
  moon: 'moon',
  sun: 'sun',
  leaf: 'leaf',
  dumbbell: 'dumbbell',
  shoe: 'footprints',
  music: 'music',
  pencil: 'pencil',
  coin: 'coins',
  key: 'key-round',
  bed: 'bed',
  cup: 'coffee',
  phone: 'smartphone',
  home: 'house',
  clock: 'clock',
  check: 'check',
  brain: 'brain',
  apple: 'apple',
} as const satisfies Record<string, string>

export type IconId = keyof typeof ICONS
export const ICON_IDS = Object.keys(ICONS) as IconId[]
export const DEFAULT_ICON: IconId = 'star'
export const isIconId = (id: string): id is IconId => id in ICONS

/** Icone dell'interfaccia (barra, frecce, lucchetti...) oltre a quelle delle missioni. */
export const UI_ICONS = [
  'lock', 'calendar-check', 'list-checks', 'settings', 'chevron-up', 'chevron-down', 'chevron-right', 'x', 'check', 'plus', 'minus', 'bell',
  'chevron-left', 'chart-column', 'flame', 'shield-check', 'circle-check', 'medal', 'trophy', 'sparkles', 'languages', 'sun-moon',
  'volume-2', 'vibrate', 'database', 'user', 'globe', 'award', 'crown', 'gem',
  // risposte del quiz
  'map', 'zap', 'wind', 'puzzle', 'bike', 'party-popper', 'utensils', 'sofa', 'rocket', 'laugh', 'layout-grid', 'palette',
  'orbit', 'search', 'wrench', 'swords', 'megaphone', 'message-circle', 'eye-off', 'skull', 'gamepad-2', 'book-marked',
] as const

/** Colori d'accento per le icone (tessere colorate come nel manuale grafico). */
export const PALETTE = {
  sky: '#82a8ff',
  cyan: '#73d5e2',
  green: '#91c394',
  lime: '#c0dd78',
  gold: '#e9b85e',
  orange: '#f0a46d',
  rose: '#f08c80',
  pink: '#f1a8c6',
  violet: '#b9a8f0',
  teal: '#72cabb',
} as const

/** Colore di ogni icona di missione. */
export const ICON_COLORS: Record<IconId, string> = {
  sword: PALETTE.sky,
  shield: PALETTE.sky,
  book: PALETTE.cyan,
  heart: PALETTE.rose,
  star: PALETTE.gold,
  flame: PALETTE.orange,
  drop: PALETTE.cyan,
  moon: PALETTE.violet,
  sun: PALETTE.gold,
  leaf: PALETTE.green,
  dumbbell: PALETTE.orange,
  shoe: PALETTE.teal,
  music: PALETTE.violet,
  pencil: PALETTE.pink,
  coin: PALETTE.gold,
  key: PALETTE.gold,
  bed: PALETTE.violet,
  cup: PALETTE.orange,
  phone: PALETTE.sky,
  home: PALETTE.green,
  clock: PALETTE.cyan,
  check: PALETTE.green,
  brain: PALETTE.pink,
  apple: PALETTE.rose,
}

/** Elenco per il bundle (nuxt.config): le icone dinamiche non si trovano con la scansione del codice. */
export const BUNDLED_ICONS: string[] = [...new Set([...Object.values(ICONS), ...UI_ICONS])].map((n) => `lucide:${n}`)
