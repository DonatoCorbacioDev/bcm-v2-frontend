import "@testing-library/jest-dom";

// Polyfill ResizeObserver for Radix UI components that use @radix-ui/react-use-size
class ResizeObserverMock {
  observe() { /* no-op mock */ }
  unobserve() { /* no-op mock */ }
  disconnect() { /* no-op mock */ }
}
globalThis.ResizeObserver = ResizeObserverMock;

// Polyfill matchMedia — not implemented in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});
