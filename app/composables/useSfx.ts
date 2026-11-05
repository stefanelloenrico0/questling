import { SFX, type SfxName } from '../../core/sfx'

let context: AudioContext | null = null

/** Effetti sonori sintetizzati con Web Audio (nessun file audio). Rispetta l'impostazione "suoni". */
export function useSfx() {
  const game = useGameStore()

  function play(name: SfxName): void {
    if (!game.settings.sound) return
    try {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      context ??= new Ctor()
      if (context.state === 'suspended') void context.resume()
      const t0 = context.currentTime + 0.01
      for (const n of SFX[name]) {
        const osc = context.createOscillator()
        const amp = context.createGain()
        osc.type = n.wave
        osc.frequency.setValueAtTime(n.freq, t0 + n.start)
        amp.gain.setValueAtTime(0.0001, t0 + n.start)
        amp.gain.linearRampToValueAtTime(n.gain, t0 + n.start + 0.005)
        amp.gain.exponentialRampToValueAtTime(0.0001, t0 + n.start + n.dur)
        osc.connect(amp).connect(context.destination)
        osc.start(t0 + n.start)
        osc.stop(t0 + n.start + n.dur + 0.02)
      }
    } catch {
      /* l'audio e' un extra: non deve mai rompere l'app */
    }
  }

  return { play }
}
