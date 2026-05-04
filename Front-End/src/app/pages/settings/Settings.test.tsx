import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from './Settings';
import { useAuth } from '@/shared/contexts/AuthContext';
import React from 'react';

// Mock Context Hooks
vi.mock('@/shared/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

const mockUser = {
  id: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'ADMIN',
  businessId: 'biz-1',
};

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isReady: true,
    } as any);
  });

  const renderPage = () => render(<Settings />);

  it('renders the settings header and initial tab', () => {
    renderPage();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
  });

  it('switches between tabs', async () => {
    renderPage();
    
    const passwordTab = screen.getByText('Password');
    fireEvent.click(passwordTab);

    await waitFor(() => {
      expect(screen.getByText('Change Password')).toBeInTheDocument();
    });

    const securityTab = screen.getByText('Security Questions');
    fireEvent.click(securityTab);

    await waitFor(() => {
      expect(screen.getByText('Security Questions')).toBeInTheDocument();
    });
  });

  it('handles profile update successfully', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    } as any);

    renderPage();
    
    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    
    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/u1'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });
});
