#!/usr/bin/env node
// Detect questions whose correct answer can be spotted by its *shape* alone,
// without knowing the subject.
//
// The exam draws one correct answer (from `answers`) and 3 distractors (from
// `distractors`). For every correct answer and every combination of 3
// drawable distractors, we check whether the correct answer is the ONLY one
// of the 4 options to carry a given trait (longest by far, only comma, ...).
// A question is reported when, for at least one correct answer and one trait,
// the answer stands out in at least `--min-share` of the draws (default 0.5).
//
// Usage:
//   node scripts/detect-shape-giveaways.mjs <questions.json> [fromId] [toId] [--min-share=0.5]
// Output: JSON array on stdout, sorted by highest share (desc), then id.
//
// No dependencies. This is an audit tool, not a blocking test: a trait being
// unique does not always give the answer away; a human triage follows.

import { readFileSync } from 'node:fs'

// --- Thresholds -------------------------------------------------------------

// The correct answer is "much longer" when it is at least LONG_RATIO times as
// long (in characters) as EACH of the 3 drawn distractors. 1.4 means a 40 %
// gap with the second-longest option: visibly the odd one out on a phone
// screen, while ordinary variation between options (10-30 %) is not flagged.
const LONG_RATIO = 1.4
// Symmetric inverse: the correct answer is the only short one when each drawn
// distractor is at least LONG_RATIO times as long as it.
const SHORT_RATIO = 1.4
// Minimum length (characters) for the "short" trait to matter: below that,
// all options are short anyway (names, dates) and the comparison is noise.
const SHORT_MIN_DISTRACTOR_LENGTH = 25

// Absolute words that make a distractor sound excessive; the correct answer
// being the only option without one is a "nuance" giveaway.
const ABSOLUTE_WORDS = [
  'toujours', 'jamais', 'tous', 'toutes', 'tout', 'aucun', 'aucune',
  'seul', 'seule', 'seuls', 'seules', 'seulement', 'uniquement',
  'obligatoirement', 'interdit', 'interdite', 'interdits', 'interdites',
  'totalement', 'entièrement', 'exclusivement', 'rien', 'personne',
]

// French stop words ignored when looking for a question word repeated in the
// answer.
const STOP_WORDS = new Set([
  'alors', 'avant', 'avoir', 'cette', 'celle', 'celui', 'comme', 'dans',
  'depuis', 'doit', 'doivent', 'elle', 'elles', 'entre', 'est-ce', 'faire',
  'leur', 'leurs', 'mais', 'nous', 'notre', 'parmi', 'peut', 'peuvent',
  'pour', 'quand', 'quel', 'quelle', 'quelles', 'quels', 'quoi', 'sans',
  'sont', 'sous', 'suivantes', 'suivants', 'votre', 'vous', 'être', 'avez',
  'êtes', 'qu\'est-ce', 'quelqu\'un', 'france', 'français', 'française',
])

// --- Helpers ----------------------------------------------------------------

const normalize = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim()

