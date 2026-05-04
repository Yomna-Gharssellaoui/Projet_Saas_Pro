import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Expenses } from './Expenses';
import { ExpensesApi } from '@/shared/lib/services/expenses';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock Context Hooks
vi.mock('@/shared/contexts/BusinessContext', () => ({
  useBusinessContext: () => ({
    currentBusiness: { id: 'biz-1', name: 'Test Business', currency: 'TND' },
    isReady: true,
  }),
}));

// Mock API
vi.mock('@/shared/lib/services/expenses', () => ({
  ExpensesApi: {
    list: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

const mockExpenses = [
  {
    id: 'e1',
    description: 'Internet Bill',
    category: 'Utilities',
    amount: 120,
    status: 'pending',
    date: '2026-01-10',
    vendor: 'Ooredoo',
    submittedBy: 'Aziz',
  },
  {
    id: 'e2',
    description: 'Office Supplies',
    category: 'Office',
    amount: 300,
    status: 'approved',
    date: '2026-01-12',
    vendor: 'Librairie',
    submittedBy: 'Rahou',
  }
];

describe('Expenses Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => render(
    <BrowserRouter>
      <Expenses />
    </BrowserRouter>
  );

  it('renders the expenses list and summary', async () => {
    vi.mocked(ExpensesApi.list).mockResolvedValue(mockExpenses as any);
    
    renderPage();

    expect(screen.getByText('Dépenses')).toBeInTheDocument();
    
    expect(await screen.findByText('Internet Bill')).toBeInTheDocument();
    expect(await screen.findByText('Office Supplies')).toBeInTheDocument();
    
    // Summary
    expect(screen.getByText('420,00 TND')).toBeInTheDocument();
    expect(screen.getAllByText('300,00 TND').length).toBeGreaterThan(0);
  });

  it('filters expenses by search', async () => {
    vi.mocked(ExpensesApi.list).mockResolvedValue(mockExpenses as any);
    renderPage();

    await waitFor(() => expect(screen.getByText('Internet Bill')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Rechercher par description/i);
    fireEvent.change(searchInput, { target: { value: 'Supplies' } });

    await waitFor(() => {
      expect(screen.queryByText('Internet Bill')).not.toBeInTheDocument();
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    });
  });

  it('handles empty state', async () => {
    vi.mocked(ExpensesApi.list).mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Aucune dépense trouvée/i)).toBeInTheDocument();
    });
  });
});
