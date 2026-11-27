import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'
import { loadQuestionPack } from '@/lib/question-packs'
import { resetTargetTitleForTests, TITLE_KEYS } from '@/lib/target-title'

// The target title chosen during a visit is kept in memory: each test starts without it
beforeEach(async () => {
  resetTargetTitleForTests()
  // The questions load on demand in the app; here every pack is in memory before each test, so that
  // a page renders its questions at once. A test of the loading itself resets them first
  // (resetQuestionPacksForTests) and the next test gets them back.
  await Promise.all(TITLE_KEYS.map((title) => loadQuestionPack(title)))
})

// @base-ui/react uses PointerEvent internally; JSDOM doesn't provide it
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    pointerId?: number
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId
    }
  }
  globalThis.PointerEvent = PointerEvent as unknown as typeof globalThis.PointerEvent
}

// JSDOM doesn't implement window.scrollTo (used by ScrollToTop): a no-op keeps the logs clean
window.scrollTo = (() => {}) as typeof window.scrollTo
