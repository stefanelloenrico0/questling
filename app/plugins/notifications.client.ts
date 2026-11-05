// Ripianifica le notifiche locali a ogni cambiamento rilevante: apertura app, completamento/undo,
// cambio impostazioni o eroe, cambio giorno, rientro in foreground (touchOpened) e cambio fuso
// (gli orari assoluti cambiano -> cambia la firma del piano).
export default defineNuxtPlugin({
  name: 'notifications',
  dependsOn: ['persistence'],
  setup() {
    const game = useGameStore()
    const notifications = useNotifications()
    void notifications.init()

    let timer: ReturnType<typeof setTimeout> | null = null
    const schedule = (force = false): void => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void notifications.reschedule(force), 600)
    }

    watch(() => game.state, () => schedule())
    watch(() => game.today, () => schedule())
    schedule(true) // all'apertura: sempre (dopo un riavvio del telefono i pendenti potrebbero mancare)
  },
})
