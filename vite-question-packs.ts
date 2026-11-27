import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

// One pack of questions per title, cut at build time from src/data/questions.json (the only
// source). Each pack is a virtual module, `virtual:question-pack/<title>`, that the app
// imports dynamically (src/lib/question-packs.ts): the bundler makes one chunk of each, so
// no question is part of the JavaScript of the first screen.
// Keep in step with TITLE_KEYS of src/lib/target-title.ts (checked by src/lib/question-packs.test.ts).
const TITLES = ['pluriannuelle', 'resident', 'naturalisation']

const PREFIX = 'virtual:question-pack/'
const RESOLVED = '\0' + PREFIX

export function questionPacks(): Plugin {
  const source = path.resolve(import.meta.dirname, 'src/data/questions.json')
  return {
    name: 'question-packs',
    resolveId(id) {
      if (id.startsWith(PREFIX) && TITLES.includes(id.slice(PREFIX.length))) return '\0' + id
      return null
    },
    load(id) {
      if (!id.startsWith(RESOLVED)) return null
      const title = id.slice(RESOLVED.length)
      this.addWatchFile(source)
      const questions = JSON.parse(readFileSync(source, 'utf8')) as { lists: string[] }[]
      // A question of several titles is in each of their packs
      const pack = questions.filter((q) => q.lists.includes(title))
      // JSON.parse of a string literal parses faster than an equivalent object literal
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(pack))})`
    },
  }
}
