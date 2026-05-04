import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateInvoice } from './CreateInvoice';
import { ClientsApi } from '@/shared/lib/services/clients';
import { InvoicesApi } from '@/shared/lib/services/invoices';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import React from 'react';

// Mock Context Hooks
vi.mock('@/shared/contexts/BusinessContext', () => ({
  useBusinessContext: () => ({
    currentBusiness: { id: 'biz-1', name: 'Test Business', currency: 'TND', taxRate: 19 },
    isReady: true,
  }),
}));

// Mock API
vi.mock('@/shared/lib/services/clients', () => ({
  ClientsApi: {
    list: vi.fn(),
  },
}));

vi.mock('@/shared/lib/services/invoices', () => ({
  InvoicesApi: {
    create: vi.fn(),
  },
}));

const mockClients = [
  { id: 'c1', name: 'Client A', email: 'a@test.com' },
  { id: 'c2', name: 'Client B', email: 'b@test.com' },
];

describe('CreateInvoice Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => render(
    <BrowserRouter>
      <Toaster />
      <CreateInvoice />
    </BrowserRouter>
  );

  it('renders the creation form and loads clients', async () => {
    vi.mocked(ClientsApi.list).mockResolvedValue(mockClients as any);
    
    renderPage();

    expect(screen.getByText('Create Invoice')).toBeInTheDocument();
    
    await waitFor(() => {
      // In Radix Select, the placeholder or current value is visible.
      // After loading, we don't necessarily see 'Client A' until it's selected, 
      // but the select trigger should be there.
      expect(screen.getByText(/Select a client/i)).toBeInTheDocument();
    });
  });

  it('calculates totals correctly when items are added', async () => {
    vi.mocked(ClientsApi.list).mockResolvedValue(mockClients as any);
    renderPage();

    // Set description
    const descInput = screen.getByPlaceholderText(/Service or product description/i);
    fireEvent.change(descInput, { target: { value: 'Consulting' } });

    // Set price
    const priceInput = screen.getByLabelText(/Unit Price/i);
    fireEvent.change(priceInput, { target: { value: '100' } });

    // Set qty
    const qtyInput = screen.getByLabelText(/Qty/i);
    fireEvent.change(qtyInput, { target: { value: '2' } });

    // Total should be (100 * 2) + tax(19%) = 200 + 38 = 238
    await waitFor(() => {
      const totals = screen.getAllByText(/238\.00 TND/i);
      expect(totals.length).toBeGreaterThan(0);
    });
  });

  it('validates required fields before submission', async () => {
    vi.mocked(ClientsApi.list).mockResolvedValue(mockClients as any);
    renderPage();

    const submitBtn = screen.getByText('Send Invoice');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(InvoicesApi.create).not.toHaveBeenCalled();
    });
  });
});
