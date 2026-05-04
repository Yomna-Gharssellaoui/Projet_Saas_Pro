import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Register } from './Register';
import { RegistrationRequestsApi } from '@/shared/lib/services/registrationRequests';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock API
vi.mock('@/shared/lib/services/registrationRequests', () => ({
  RegistrationRequestsApi: {
    create: vi.fn(),
  },
}));

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );

  it('renders the registration form', () => {
    renderPage();
    expect(screen.getByText(/Request Business Account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty submission', async () => {
    renderPage();
    const submitBtn = screen.getByText(/Send Request/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please fill all required fields/i)).toBeInTheDocument();
    });
  });

  it('handles successful registration request', async () => {
    vi.mocked(RegistrationRequestsApi.create).mockResolvedValue({ id: 'req-1' } as any);
    renderPage();

    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'jane@company.com' } });
    fireEvent.change(screen.getByLabelText(/Company name/i), { target: { value: 'Jane Tech' } });
    fireEvent.change(screen.getByLabelText(/Company category/i), { target: { value: 'Technology' } });

    fireEvent.click(screen.getByText(/Send Request/i));

    await waitFor(() => {
      expect(RegistrationRequestsApi.create).toHaveBeenCalledWith({
        ownerName: 'Jane Doe',
        ownerEmail: 'jane@company.com',
        companyName: 'Jane Tech',
        companyCategory: 'Technology',
      });
    });
  });
});
