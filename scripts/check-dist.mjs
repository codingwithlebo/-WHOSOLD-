#!/usr/bin/env node
// Release guard: fail if the built frontend (dist/) contains anything that
// must never reach the browser. Runs in CI after `npm run build` and before a
// deploy is trusted. Usage: node scripts/check-dist.mjs [dir]
//
// What it blocks:
// - Supabase service_role JWTs (the anon key is allowed: RLS protects data)
// - Supabase secret API keys (sb_secret_...)
// - Server-only env var names leaking into the bundle
// - Quiz answer fields: answers live only in the database and are checked by
//   RPCs, so the client bundle must never contain them.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.argv[2] ?? 'dist'

const forbidden = [
  { name: 'Supabase secret key', pattern: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  {
    name: 'server-only env var name',
    pattern:
      /SUPABASE_SERVICE_ROLE(_KEY)?|SERVICE_ROLE_KEY|SUPABASE_DB_PASSWORD/,
  },
  {
    name: 'quiz answer field',
    pattern: /\b(correct_answer|correct_option|correct_index|is_correct)\b/,
  },
]

const jwtPattern = /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1] ?? ''
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) yield* walk(path)
    else if (/\.(js|mjs|css|html|json|map|txt|webmanifest)$/.test(entry))
      yield path
  }
}

let files
try {
  files = [...walk(root)]
} catch {
  console.error(`check-dist: "${root}" not found. Run \`npm run build\` first.`)
  process.exit(2)
}

const problems = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  const where = relative(process.cwd(), file)

  for (const { name, pattern } of forbidden) {
    const match = pattern.exec(text)
    if (match) problems.push(`${where}: ${name} ("${match[0].slice(0, 24)}…")`)
  }

  for (const token of text.match(jwtPattern) ?? []) {
    const role = decodeJwtPayload(token)?.role
    if (role && role !== 'anon') {
      problems.push(`${where}: Supabase JWT with role "${role}"`)
    }
  }
}

if (problems.length > 0) {
  console.error(
    'check-dist: the build contains values that must stay server-side:',
  )
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

console.warn(
  `check-dist: ${files.length} files scanned, nothing sensitive found.`,
)
