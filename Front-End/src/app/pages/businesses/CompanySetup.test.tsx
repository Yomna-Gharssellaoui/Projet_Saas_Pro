import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompanySetup from './CompanySetup';
import { BusinessesApi } from '@/shared/lib/services/businesses';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock Context Hooks
vi.mock('@/shared/contexts/BusinessContext', () => ({
  useBusinessContext: () => ({
    businesses: [{ id: 'biz-1', name: 'Incomplete Biz' }],
    refreshBusinesses: vi.fn(),
    currentBusinessId: 'biz-1',
    setCurrentBusinessId: vi.fn(),
    isReady: true,
  }),
}));

// Mock API
vi.mock('@/shared/lib/services/businesses', () => ({
  BusinessesApi: {
    completeProfile: vi.fn(),
  },
}));

describe('CompanySetup Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => render(
    <BrowserRouter>
      <CompanySetup />
    </BrowserRouter>
  );

  it('renders the setup form with initial data', () => {
    renderPage();
    expect(screen.getByText(/Complete Company Profile/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Incomplete Biz')).toBeInTheDocument();
  });

  it('shows error messages for invalid inputs', async () => {
    renderPage();
    const phoneInput = screen.getByLabelText(/Phone \*/i);
    fireEvent.change(phoneInput, { target: { value: 'abc' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText(/Téléphone invalide/i)).toBeInTheDocument();
    });
  });

  it('successfully submits the form when valid', async () => {
    vi.mocked(BusinessesApi.completeProfile).mockResolvedValue({ id: 'biz-1' } as any);
    renderPage();

    // Fill minimum required fields that are empty
    fireEvent.change(screen.getByLabelText(/Industry \*/i), { target: { value: 'Software' } });
    fireEvent.change(screen.getByLabelText(/Address \*/i), { target: { value: '123 Tech Lane' } });
    fireEvent.change(screen.getByLabelText(/City \*/i), { target: { value: 'Tunis' } });
    fireEvent.change(screen.getByLabelText(/Tax ID \*/i), { target: { value: '1234567A' } });
    fireEvent.change(screen.getByLabelText(/Phone \*/i), { target: { value: '+21622222222' } });
    fireEvent.change(screen.getByLabelText(/Email \*/i), { target: { value: 'biz@test.com' } });

    const submitBtn = screen.getByText(/Save & Continue/i);
    expect(submitBtn).not.toBeDisabled();
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(BusinessesApi.completeProfile).toHaveBeenCalled();
    });
  });
});
