import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/hooks/useDashboardStats', () => ({ useInvoicingSummary: jest.fn() }));

import { useInvoicingSummary } from '@/hooks/useDashboardStats';
import { SupplierInvoicesSummary } from '@/components/dashboard/SupplierInvoicesSummary';

const summary = (over: object) => ({
  data: { year: 2026, expectedYtd: 78800, invoicedYtd: 67500, variance: -11300, variancePercent: -14.34, ...over },
});

describe('SupplierInvoicesSummary', () => {
  it("compares this year's expected supplier costs with the invoices confirmed, and says what is pending", () => {
    (useInvoicingSummary as jest.Mock).mockReturnValue(summary({}));
    render(<SupplierInvoicesSummary invoicesToMatch={2} />);

    expect(screen.getByRole('heading', { name: 'Fatture dei fornitori nel 2026' })).toBeInTheDocument();
    expect(screen.getByText(/Previste 78\.800\s€ · ricevute e confermate 67\.500\s€/)).toBeInTheDocument();
    expect(screen.getByText('(-14%)')).toBeInTheDocument();
    expect(screen.getByText(/2 fatture da confermare/)).toBeInTheDocument();
  });

  it('says "1 fattura" in the singular and nothing when none is pending', () => {
    (useInvoicingSummary as jest.Mock).mockReturnValue(summary({}));
    const { rerender } = render(<SupplierInvoicesSummary invoicesToMatch={1} />);
    expect(screen.getByText(/1 fattura da confermare/)).toBeInTheDocument();

    rerender(<SupplierInvoicesSummary invoicesToMatch={0} />);
    expect(screen.queryByText(/da confermare/)).not.toBeInTheDocument();
  });

  it('stays hidden while loading or when no supplier cost is expected yet', () => {
    (useInvoicingSummary as jest.Mock).mockReturnValue({ data: undefined });
    const { container, rerender } = render(<SupplierInvoicesSummary invoicesToMatch={0} />);
    expect(container).toBeEmptyDOMElement();

    (useInvoicingSummary as jest.Mock).mockReturnValue(summary({ expectedYtd: 0, invoicedYtd: 0, variancePercent: 0 }));
    rerender(<SupplierInvoicesSummary invoicesToMatch={0} />);
    expect(container).toBeEmptyDOMElement();
  });
});
