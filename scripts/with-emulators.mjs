// Avvia gli emulatori Firebase (Auth + Firestore), esegue un comando e li chiude DAVVERO.
// `firebase emulators:exec` su Windows lascia un java.exe appeso a ogni esecuzione: qui chiudiamo
// l'intero albero di processi che abbiamo avviato noi (e solo quello).
// Uso: node scripts/with-emulators.mjs <comando...>
import { spawn, spawnSync } from 'node:child_process'
import { createConnection, createServer } from 'node:net'
import { rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FIREBASE = join(ROOT, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js')
const command = process.argv.slice(2).join(' ')
if (!command) {
  console.error('Uso: node scripts/with-emulators.mjs <comando>')
  process.exit(2)
}

// Porte libere a ogni esecuzione + configurazione temporanea: niente conflitti con altri emulatori
const freePort = () =>
  new Promise((resolve) => {
    const srv = createServer()
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
const [FIRESTORE_PORT, AUTH_PORT, HUB_PORT, LOG_PORT] = await Promise.all([freePort(), freePort(), freePort(), freePort()])
const CONFIG = join(ROOT, `.firebase-emulators-${process.pid}.json`)
writeFileSync(
  CONFIG,
  JSON.stringify({
    firestore: { rules: 'firestore.rules', indexes: 'firestore.indexes.json' },
    emulators: {
      auth: { host: '127.0.0.1', port: AUTH_PORT },
      firestore: { host: '127.0.0.1', port: FIRESTORE_PORT },
      hub: { host: '127.0.0.1', port: HUB_PORT },
      logging: { host: '127.0.0.1', port: LOG_PORT },
      ui: { enabled: false },
      singleProjectMode: true,
    },
  }),
)

const emulators = spawn(process.execPath, [FIREBASE, 'emulators:start', '--only', 'auth,firestore', '--project', 'demo-questling', '--config', CONFIG], {
  cwd: ROOT,
  // EMULATORS_VERBOSE=1 mostra l'output di Firebase (utile se non partono)
  stdio: process.env.EMULATORS_VERBOSE ? 'inherit' : 'ignore',
  windowsHide: true,
})

function stopEmulators() {
  rmSync(CONFIG, { force: true })
  if (!emulators.pid || emulators.exitCode !== null) return
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(emulators.pid), '/T', '/F'], { stdio: 'ignore' })
  else emulators.kill('SIGTERM')
}
process.on('exit', stopEmulators)
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130))

const open = (port) =>
  new Promise((resolve) => {
    const s = createConnection({ port, host: '127.0.0.1' })
    s.on('connect', () => (s.destroy(), resolve(true)))
    s.on('error', () => resolve(false))
  })

async function waitFor(port, label) {
  for (let i = 0; i < 240; i++) {
    if (await open(port)) return
    if (emulators.exitCode !== null) throw new Error(`Gli emulatori si sono fermati (${label}). Porta occupata?`)
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Timeout in attesa di ${label}`)
}

try {
  await waitFor(FIRESTORE_PORT, 'Firestore')
  await waitFor(AUTH_PORT, 'Auth')
} catch (e) {
  console.error(String(e))
  stopEmulators()
  process.exit(1)
}

const child = spawn(command, {
  cwd: ROOT,
  shell: true,
  stdio: 'inherit',
  env: {
    ...process.env,
    FIRESTORE_EMULATOR_HOST: `127.0.0.1:${FIRESTORE_PORT}`,
    FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${AUTH_PORT}`,
  },
})
child.on('exit', (code) => {
  stopEmulators()
  process.exit(code ?? 1)
})
