// Effetti sonori SINTETIZZATI: solo dati (note); li suona useSfx con Web Audio. Nessun file audio.
export type SfxName = 'tap' | 'complete' | 'levelup' | 'error'

export interface SfxNote {
  freq: number // Hz
  start: number // secondi dall'inizio dell'effetto
  dur: number // secondi
  wave: 'square' | 'triangle'
  gain: number // 0..1
}

const note = (freq: number, start: number, dur: number, wave: SfxNote['wave'] = 'square', gain = 0.08): SfxNote => ({
  freq,
  start,
  dur,
  wave,
  gain,
})

export const SFX: Record<SfxName, readonly SfxNote[]> = {
  tap: [note(880, 0, 0.04, 'square', 0.05)],
  complete: [note(523.25, 0, 0.07), note(659.25, 0.07, 0.07), note(783.99, 0.14, 0.12)],
  levelup: [
    note(523.25, 0, 0.1),
    note(659.25, 0.1, 0.1),
    note(783.99, 0.2, 0.1),
    note(1046.5, 0.3, 0.16),
    note(783.99, 0.5, 0.08),
    note(1046.5, 0.58, 0.28),
  ],
  error: [note(196, 0, 0.12, 'triangle', 0.1), note(146.83, 0.12, 0.2, 'triangle', 0.1)],
}

export const sfxDuration = (name: SfxName): number =>
  Math.max(...SFX[name].map((n) => n.start + n.dur))
