import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Reports } from './Reports';
import { InvoicesApi } from '@/shared/lib/services/invoices';
import { ExpensesApi } from '@/shared/lib/services/expenses';
import { ClientsApi } from '@/shared/lib/services/clients';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock Context Hooks
vi.mock('@/shared/contexts/BusinessContext', () => ({
  useBusinessContext: () => ({
    currentBusiness: { id: 'biz-1', name: 'Test Business', currency: 'TND' },
    isReady: true,
  }),
}));

// Mock APIs
vi.mock('@/shared/lib/services/invoices', () => ({
  InvoicesApi: {
    list: vi.fn(),
  },
}));
vi.mock('@/shared/lib/services/expenses', () => ({
  ExpensesApi: {
    list: vi.fn(),
  },
}));
vi.mock('@/shared/lib/services/clients', () => ({
  ClientsApi: {
    list: vi.fn(),
  },
}));

// Mock Recharts to avoid SVG/DOM issues in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: () => <div data-testid="line-chart" />,
  BarChart: () => <div data-testid="bar-chart" />,
  PieChart: () => <div data-testid="pie-chart" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Line: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
}));

describe('Reports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => render(
    <BrowserRouter>
      <Reports />
    </BrowserRouter>
  );

  it('renders reports and key financial metrics', async () => {
    vi.mocked(InvoicesApi.list).mockResolvedValue([
      { id: 'i1', status: 'paid', paidAmount: 1000, issueDate: new Date().toISOString() }
    ] as any);
    vi.mocked(ExpensesApi.list).mockResolvedValue([
      { id: 'e1', status: 'approved', amount: 400, date: new Date().toISOString(), category: 'Office' }
    ] as any);
    vi.mocked(ClientsApi.list).mockResolvedValue([]);

    renderPage();

    const revenueElements = await screen.findAllByText('1000.00 TND');
    expect(revenueElements[0]).toBeInTheDocument();
    const expenseElements = await screen.findAllByText('400.00 TND');
    expect(expenseElements[0]).toBeInTheDocument();
    const profitElements = await screen.findAllByText('600.00 TND');
    expect(profitElements[0]).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    vi.mocked(InvoicesApi.list).mockReturnValue(new Promise(() => {})); // Never resolves
    renderPage();
    expect(screen.getByText(/Loading reports/i)).toBeInTheDocument();
  });
});
