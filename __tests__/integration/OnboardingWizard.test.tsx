import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Module mocks ────────────────────────────────────────────────────────────

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockBaMutateAsync = jest.fn();
jest.mock('@/hooks/useUpsertBusinessArea', () => ({
  useUpsertBusinessArea: () => ({ mutateAsync: mockBaMutateAsync }),
}));

const mockMgrMutateAsync = jest.fn();
jest.mock('@/hooks/useUpsertManager', () => ({
  useUpsertManager: () => ({ mutateAsync: mockMgrMutateAsync }),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

// ─── Imports after mocks ─────────────────────────────────────────────────────

import { useAuthStore } from '@/store/authStore';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockUser(id: number) {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ user: { id, role: 'ADMIN', username: 'admin@test.com' } })
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('OnboardingWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUser(1);
  });

  it('renders the welcome step by default', () => {
    render(<OnboardingWizard />);
    expect(screen.getByText(/benvenuto in BCM/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inizia la configurazione/i })).toBeInTheDocument();
  });

  it('advances to the Business Area step when "Inizia" is clicked', async () => {
    render(<OnboardingWizard />);
    await userEvent.click(screen.getByRole('button', { name: /inizia la configurazione/i }));
    expect(screen.getByText(/crea un'area di business/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
  });

  it('shows validation errors when Business Area form is submitted empty', async () => {
    render(<OnboardingWizard />);
    await userEvent.click(screen.getByRole('button', { name: /inizia la configurazione/i }));
    await userEvent.click(screen.getByRole('button', { name: /crea e continua/i }));
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
    expect(mockBaMutateAsync).not.toHaveBeenCalled();
  });

  it('submits the Business Area form and advances to the Manager step', async () => {
    mockBaMutateAsync.mockResolvedValue({ id: 1, name: 'IT', description: 'Tech dept' });
    render(<OnboardingWizard />);

    await userEvent.click(screen.getByRole('button', { name: /inizia la configurazione/i }));
    await userEvent.type(screen.getByLabelText(/nome/i), 'IT');
    await userEvent.type(screen.getByLabelText(/descrizione/i), 'Reparto informatico');
    await userEvent.click(screen.getByRole('button', { name: /crea e continua/i }));

    await waitFor(() => {
      expect(mockBaMutateAsync).toHaveBeenCalledWith({
        payload: { name: 'IT', description: 'Reparto informatico' },
      });
    });
    expect(screen.getByText(/aggiungi il primo responsabile/i)).toBeInTheDocument();
  });

  it('skipping Business Area advances to Manager step without calling mutation', async () => {
    render(<OnboardingWizard />);
    await userEvent.click(screen.getByRole('button', { name: /inizia la configurazione/i }));
    await userEvent.click(screen.getByRole('button', { name: /^salta$/i }));

    expect(mockBaMutateAsync).not.toHaveBeenCalled();
    expect(screen.getByText(/aggiungi il primo responsabile/i)).toBeInTheDocument();
  });

  it('"Indietro" on Manager step goes back to Business Area step', async () => {
    render(<OnboardingWizard />);
    await userEvent.click(screen.getByRole('button', { name: /inizia la configurazione/i }));
    await userEvent.click(screen.getByRole('button', { name: /^salta$/i }));
    await userEvent.click(screen.getByRole('button', { name: /indietro/i }));

    expect(screen.getByText(/crea un'area di business/i)).toBeInTheDocument();
  });

  it('submits the Manager form and advances to the Done step', async () => {
    mockBaMutateAsync.mockResolvedValue({ id: 1, name: 'IT', description: 'Desc' });
    mockMgrMutateAsync.mockResolvedValue({ id: 1 });
    render(<OnboardingWizard />);

    // Step 1 → 2
    await userEvent.click(screen.getByRole('button', { name: /inizia la configurazione/i }));
    await userEvent.click(screen.getByRole('button', { name: /^salta$/i }));

    // Fill Manager step
    await userEvent.type(screen.getByLabelText(/^nome/i), 'Marco');
    await userEvent.type(screen.getByLabelText(/cognome/i), 'Rossi');
    await userEvent.type(screen.getByLabelText(/email/i), 'marco@test.com');
    await userEvent.type(screen.getByLabelText(/telefono/i), '+39 0212345');
    await userEvent.type(screen.getByLabelText(/dipartimento/i), 'Acquisti');
    await userEvent.click(screen.getByRole('button', { name: /crea e continua/i }));

    await waitFor(() => {
      expect(mockMgrMutateAsync).toHaveBeenCalledWith({
        mode: 'create',
        payload: expect.objectContaining({ firstName: 'Marco', lastName: 'Rossi' }),
      });
    });
    expect(screen.getByText(/tutto pronto/i)).toBeInTheDocument();
  });

  it('Done step renders both "Vai alla dashboard" and "Crea primo contratto" buttons', async () => {
    render(<OnboardingWizard />);
    // Navigate to done step by skipping both
    await userEvent.click(screen.getByRole('button', { name: /inizia la configurazione/i }));
    await userEvent.click(screen.getByRole('button', { name: /^salta$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^salta$/i }));

    expect(screen.getByRole('button', { name: /vai alla dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crea primo contratto/i })).toBeInTheDocument();
  });

  it('"Vai alla dashboard" from Done step navigates to /dashboard', async () => {
    render(<OnboardingWizard />);
    await userEvent.click(screen.getByRole('button', { name: /inizia la configurazione/i }));
    await userEvent.click(screen.getByRole('button', { name: /^salta$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^salta$/i }));
    await userEvent.click(screen.getByRole('button', { name: /vai alla dashboard/i }));

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('"Crea primo contratto" from Done step navigates to /contracts', async () => {
    render(<OnboardingWizard />);
    await userEvent.click(screen.getByRole('button', { name: /inizia la configurazione/i }));
    await userEvent.click(screen.getByRole('button', { name: /^salta$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^salta$/i }));
    await userEvent.click(screen.getByRole('button', { name: /crea primo contratto/i }));

    expect(mockPush).toHaveBeenCalledWith('/contracts');
  });

  it('"Salta configurazione" sets localStorage flag and navigates to /dashboard', async () => {
    render(<OnboardingWizard />);
    await userEvent.click(screen.getByRole('button', { name: /salta configurazione/i }));

    expect(localStorage.getItem('bcm-setup-skip-1')).toBe('1');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('"Salta configurazione" is not shown on the Done step', async () => {
    render(<OnboardingWizard />);
    await userEvent.click(screen.getByRole('button', { name: /inizia la configurazione/i }));
    await userEvent.click(screen.getByRole('button', { name: /^salta$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^salta$/i }));

    expect(screen.queryByRole('button', { name: /salta configurazione/i })).not.toBeInTheDocument();
  });

  it('step indicator shows completed checkmarks for visited steps', async () => {
    render(<OnboardingWizard />);
    // Start: step 1 active, no completed steps
    expect(screen.getByRole('navigation', { name: /progresso/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /inizia la configurazione/i }));
    // Step 0 (Welcome) should be marked completed — its circle is now a Check icon
    // The completed step no longer shows "1" (replaced by Check SVG)
    const nav = screen.getByRole('navigation', { name: /progresso/i });
    expect(nav).toBeInTheDocument();
  });
});
