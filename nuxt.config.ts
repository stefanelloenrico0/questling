import { BUNDLED_ICONS } from './data/icons'

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
    locales: [
      { code: 'it', language: 'it-IT', name: 'Italiano', file: 'it.ts' },
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.ts' },
    ],
    langDir: 'locales',
  },

  // Icone incluse nel bundle client: niente chiamate ad api.iconify.design (app offline)
  icon: { provider: 'none', clientBundle: { scan: true, icons: BUNDLED_ICONS, includeCustomCollections: true } },

  // Font self-hosted via @fontsource (CSS in main.css): vietato scaricarli da CDN a build-time
  fonts: {
    families: [
      { name: 'Fredoka', provider: 'none' },
      { name: 'Nunito', provider: 'none' },
    ],
    providers: { google: false, googleicons: false, bunny: false, fontshare: false, fontsource: false },
  },

  // Capacitor: le route profonde con reload possono rompersi → hash mode
  router: { options: { hashMode: true } },

  app: {
    head: {
      htmlAttrs: { lang: 'it' },
      title: 'Questling',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no' },
        { name: 'theme-color', content: '#14162a' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      appVersion: process.env.npm_package_version ?? '0.0.0',
      // Pulsante "Continua con Apple": spento finche' non e' configurato (NUXT_PUBLIC_APPLE_SIGN_IN=true per accenderlo)
      appleSignIn: false,
      // Account e sync sono OPZIONALI: senza queste variabili (NUXT_PUBLIC_FIREBASE_*) l'app e' solo locale.
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',
        messagingSenderId: '',
        // Solo per i test: 'host:porta' degli emulatori
        emulatorAuth: '',
        emulatorFirestore: '',
      },
    },
  },

  typescript: { strict: true, typeCheck: false },

  // QUESTLING_OUTPUT_DIR: build alternativa (test cloud) senza toccare .output della build normale
  nitro: {
    preset: 'static',
    ...(process.env.QUESTLING_OUTPUT_DIR
      ? { output: { dir: process.env.QUESTLING_OUTPUT_DIR, publicDir: `${process.env.QUESTLING_OUTPUT_DIR}/public` } }
      : {}),
  },
})
