import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DemoPage from '@/app/(auth)/demo/page';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { useAuthStore } from '@/store/authStore';

const replace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: jest.fn() }) }));

const login = jest.fn();
jest.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ login }) }));

jest.mock('@/store/authStore', () => ({ useAuthStore: jest.fn() }));

/** "Prova la demo" goes straight in, and inside, the demo says what it is. */
describe('demo entry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('signs in with the public demo account once and goes to the Home', async () => {
    login.mockResolvedValue({ success: true });
    render(<DemoPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Apro la demo');
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    expect(login).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith({ username: 'demo', password: expect.any(String) });
  });

  it('when signing in fails, says so and offers to retry or to use the login page', async () => {
    login.mockResolvedValueOnce({ success: false }).mockResolvedValueOnce({ success: true });
    render(<DemoPage />);

    expect(await screen.findByRole('heading', { name: 'La demo non si è aperta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Vai all'accesso" })).toHaveAttribute('href', '/login?demo=1');

    await userEvent.click(screen.getByRole('button', { name: 'Riprova' }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('the banner shows only to the demo account, with the way to an account of ones own', () => {
    const store = useAuthStore as unknown as jest.Mock;
    store.mockImplementation((selector) => selector({ user: { username: 'demo' } }));
    const { unmount } = render(<DemoBanner />);
    expect(screen.getByText(/Stai usando la demo/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crea il tuo account gratuito' })).toHaveAttribute('href', '/register-org');
    unmount();

    store.mockImplementation((selector) => selector({ user: { username: 'mario.rossi' } }));
    const { container } = render(<DemoBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
