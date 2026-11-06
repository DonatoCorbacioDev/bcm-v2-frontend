import { renderHook } from '@testing-library/react';
import { useIsMobile } from '@/hooks/useIsMobile';

const original = globalThis.matchMedia;

afterEach(() => {
  Object.defineProperty(globalThis, 'matchMedia', { writable: true, value: original });
});

describe('useIsMobile', () => {
  it('is true on a phone-sized screen and stops listening on unmount', () => {
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: (query: string) => ({ matches: true, media: query, addEventListener, removeEventListener }),
    });

    const { result, unmount } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('falls back to the desktop layout where matchMedia does not exist', () => {
    Object.defineProperty(globalThis, 'matchMedia', { writable: true, value: undefined });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});
