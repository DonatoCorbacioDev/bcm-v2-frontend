import { renderHook, act, waitFor } from '@testing-library/react';
import { useDarkMode } from '@/hooks/useDarkMode';

describe('useDarkMode', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('reports isDark false when the dark class is absent', () => {
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(false);
  });

  it('reports isDark true when the dark class is present', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(true);
  });

  it('toggle() adds the dark class and persists "dark" to localStorage', async () => {
    const { result } = renderHook(() => useDarkMode());
    act(() => {
      result.current.toggle();
    });
    await waitFor(() => expect(result.current.isDark).toBe(true));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('bcm-theme')).toBe('dark');
  });

  it('toggle() again removes the dark class and persists "light" to localStorage', async () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useDarkMode());
    act(() => {
      result.current.toggle();
    });
    await waitFor(() => expect(result.current.isDark).toBe(false));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('bcm-theme')).toBe('light');
  });
});
