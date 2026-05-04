import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AcceptInvite from './AcceptInvite';
import React from 'react';

// Mock API client
vi.mock('@/shared/lib/apiClient', () => ({
  api: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { api } from '@/shared/lib/apiClient';

describe('AcceptInvite Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the accept invitation form', () => {
    render(
      <MemoryRouter initialEntries={['/auth/accept-invite?token=abc123']}>
        <AcceptInvite />
      </MemoryRouter>
    );
    expect(screen.getByText('Accept Invitation')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('********')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('shows warning when token is missing', () => {
    render(
      <MemoryRouter initialEntries={['/auth/accept-invite']}>
        <AcceptInvite />
      </MemoryRouter>
    );
    expect(screen.getByText(/Token manquant/i)).toBeInTheDocument();
  });

  it('disables button when token is missing', () => {
    render(
      <MemoryRouter initialEntries={['/auth/accept-invite']}>
        <AcceptInvite />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeDisabled();
  });

  it('calls api and navigates to dashboard on success', async () => {
    vi.mocked(api).mockResolvedValue({
      access_token: 'tok123',
      user: { id: 'u1', name: 'Test' },
    } as any);

    render(
      <MemoryRouter initialEntries={['/auth/accept-invite?token=abc123']}>
        <AcceptInvite />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('********'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith('/auth/accept-invite', expect.objectContaining({ method: 'POST' }));
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
