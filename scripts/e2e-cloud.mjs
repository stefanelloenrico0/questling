// E2E "cloud": costruisce l'app CONFIGURATA sugli emulatori Firebase e fa girare Playwright con
// due contesti browser (due dispositivi). Va lanciato dentro with-emulators:
//   node scripts/with-emulators.mjs node scripts/e2e-cloud.mjs      (npm run e2e:cloud)
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const fsHost = process.env.FIRESTORE_EMULATOR_HOST
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST
if (!fsHost || !authHost) {
  console.error('Mancano FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST: usa npm run e2e:cloud')
  process.exit(2)
}

const OUT = join(ROOT, '.output-cloud')
const env = {
  ...process.env,
  QUESTLING_OUTPUT_DIR: OUT,
  NUXT_PUBLIC_FIREBASE_API_KEY: 'fake-api-key',
  NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost',
  NUXT_PUBLIC_FIREBASE_PROJECT_ID: 'Questling',
  NUXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000',
  NUXT_PUBLIC_FIREBASE_EMULATOR_AUTH: authHost,
  NUXT_PUBLIC_FIREBASE_EMULATOR_FIRESTORE: fsHost,
  STATIC_ROOT: join(OUT, 'public'),
  PORT: '4174',
}

const run = (cmd) => spawnSync(cmd, { cwd: ROOT, env, shell: true, stdio: 'inherit' }).status ?? 1

if (run('npx nuxt generate --dotenv .env.e2e') !== 0) process.exit(1)
process.exit(run('npx playwright test -c playwright.cloud.config.ts'))
