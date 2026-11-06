/**
 * @jest-environment node
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useDarkMode } from '@/hooks/useDarkMode';

// The first render happens on the server, where there's no window: both hooks
// must fall back to the desktop, light layout instead of throwing.
function Probe() {
  const mobile = useIsMobile();
  const { isDark } = useDarkMode();
  return <span>{`${mobile}-${isDark}`}</span>;
}

describe('hooks on the server', () => {
  it('render the desktop, light layout without a window', () => {
    expect(renderToString(<Probe />)).toContain('false-false');
  });
});
