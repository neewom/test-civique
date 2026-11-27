import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

// Writes dist/sw.js, the service worker of the offline mode, from sw/service-worker.template.js:
// the template gets the list of files to precache and the address of each question pack (the
// chunks cut by vite-question-packs.ts). Build only: no service worker in development.

const PACK_PREFIX = '\0virtual:question-pack/'
const PLACEHOLDER = "'__SW_MANIFEST__'"

// Never precached: the worker itself, Netlify's files, the social image and the big icons (only
// crawlers and installs fetch them),
// source maps, and the .woff fallbacks (a browser that loads the .woff2 never asks for them)
const SKIPPED = [/^sw\.js$/, /^_headers$/, /^_redirects$/, /^og-image\.png$/, /^icon-512\.png$/, /^apple-touch-icon\.png$/, /\.map$/, /\.woff$/]

export interface SwManifest {
  version: string
  precache: string[]
  packs: Record<string, string>
}

function listFiles(dir: string, base = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? listFiles(full, base) : [path.relative(base, full).split(path.sep).join('/')]
  })
}

/** The manifest of a build: files to precache (packs excluded), pack address by title, version. */
export function buildManifest(outDir: string, packs: Record<string, string>, template: string): SwManifest {
  const packFiles = new Set(Object.values(packs).map((url) => url.slice(1)))
  const files = listFiles(outDir)
    .filter((file) => !packFiles.has(file) && !SKIPPED.some((re) => re.test(file)))
    .sort()
  const hash = createHash('sha256')
  hash.update(template)
  for (const file of files) hash.update(file).update(readFileSync(path.join(outDir, file)))
  for (const url of Object.values(packs).sort()) hash.update(url)
  // Not precached, but a change of headers (the CSP above all) must install a new worker
  if (existsSync(path.join(outDir, '_headers'))) hash.update('_headers').update(readFileSync(path.join(outDir, '_headers')))
  return {
    version: hash.digest('hex').slice(0, 12),
    precache: files.map((file) => '/' + file),
    packs,
  }
}

export function serviceWorker(): Plugin {
  const templatePath = path.resolve(import.meta.dirname, 'sw/service-worker.template.js')
  let outDir = ''
  const packs: Record<string, string> = {}
  return {
    name: 'service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.facadeModuleId?.startsWith(PACK_PREFIX)) {
          packs[chunk.facadeModuleId.slice(PACK_PREFIX.length)] = '/' + chunk.fileName
        }
      }
    },
    // After everything is written, public/ files included
    closeBundle() {
      const template = readFileSync(templatePath, 'utf8')
      if (!template.includes(PLACEHOLDER)) throw new Error('service-worker: placeholder not found in the template')
      if (Object.keys(packs).length === 0) throw new Error('service-worker: no question pack found in the bundle')
      const manifest = buildManifest(outDir, packs, template)
      writeFileSync(path.join(outDir, 'sw.js'), template.replace(PLACEHOLDER, JSON.stringify(manifest)))
    },
  }
}
