import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom has no WebGL: returning null makes Scene3D render its static fallback,
// so three.js is never loaded in unit tests.
HTMLCanvasElement.prototype.getContext = vi.fn(() => null)

// jsdom has no IntersectionObserver, which Motion's whileInView uses.
class MockIntersectionObserver {
  observe() {
    // no-op: nothing is ever "in view" in unit tests
  }
  unobserve() {
    // no-op
  }
  disconnect() {
    // no-op
  }
  takeRecords() {
    return []
  }
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

afterEach(() => {
  cleanup()
})
