// Genera public/privacy.html dalla STESSA fonte della pagina in-app (i18n/locales/it/privacy.json),
// cosi' lo store ha un URL pubblico (es. https://<dominio>/privacy.html) sempre allineato all'app.
// Eseguito da `npm run generate` (esplicitamente: con ignore-scripts gli hook pre/post non girano).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// Un file per lingua: privacy.html (italiano) e privacy-en.html (inglese)
const TARGETS = [
  { lang: 'it', file: 'privacy.html' },
  { lang: 'en', file: 'privacy-en.html' },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function render(policy, lang) {
const sections = policy.sections
  .map(
    (s) =>
      `<section>\n<h2>${esc(s.title)}</h2>\n${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n')}\n</section>`,
  )
  .join('\n')

const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(policy.title)} - ${esc(policy.app)}</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #0b1020; color: #f5f0e5; font: 18px/1.6 "Source Sans 3", system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 42rem; margin: 0 auto; padding: 24px 16px 64px; }
  h1 { font: 700 2rem/1.2 "Cormorant Garamond", Georgia, serif; }
  h2 { font-size: 1.1rem; margin-top: 2rem; color: #e9b85e; }
  p { margin: 0.6rem 0; }
  .meta { color: #b6c0d0; }
  section { border-top: 1px solid #34415b; margin-top: 1.5rem; }
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

return html
}

mkdirSync(join(ROOT, 'public'), { recursive: true })
for (const { lang, file } of TARGETS) {
  const policy = JSON.parse(readFileSync(join(ROOT, 'i18n', 'locales', lang, 'privacy.json'), 'utf8'))
  writeFileSync(join(ROOT, 'public', file), render(policy, lang))
  console.log(`public/${file} generato`)
}
