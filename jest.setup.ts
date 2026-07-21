import "@testing-library/jest-dom";

// Polyfill ResizeObserver for Radix UI components that use @radix-ui/react-use-size
class ResizeObserverMock {
  observe() { /* no-op mock */ }
  unobserve() { /* no-op mock */ }
  disconnect() { /* no-op mock */ }
}
globalThis.ResizeObserver = ResizeObserverMock;

// Polyfill matchMedia — not implemented in jsdom
Object.defineProperty(globalThis, "matchMedia", {
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

// Polyfill pointer-capture APIs and scrollIntoView — not implemented in jsdom,
// but required by Radix UI's Select (and other popover-based primitives) to
// open/position themselves. Without these, clicking a Select trigger in a
// test silently fails to open the listbox.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
