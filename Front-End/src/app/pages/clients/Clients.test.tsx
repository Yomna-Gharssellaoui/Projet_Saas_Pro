import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Clients } from './Clients';
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

// Mock API
vi.mock('@/shared/lib/services/clients', () => ({
  ClientsApi: {
    list: vi.fn(),
    create: vi.fn(),
  },
}));

const mockClients = [
  { id: 'c1', name: 'Acme Corp', email: 'acme@example.com', totalRevenue: 5000, outstandingBalance: 1000 },
  { id: 'c2', name: 'John Doe', email: 'john@example.com', totalRevenue: 2000, outstandingBalance: 0 },
];

describe('Clients Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => render(
    <BrowserRouter>
      <Clients />
    </BrowserRouter>
  );

  it('renders the clients list and summary stats', async () => {
    vi.mocked(ClientsApi.list).mockResolvedValue(mockClients as any);
    
    renderPage();

    expect(screen.getByText(/Customer management/i)).toBeInTheDocument();
    
    await screen.findByText('Acme Corp');
    await screen.findByText('John Doe');
    expect(screen.getAllByText('7000.00 TND')[0]).toBeInTheDocument();
    expect(screen.getAllByText('1000.00 TND')[0]).toBeInTheDocument();
  });

  it('filters clients by search term', async () => {
    vi.mocked(ClientsApi.list).mockResolvedValue(mockClients as any);
    renderPage();

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Search clients by name/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('opens create client dialog', async () => {
    vi.mocked(ClientsApi.list).mockResolvedValue(mockClients as any);
    renderPage();

    const newBtn = screen.getByLabelText(/Ouvrir le formulaire pour ajouter un nouveau client/i);
    fireEvent.click(newBtn);

    expect(await screen.findByText(/Create new client/i)).toBeInTheDocument();
  });
});
