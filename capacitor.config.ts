import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // Placeholder: NON modificabile dopo la pubblicazione. Da confermare con Enrico (spec §2, domanda 3).
  appId: 'com.stefanelloenrico.questling',
  appName: 'Questling',
  webDir: '.output/public',
  backgroundColor: '#0b1020',
  // v1 solo locale: il plugin di login Firebase resta fuori dalle app native (niente SDK Firebase/Google inutili).
  // Quando arrivano gli account (v1.1) basta aggiungere qui '@capacitor-firebase/authentication'.
  includePlugins: [
    '@capacitor/app',
    '@capacitor/filesystem',
    '@capacitor/haptics',
    '@capacitor/local-notifications',
    '@capacitor/preferences',
    '@capacitor/share',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
  ],
  android: { backgroundColor: '#0b1020' },
  plugins: {
    SplashScreen: { launchShowDuration: 0, backgroundColor: '#0b1020' },
    // Icona di stato monocromatica (android/app/src/main/res/drawable/ic_stat_questling.xml)
    LocalNotifications: { smallIcon: 'ic_stat_questling', iconColor: '#E9B85E' },
    // Login social NATIVO (Google/Apple) consegnato alla sessione del SDK web (skipNativeAuth): una sola sessione, quella di Firebase JS
    FirebaseAuthentication: { skipNativeAuth: true, providers: ['google.com', 'apple.com'] },
  },
}

export default config
