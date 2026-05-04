import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ViewInvoice } from './ViewInvoice';
import { InvoicesApi } from '@/shared/lib/services/invoices';
import { ClientsApi } from '@/shared/lib/services/clients';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

// Mock Context Hooks
vi.mock('@/shared/contexts/BusinessContext', () => ({
  useBusinessContext: () => ({
    currentBusiness: { id: 'biz-1', name: 'Test Business', currency: 'TND' },
    isReady: true,
  }),
}));

// Mock API
vi.mock('@/shared/lib/services/invoices', () => ({
  InvoicesApi: {
    get: vi.fn(),
    markSent: vi.fn(),
    markPaid: vi.fn(),
  },
}));

vi.mock('@/shared/lib/services/clients', () => ({
  ClientsApi: {
    get: vi.fn(),
  },
}));

const mockInvoice = {
  id: 'inv-123',
  invoiceNumber: 'INV-2026-001',
  clientId: 'c1',
  clientName: 'Client A',
  subtotal: 1000,
  taxAmount: 190,
  totalAmount: 1190,
  paidAmount: 0,
  status: 'draft',
  currency: 'TND',
  issueDate: '2026-05-01',
  dueDate: '2026-05-15',
  items: [
    { id: 'item-1', description: 'Item 1', quantity: 1, unitPrice: 1000, amount: 1000, taxRate: 19 }
  ]
};

describe('ViewInvoice Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_user', JSON.stringify({ role: 'business_owner', id: 'u1' }));
  });

  const renderWithParams = (id: string) => render(
    <MemoryRouter initialEntries={[`/dashboard/invoices/view/${id}`]}>
      <Routes>
        <Route path="/dashboard/invoices/view/:id" element={<ViewInvoice />} />
      </Routes>
    </MemoryRouter>
  );

  it('renders the invoice details', async () => {
    vi.mocked(InvoicesApi.get).mockResolvedValue(mockInvoice as any);
    vi.mocked(ClientsApi.get).mockResolvedValue({ id: 'c1', name: 'Client A' } as any);
    
    renderWithParams('inv-123');

    expect(screen.getByText(/Loading invoice.../i)).toBeInTheDocument();
    
    const invoiceNumbers = await screen.findAllByText('INV-2026-001');
    expect(invoiceNumbers[0]).toBeInTheDocument();
    expect(screen.getAllByText('1190.00 TND')[0]).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('handles invoice not found', async () => {
    vi.mocked(InvoicesApi.get).mockRejectedValue(new Error('Not found'));
    
    renderWithParams('inv-unknown');

    await waitFor(() => {
      expect(screen.getByText(/Invoice not found/i)).toBeInTheDocument();
    });
  });
});
