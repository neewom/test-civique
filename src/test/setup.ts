import '@testing-library/jest-dom'

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
