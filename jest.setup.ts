import "@testing-library/jest-dom";

// Polyfill ResizeObserver for Radix UI components that use @radix-ui/react-use-size
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;
