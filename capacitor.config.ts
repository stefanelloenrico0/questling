import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // Placeholder: NON modificabile dopo la pubblicazione. Da confermare con Enrico (spec §2, domanda 3).
  appId: 'com.stefanelloenrico.questling',
  appName: 'Questling',
  webDir: '.output/public',
  backgroundColor: '#1a1c2c',
  android: { backgroundColor: '#1a1c2c' },
  plugins: {
    SplashScreen: { launchShowDuration: 0, backgroundColor: '#1a1c2c' },
    // Icona di stato monocromatica (android/app/src/main/res/drawable/ic_stat_questling.xml)
    LocalNotifications: { smallIcon: 'ic_stat_questling', iconColor: '#41A6F6' },
    // Login social NATIVO (Google/Apple) consegnato alla sessione del SDK web (skipNativeAuth): una sola sessione, quella di Firebase JS
    FirebaseAuthentication: { skipNativeAuth: true, providers: ['google.com', 'apple.com'] },
  },
}

export default config
