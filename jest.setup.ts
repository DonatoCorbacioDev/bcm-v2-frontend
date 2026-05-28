import "@testing-library/jest-dom";

// Polyfill ResizeObserver for Radix UI components that use @radix-ui/react-use-size
class ResizeObserverMock {
  observe() { /* no-op mock */ }
  unobserve() { /* no-op mock */ }
  disconnect() { /* no-op mock */ }
}
globalThis.ResizeObserver = ResizeObserverMock;
