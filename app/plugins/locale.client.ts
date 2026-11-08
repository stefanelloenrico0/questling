import { detectLocale, type Locale } from '../../core/locale'

// Lingua dell'app: al primo avvio (nessun dato salvato) si sceglie quella del dispositivo, poi vale
// l'impostazione salvata. Deve essere pronta PRIMA del primo render, per non mostrare l'altra lingua per un istante.
export default defineNuxtPlugin({
  name: 'locale',
  dependsOn: ['persistence'],
  async setup(nuxtApp) {
    const game = useGameStore()
    const i18n = nuxtApp.$i18n as { locale: Ref<string>; setLocale: (l: string) => Promise<void> }

    if (game.loadStatus === 'fresh') {
      const detected = detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language])
      if (detected !== game.settings.locale) game.patchSettings({ locale: detected })
    }

    await i18n.setLocale(game.settings.locale)
    watch(
      () => game.settings.locale,
      (value: Locale) => {
        void i18n.setLocale(value)
      },
    )
  },
})
