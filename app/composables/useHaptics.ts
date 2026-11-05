import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

/** Haptics solo nel build nativo e solo se attivi nelle impostazioni. */
export function useHaptics() {
  const game = useGameStore()

  function run(action: () => Promise<void>): void {
    if (!game.settings.haptics || !Capacitor.isNativePlatform()) return
    action().catch(() => {
      /* dispositivo senza vibrazione: ignorare */
    })
  }

  return {
    /** Impatto leggero: completamento di una missione. */
    light: (): void => run(() => Haptics.impact({ style: ImpactStyle.Light })),
    /** "Success": level-up. */
    success: (): void => run(() => Haptics.notification({ type: NotificationType.Success })),
  }
}
