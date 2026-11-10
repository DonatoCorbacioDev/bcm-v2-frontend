import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen, within } from '@testing-library/react';

const replace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import { useAuthStore } from '@/store/authStore';
import SettingsPage from '@/app/(dashboard)/settings/page';
import { SETTINGS_SECTIONS } from '@/components/settings/settingsSections';
import { SETTINGS_ROUTES, navGroups } from '@/components/layout/sidebarNavConfig';
import { uid } from "../mocks/ids";

const mockRole = (role: string | null) => {
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ user: role ? { id: uid(1), username: 'user', role } : null })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRole('ADMIN');
});

describe('SettingsPage', () => {
  it('groups every page that left the sidebar, each with what it is for', () => {
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Impostazioni' })).toBeInTheDocument();
    for (const section of SETTINGS_SECTIONS) {
      const region = screen.getByRole('region', { name: section.title });
      for (const link of section.links) {
        const anchor = within(region).getByRole('link', { name: new RegExp(link.label) });
        expect(anchor).toHaveAttribute('href', link.href);
        expect(anchor).toHaveTextContent(link.description);
      }
    }
  });

  it('sends a MANAGER back to the home page', () => {
    mockRole('MANAGER');
    const { container } = render(<SettingsPage />);

    expect(replace).toHaveBeenCalledWith('/dashboard');
    expect(container).toBeEmptyDOMElement();
  });
});

describe('the short menu leaves no page unreachable', () => {
  const listed = SETTINGS_SECTIONS.flatMap((section) => section.links.map((link) => link.href));
  const inMenu = navGroups.flatMap((group) => group.items.map((item) => item.href));

  it('lists on the settings page exactly the routes that keep Impostazioni highlighted', () => {
    expect([...listed].sort()).toEqual([...SETTINGS_ROUTES].sort());
  });

  it('reaches every dashboard page from the menu or from Impostazioni', () => {
    const dashboardDir = path.join(process.cwd(), 'app', '(dashboard)');
    // Detail pages ([id]) are reached from their list; onboarding and profile
    // from the first-run flow and the header.
    const notInNavigation = new Set(['/onboarding', '/profile']);
    const topLevelPages = fs.readdirSync(dashboardDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dashboardDir, entry.name, 'page.tsx')))
      .map((entry) => `/${entry.name}`)
      .filter((route) => !notInNavigation.has(route));

    const unreachable = topLevelPages.filter((route) => !inMenu.includes(route) && !listed.includes(route));
    expect(unreachable).toEqual([]);
  });
});
