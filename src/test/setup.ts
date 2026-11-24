import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'
import { resetTargetTitleForTests } from '@/lib/target-title'

// The target title chosen during a visit is kept in memory: each test starts without it
beforeEach(() => {
  resetTargetTitleForTests()
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