const words = (s) =>
  normalize(s)
    .toLowerCase()
    .split(/[^a-zàâäçéèêëîïôöùûüœæ'-]+/i)
    .map((w) => w.replace(/^[a-z]'/, '')) // l'État -> état, d'un -> un
    .filter(Boolean)

const firstWord = (s) => words(s)[0] ?? ''

// A crude stem so that "vote" / "voter" / "votes" match.
const stem = (w) => w.slice(0, 5)

const contentStems = (s) =>
  new Set(words(s).filter((w) => w.length >= 5 && !STOP_WORDS.has(w)).map(stem))

const POLARITY = ['oui', 'non', 'vrai', 'faux']
const isBareYesNo = (s) => /^(oui|non)\.?$/i.test(normalize(s))
const hasAbsolute = (s) => words(s).some((w) => ABSOLUTE_WORDS.includes(w))

// Restriction markers ("Oui, mais seulement si ..."): the correct answer
// being the only option without one is the "unqualified answer" giveaway.
// Letter boundaries instead of \b, which does not work next to accented letters (« à condition »)
const RESTRICTION = /(?<!\p{L})(mais|sauf|seulement|uniquement|si|s'il|s'ils|à condition|tant que|à moins)(?!\p{L})/iu
const hasRestriction = (s) => RESTRICTION.test(normalize(s))

// Binary traits: the correct answer has it and none of the 3 distractors do.
const BINARY_TRAITS = {
  virgule: (s) => s.includes(','),
  parenthese: (s) => /[()]/.test(s),
  chiffre: (s) => /\d/.test(s),
  guillemets: (s) => /[«»"“”]/.test(s),
  'deux-points-ou-point-virgule': (s) => /[:;]/.test(s),
}

/**
 * Returns, for one correct answer and 3 drawn distractors, the list of traits
 * that make the answer the odd one out.
 */
function oddTraits(answer, drawn, question) {
  const found = []
  for (const [name, has] of Object.entries(BINARY_TRAITS)) {
    if (has(answer) && !drawn.some(has)) found.push(name)
    // Inverse: the 3 distractors share the mark, the answer alone lacks it
    // (e.g. every distractor ends with a year in parentheses).
    if (!has(answer) && drawn.every(has)) found.push(`sans-${name}`)
  }

  const len = normalize(answer).length
  const lens = drawn.map((d) => normalize(d).length)
  if (lens.every((l) => len >= LONG_RATIO * l)) found.push('plus-longue')
  if (
    lens.every((l) => l >= SHORT_MIN_DISTRACTOR_LENGTH && l >= SHORT_RATIO * len)
  ) {
    found.push('seule-courte')
  }

  // Opening: the 3 distractors share the same first word and the answer does
  // not (e.g. three "Il faut ..." and one "C'est ...").
  const fa = firstWord(answer)
  const fd = drawn.map(firstWord)
  if (fd.every((w) => w === fd[0]) && fa !== fd[0]) found.push('debut-propre')

  // Polarity: the answer is the only option opening with its "Oui" / "Non"
  // (or "Vrai" / "Faux"), e.g. one "Non, ..." against "Oui, si ..." and
  // "Cela dépend ...".
  if (POLARITY.includes(fa) && !fd.includes(fa)) found.push('seule-polarite')

  if (isBareYesNo(answer) && !drawn.some(isBareYesNo)) found.push('oui-non-seul')

  // Tone: every drawn distractor carries an absolute word, the answer none.
  if (!hasAbsolute(answer) && drawn.every(hasAbsolute)) found.push('seule-sans-absolu')

  if (!hasRestriction(answer) && drawn.every(hasRestriction)) found.push('seule-sans-reserve')

  // A content word of the question repeated in the answer only.
  const q = contentStems(question)
  const shares = (s) => [...contentStems(s)].some((w) => q.has(w))
  if (shares(answer) && !drawn.some(shares)) found.push('seule-reprend-la-question')

  return found
}

function* combinations(items, k, start = 0, prefix = []) {
  if (prefix.length === k) {
    yield prefix
    return
  }
  for (let i = start; i <= items.length - (k - prefix.length); i++) {
    yield* combinations(items, k, i + 1, [...prefix, items[i]])
  }
}

// --- Main -------------------------------------------------------------------

function analyse(question, minShare) {
  const perAnswer = []
  for (const answer of question.answers) {
    const counts = {}
    let total = 0
    for (const drawn of combinations(question.distractors, 3)) {
      total++
      for (const t of oddTraits(answer, drawn, question.question)) {
        counts[t] = (counts[t] ?? 0) + 1
      }
    }
    const shares = Object.fromEntries(
      Object.entries(counts)
        .map(([t, c]) => [t, Math.round((c / total) * 100) / 100])
        .sort((a, b) => b[1] - a[1]),
    )
    perAnswer.push({ answer, draws: total, shares })
  }

  // Traits reaching the threshold for at least one answer, with the highest
  // share observed across answers.
  const flagged = {}
  for (const { shares } of perAnswer) {
    for (const [t, s] of Object.entries(shares)) {
      if (s >= minShare) flagged[t] = Math.max(flagged[t] ?? 0, s)
    }
  }
  if (Object.keys(flagged).length === 0) return null
  return {
    id: question.id,
    traits: Object.keys(flagged).sort((a, b) => flagged[b] - flagged[a]),
    parts: flagged,
    maxShare: Math.max(...Object.values(flagged)),
    perAnswer,
  }
}

function main() {
  const args = process.argv.slice(2)
  const opts = Object.fromEntries(
    args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')),
  )
  const positional = args.filter((a) => !a.startsWith('--'))
  const [path, from = '1', to = 'Infinity'] = positional
  // Refuse what would otherwise be silently ignored (« --min-share 0.3 » without « = », unknown options)
  const badOption = args.find((a) => a.startsWith('--') && !/^--min-share=[^=]+$/.test(a))
  if (badOption || positional.length > 3) {
    console.error(`Unexpected argument: ${badOption ?? positional[3]}`)
    process.exit(2)
  }
  if (!path) {
    console.error('Usage: detect-shape-giveaways.mjs <questions.json> [fromId] [toId] [--min-share=0.5]')
    process.exit(1)
  }
  const minShare = Number(opts['min-share'] ?? 0.5)
  if (!Number.isFinite(minShare) || minShare <= 0 || minShare > 1) {
    console.error('--min-share must be a number in (0, 1], written --min-share=0.5')
    process.exit(2)
  }
  const questions = JSON.parse(readFileSync(path, 'utf8'))
  const out = questions
    .filter((q) => q.id >= Number(from) && q.id <= Number(to))
    .filter((q) => q.distractors.length >= 3)
    .map((q) => analyse(q, minShare))
    .filter(Boolean)
    .sort((a, b) => b.maxShare - a.maxShare || a.id - b.id)
  console.log(JSON.stringify(out, null, 2))
}

main()
