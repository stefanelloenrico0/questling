// Genera public/privacy.html dalla STESSA fonte della pagina in-app (i18n/locales/it/privacy.json),
// cosi' lo store ha un URL pubblico (es. https://<dominio>/privacy.html) sempre allineato all'app.
// Eseguito automaticamente prima di `npm run generate`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const policy = JSON.parse(readFileSync(join(ROOT, 'i18n', 'locales', 'it', 'privacy.json'), 'utf8'))

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const sections = policy.sections
  .map(
    (s) =>
      `<section>\n<h2>${esc(s.title)}</h2>\n${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n')}\n</section>`,
  )
  .join('\n')

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(policy.title)} - ${esc(policy.app)}</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #1a1c2c; color: #f4f4f4; font: 18px/1.6 ui-monospace, "Courier New", monospace; }
  main { max-width: 42rem; margin: 0 auto; padding: 24px 16px 64px; }
  h1 { font-size: 1.4rem; line-height: 1.4; }
  h2 { font-size: 1.1rem; margin-top: 2rem; color: #ffcd75; }
  p { margin: 0.6rem 0; }
  .meta { color: #94b0c2; }
  section { border-top: 4px solid #566c86; margin-top: 1.5rem; }
</style>
</head>
<body>
<main>
<h1>${esc(policy.title)}</h1>
<p class="meta">${esc(policy.app)} &middot; ${esc(policy.updated)}</p>
${sections}
</main>
</body>
</html>
`

mkdirSync(join(ROOT, 'public'), { recursive: true })
writeFileSync(join(ROOT, 'public', 'privacy.html'), html)
console.log('public/privacy.html generato')
