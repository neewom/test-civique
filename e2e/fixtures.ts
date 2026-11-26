import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test as base, expect, type Page } from '@playwright/test'

export { expect }

export const APP_NAME = 'Futur Citoyen'
export const EXAM_SIZE = 40
export const PASS_THRESHOLD = 32
const LAST_OFFICIAL_ID = 191

export interface Question {
  id: number
  theme: string
  question: string
  answers: string[]
  source?: { url: string; label: string }
}

// The questions are drawn at random: tests read the data instead of naming a question
export const QUESTIONS: Question[] = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../src/data/questions.json'), 'utf8'),
)
export const SITUATION_COUNT = QUESTIONS.filter((q) => q.id > LAST_OFFICIAL_ID).length
export const THEMES = [...new Set(QUESTIONS.map((q) => q.theme))]

const GOATCOUNTER = /(^|\.)goatcounter\.com$/

function isGoatCounter(url: string): boolean {
  try {
    return GOATCOUNTER.test(new URL(url).hostname)
  } catch {
    return false
  }
}

function isDeployPreview(url: string): boolean {
  try {
    return new URL(url).hostname.startsWith('deploy-preview-')
  } catch {
    return false
  }
}

export interface Guard {
  /** GoatCounter requests stopped by the route (none expected outside production) */
  blocked: string[]
}

/**
 * Every test gets a fresh context (empty localStorage) and, automatically:
 * - every request to goatcounter.com aborted; the test fails if one is not routed,
 *   or if one ever gets a response: our runs on production must never be counted;
 * - no console error, uncaught exception, failed request or HTTP error (GoatCounter aside).
 */
export const test = base.extend<{ guard: Guard }>({
  guard: [
    async ({ context, page }, use) => {
      const blocked: string[] = []
      const seen: string[] = []
      const leaks: string[] = []
      const problems: string[] = []

      await context.route(
        (url) => GOATCOUNTER.test(url.hostname),
        (route) => {
          blocked.push(route.request().url())
          return route.abort('blockedbyclient')
        },
      )
      // Netlify injects its review drawer into deploy previews only; our CSP blocks it and
      // it logs errors that are not the app's: served empty so previews test the app alone
      await context.route('**/.netlify/scripts/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
      )
      context.on('request', (r) => {
        if (isGoatCounter(r.url())) seen.push(r.url())
      })
      context.on('response', (r) => {
        if (isGoatCounter(r.url())) leaks.push(`response ${r.status()} ${r.url()}`)
      })
      context.on('requestfinished', (r) => {
        if (isGoatCounter(r.url())) leaks.push(`finished ${r.url()}`)
      })

      page.on('console', (m) => {
        // The blocked GoatCounter requests log a load error that names them in its location
        if (m.type() !== 'error' || isGoatCounter(m.location().url) || /goatcounter/i.test(m.text())) return
        // Deploy previews only: the div Netlify inserts carries style="position:fixed", which
        // our CSP blocks; the production run still catches any inline style of the app itself
        if (isDeployPreview(m.location().url) && m.text().startsWith('Applying inline style violates')) return
        problems.push(`console: ${m.text()} (${m.location().url})`)
      })
      page.on('pageerror', (e) => problems.push(`exception: ${e.message}`))
      page.on('requestfailed', (r) => {
        if (!isGoatCounter(r.url())) problems.push(`request failed: ${r.url()} ${r.failure()?.errorText}`)
      })
      page.on('response', (r) => {
        if (r.status() >= 400 && !isGoatCounter(r.url())) problems.push(`HTTP ${r.status()}: ${r.url()}`)
      })

      await use({ blocked })

      expect(leaks, 'GoatCounter request that reached the network').toEqual([])
      expect(
        seen.filter((u) => !blocked.includes(u)),
        'GoatCounter request not stopped by the route',
      ).toEqual([])
      expect(problems, 'console errors and failed requests').toEqual([])
    },
    { auto: true },
  ],
})

/** Checks of every visited page: tab title, and no horizontal overflow on a phone. */
export async function expectPage(page: Page, title: string) {
  await expect(page).toHaveTitle(`${title} · ${APP_NAME}`)
  const width = page.viewportSize()?.width ?? 0
  if (width <= 390) {
    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }))
    expect(sizes.scroll, `horizontal overflow on ${page.url()}`).toBeLessThanOrEqual(sizes.inner)
  }
}

/** Explicit preparation: the multi-year permit already chosen, as after the first visit. */
export async function withTitleChosen(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('target-title')) localStorage.setItem('target-title', 'pluriannuelle')
  })
}
