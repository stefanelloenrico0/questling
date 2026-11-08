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
  'lock', 'calendar-check', 'list-checks', 'settings', 'chevron-up', 'chevron-down', 'x', 'check', 'plus', 'minus', 'bell', 'chevron-left',
] as const

/** Elenco per il bundle (nuxt.config): le icone dinamiche non si trovano con la scansione del codice. */
export const BUNDLED_ICONS: string[] = [...new Set([...Object.values(ICONS), ...UI_ICONS])].map((n) => `lucide:${n}`)
