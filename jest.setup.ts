import "@testing-library/jest-dom";

// DOM-only polyfills — skipped for suites that opt into `@jest-environment
// node` (e.g. proxy.ts's middleware tests, which need Fetch API globals node
// provides but jsdom doesn't, and have no DOM to polyfill in the first place).
if (typeof window !== "undefined") {
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
}

// jsdom's Blob has no text() (browsers all do): read it through FileReader,
// so code can use the standard method (lib/apiError reads failed downloads).
if (typeof Blob !== "undefined" && !Blob.prototype.text) {
  Blob.prototype.text = function text(this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(reader.error ?? new Error("Blob read failed"));
      reader.readAsText(this);
    });
  };
}
