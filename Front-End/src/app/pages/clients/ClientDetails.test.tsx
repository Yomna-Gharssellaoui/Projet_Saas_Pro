import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ClientDetails } from './ClientDetails';
import { api } from '@/shared/lib/apiClient';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

// Mock Context Hooks
vi.mock('@/shared/contexts/BusinessContext', () => ({
  useBusinessContext: () => ({
    currentBusiness: { id: 'biz-1', name: 'Test Business', currency: 'TND' },
    isReady: true,
  }),
}));

// Mock API
vi.mock('@/shared/lib/apiClient', () => ({
  api: vi.fn(),
}));

const mockClient = {
  id: 'c1',
  name: 'Acme Corp',
  email: 'acme@example.com',
  totalRevenue: 5000,
  outstandingBalance: 1000,
  createdAt: '2026-01-01',
};

const mockInvoices = [
  { 
    id: 'inv-1', 
    invoiceNumber: 'INV-001', 
    clientId: 'c1', 
    issueDate: '2026-05-01', 
    dueDate: '2026-05-15', 
    status: 'paid', 
    subtotal: 1000, 
    taxAmount: 190, 
    totalAmount: 1190, 
    paidAmount: 1190 
  }
];

describe('ClientDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithParams = (id: string) => render(
    <MemoryRouter initialEntries={[`/dashboard/clients/${id}`]}>
      <Routes>
        <Route path="/dashboard/clients/:id" element={<ClientDetails />} />
      </Routes>
    </MemoryRouter>
  );

  it('renders client details and invoice history', async () => {
    // Mock the multiple calls to api()
    vi.mocked(api).mockImplementation(async (url: string) => {
      if (url.includes('/clients/c1')) return mockClient;
      if (url.includes('/invoices')) return mockInvoices;
      return [];
    });
    
    renderWithParams('c1');

    expect(screen.getByRole('heading', { name: /^Loading client\.\.\.$/i })).toBeInTheDocument();
    
    await screen.findByText('Acme Corp');
    expect(screen.getAllByText('Acme Corp')[0]).toBeInTheDocument();
    expect(screen.getByText('acme@example.com')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getAllByText('1190.00 TND')[0]).toBeInTheDocument();
  });

  it('shows not found state when client is missing', async () => {
    vi.mocked(api).mockRejectedValue(new Error('Not found'));
    
    renderWithParams('unknown');

    await waitFor(() => {
      expect(screen.getByText(/Client not found/i)).toBeInTheDocument();
    });
  });
});
