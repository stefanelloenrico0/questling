import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

const noop = (): void => {}

// Ciclo di vita: flush su background; al ritorno in primo piano rollover del giorno, "ultima apertura"
// (i promemoria di ritorno) e -- tramite il watch di notifications.client -- riprogrammazione.
export default defineNuxtPlugin({
  name: 'app-lifecycle',
  dependsOn: ['persistence'],
  setup() {
    const game = useGameStore()

    const onHidden = (): void => void game.flush()
    const onVisible = (): void => {
      game.refreshNow()
      game.touchOpened()
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHidden()
      else onVisible()
    })
    window.addEventListener('pagehide', onHidden)
    window.setInterval(() => game.refreshNow(), 30_000)

    if (Capacitor.isNativePlatform()) {
      // Nativo: appStateChange e' piu' affidabile di visibilitychange nella WebView.
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) onVisible()
        else onHidden()
      }).catch(noop)
      StatusBar.setStyle({ style: Style.Dark }).catch(noop) // testo chiaro su sfondo scuro
      StatusBar.setBackgroundColor({ color: '#0b1020' }).catch(noop)
      SplashScreen.hide().catch(noop)
    }
  },
})
