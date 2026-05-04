import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { useBusinessContext } from '@/shared/contexts/BusinessContext';
import { InvoicesApi } from '@/shared/lib/services/invoices';
import { ExpensesApi } from '@/shared/lib/services/expenses';
import { ClientsApi } from '@/shared/lib/services/clients';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/shared/contexts/BusinessContext', () => ({
  useBusinessContext: vi.fn(),
}));

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

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state if no business is selected', () => {
    (useBusinessContext as any).mockReturnValue({ currentBusiness: null });
    renderDashboard();
    expect(screen.getByText(/Aucune entreprise sélectionnée/i)).toBeInTheDocument();
  });

  it('should load and display business metrics', async () => {
    const mockBusiness = { id: 'biz-1', name: 'My Business', currency: 'TND' };
    (useBusinessContext as any).mockReturnValue({ currentBusiness: mockBusiness });
    
    vi.mocked(InvoicesApi.list).mockResolvedValue([
      { id: '1', status: 'paid', totalAmount: 1000, paidAmount: 1000, issueDate: '2026-01-01', invoiceNumber: 'INV-001' },
      { id: '2', status: 'sent', totalAmount: 500, issueDate: '2026-01-02', invoiceNumber: 'INV-002' },
    ]);
    vi.mocked(ExpensesApi.list).mockResolvedValue([
      { id: 'e1', status: 'approved', amount: 300, date: '2026-01-01' },
    ]);
    vi.mocked(ClientsApi.list).mockResolvedValue([
      { id: 'c1', name: 'Client A' },
    ]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Overview of your business performance/i)).toBeInTheDocument();
    });

    // Use getAllByText for money values as they might appear in metrics and list
    expect(screen.getAllByText('1000.00 TND').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('500.00 TND').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('300.00 TND').length).toBeGreaterThanOrEqual(1);
  });

  it('should display AI insights based on data', async () => {
    const mockBusiness = { id: 'biz-1', name: 'My Business', currency: 'TND' };
    (useBusinessContext as any).mockReturnValue({ currentBusiness: mockBusiness });
    
    vi.mocked(InvoicesApi.list).mockResolvedValue([
      { id: '1', status: 'overdue', totalAmount: 200, issueDate: '2026-01-01', invoiceNumber: 'INV-001' },
    ]);
    vi.mocked(ExpensesApi.list).mockResolvedValue([]);
    vi.mocked(ClientsApi.list).mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/AI-Powered Business Insights/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Overdue invoices need follow-up/i)).toBeInTheDocument();
  });

  it('should show error toast if API fails', async () => {
    const mockBusiness = { id: 'biz-1', name: 'My Business' };
    (useBusinessContext as any).mockReturnValue({ currentBusiness: mockBusiness });
    
    vi.mocked(InvoicesApi.list).mockRejectedValue(new Error('API Failure'));

    renderDashboard();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
