// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  ssr: false,
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@pinia/nuxt', '@vueuse/nuxt', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  // Solo tema scuro (D9)
  colorMode: { preference: 'dark', fallback: 'dark', forced: true } as never,

  i18n: {
    defaultLocale: 'it',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [{ code: 'it', language: 'it-IT', name: 'Italiano', file: 'it.ts' }],
    langDir: 'locales',
  },

  // Icone incluse nel bundle client: niente chiamate ad api.iconify.design (app offline)
  icon: { provider: 'none', clientBundle: { scan: true, includeCustomCollections: true } },

  // Font self-hosted via @fontsource (CSS in main.css): vietato scaricarli da CDN a build-time
  fonts: {
    families: [
      { name: 'Press Start 2P', provider: 'none' },
      { name: 'Pixelify Sans', provider: 'none' },
      { name: 'VT323', provider: 'none' },
    ],
    providers: { google: false, googleicons: false, bunny: false, fontshare: false, fontsource: false },
  },

  // Capacitor: le route profonde con reload possono rompersi → hash mode
  router: { options: { hashMode: true } },

  app: {
    head: {
      htmlAttrs: { lang: 'it' },
      title: 'Questling',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no' },
        { name: 'theme-color', content: '#1a1c2c' },
      ],
    },
  },

  runtimeConfig: { public: { appVersion: process.env.npm_package_version ?? '0.0.0' } },

  typescript: { strict: true, typeCheck: false },

  nitro: { preset: 'static' },
})
