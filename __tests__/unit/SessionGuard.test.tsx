import React from 'react';
import { render } from '@testing-library/react';

const mockUseSessionGuard = jest.fn();
jest.mock('@/hooks/useSessionGuard', () => ({
  useSessionGuard: () => mockUseSessionGuard(),
}));

import { SessionGuard } from '@/components/providers/SessionGuard';

describe('SessionGuard', () => {
  it('invokes useSessionGuard and renders nothing', () => {
    const { container } = render(<SessionGuard />);
    expect(mockUseSessionGuard).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();
  });
});
