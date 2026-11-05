// ULID puro: tempo e casualita' sono iniettati (testabile, nessuna dipendenza da globali).
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function ulid(timeMs: number, rand: () => number): string {
  let t = Math.floor(timeMs)
  let time = ''
  for (let i = 0; i < 10; i++) {
    time = ENCODING.charAt(t % 32) + time
    t = Math.floor(t / 32)
  }
  let random = ''
  for (let i = 0; i < 16; i++) random += ENCODING.charAt(Math.floor(rand() * 32) % 32)
  return time + random
}
