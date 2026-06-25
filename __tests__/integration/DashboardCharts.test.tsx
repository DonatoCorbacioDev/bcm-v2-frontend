import React from 'react';
import { render, screen } from '@testing-library/react';

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Bar: () => null,
  Area: () => null,
  Line: () => null,
  Cell: () => null,
  // Call tickFormatter with a short and a long string to cover both branches of truncate()
  XAxis: ({ tickFormatter }: { tickFormatter?: (v: string) => string }) => {
    tickFormatter?.('Short');
    tickFormatter?.('A very long area name that exceeds the limit');
    return null;
  },
  YAxis: () => null,
  CartesianGrid: () => null,
  // Call formatter to cover the inline arrow functions in each chart's Tooltip
  Tooltip: ({ formatter }: { formatter?: (v: number) => unknown }) => {
    formatter?.(42);
    return null;
  },
  Legend: () => null,
}));

jest.mock('@/hooks/useContractsByArea', () => ({ useContractsByArea: jest.fn() }));
jest.mock('@/hooks/useContractsTimeline', () => ({ useContractsTimeline: jest.fn() }));
jest.mock('@/hooks/useTopManagers', () => ({ useTopManagers: jest.fn() }));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { headers: { common: {} } },
  },
}));

// ─── Imports that reference mocked modules ───────────────────────────────────

import { useContractsByArea } from '@/hooks/useContractsByArea';
import { useContractsTimeline } from '@/hooks/useContractsTimeline';
import { useTopManagers } from '@/hooks/useTopManagers';

import ContractStatsChart from '@/components/dashboard/ContractStatsChart';
import { ContractsByAreaChart } from '@/components/dashboard/ContractsByAreaChart';
import { ContractsTimelineChart } from '@/components/dashboard/ContractsTimelineChart';
import { TopManagersChart } from '@/components/dashboard/TopManagersChart';
import KPICardSkeleton from '@/components/dashboard/KPICardSkeleton';

// ─── ContractStatsChart ───────────────────────────────────────────────────────

describe('ContractStatsChart', () => {
  it('shows "Nessun contratto disponibile" when total is 0', () => {
    render(<ContractStatsChart total={0} active={0} expiring={0} expired={0} />);
    expect(screen.getByText(/nessun contratto disponibile/i)).toBeInTheDocument();
  });

  it('renders chart title when there are contracts', () => {
    render(<ContractStatsChart total={10} active={5} expiring={2} expired={3} />);
    expect(screen.getByText(/distribuzione contratti/i)).toBeInTheDocument();
  });
});

// ─── ContractsByAreaChart ────────────────────────────────────────────────────

describe('ContractsByAreaChart', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading state', () => {
    (useContractsByArea as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<ContractsByAreaChart />);
    expect(screen.getByText(/caricamento/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useContractsByArea as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ContractsByAreaChart />);
    expect(screen.getByText(/impossibile caricare i dati del grafico/i)).toBeInTheDocument();
  });

  it('shows empty state when data is empty', () => {
    (useContractsByArea as jest.Mock).mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<ContractsByAreaChart />);
    expect(screen.getByText(/nessun dato disponibile/i)).toBeInTheDocument();
  });

  it('renders chart title with data', () => {
    (useContractsByArea as jest.Mock).mockReturnValue({
      data: [{ areaName: 'Engineering', count: 5 }],
      isLoading: false,
      isError: false,
    });
    render(<ContractsByAreaChart />);
    expect(screen.getByText(/^contratti per area di business$/i)).toBeInTheDocument();
  });
});

// ─── ContractsTimelineChart ──────────────────────────────────────────────────

describe('ContractsTimelineChart', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading state', () => {
    (useContractsTimeline as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<ContractsTimelineChart />);
    expect(screen.getByText(/caricamento/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useContractsTimeline as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ContractsTimelineChart />);
    expect(screen.getByText(/impossibile caricare i dati del grafico/i)).toBeInTheDocument();
  });

  it('shows empty state when data is empty', () => {
    (useContractsTimeline as jest.Mock).mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<ContractsTimelineChart />);
    expect(screen.getByText(/nessun dato disponibile/i)).toBeInTheDocument();
  });

  it('renders chart title with data', () => {
    (useContractsTimeline as jest.Mock).mockReturnValue({
      data: [{ month: '2024-01', count: 3 }],
      isLoading: false,
      isError: false,
    });
    render(<ContractsTimelineChart />);
    expect(screen.getByText(/andamento contratti/i)).toBeInTheDocument();
  });
});

// ─── TopManagersChart ─────────────────────────────────────────────────────────

describe('TopManagersChart', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading state', () => {
    (useTopManagers as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<TopManagersChart />);
    expect(screen.getByText(/caricamento/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useTopManagers as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<TopManagersChart />);
    expect(screen.getByText(/impossibile caricare i dati del grafico/i)).toBeInTheDocument();
  });

  it('shows empty state when data is empty', () => {
    (useTopManagers as jest.Mock).mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<TopManagersChart />);
    expect(screen.getByText(/nessun dato disponibile/i)).toBeInTheDocument();
  });

  it('renders chart title with data', () => {
    (useTopManagers as jest.Mock).mockReturnValue({
      data: [{ managerName: 'John Doe', contractsCount: 10 }],
      isLoading: false,
      isError: false,
    });
    render(<TopManagersChart />);
    expect(screen.getByText(/top manager/i)).toBeInTheDocument();
  });
});

// ─── KPICardSkeleton ──────────────────────────────────────────────────────────

describe('KPICardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<KPICardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
