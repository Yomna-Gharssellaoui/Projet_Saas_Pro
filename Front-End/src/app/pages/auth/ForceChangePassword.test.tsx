import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForceChangePassword from './ForceChangePassword';
import React from 'react';

vi.mock('@/shared/lib/services/auth', () => ({
  AuthApi: {
    changePasswordFirst: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { AuthApi } from '@/shared/lib/services/auth';

describe('ForceChangePassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <BrowserRouter>
        <ForceChangePassword />
      </BrowserRouter>
    );

  it('renders the change password form', () => {
    renderPage();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(document.getElementById('currentPassword')).toBeInTheDocument();
    expect(document.getElementById('newPassword')).toBeInTheDocument();
    expect(document.getElementById('confirmPassword')).toBeInTheDocument();
  });

  it('shows password validation rules', () => {
    renderPage();
    expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/1 uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/1 lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/1 number/i)).toBeInTheDocument();
  });

  it('shows mismatch error when passwords do not match', async () => {
    renderPage();
    fireEvent.change(document.getElementById('newPassword')!, {
      target: { value: 'StrongPass1' },
    });
    fireEvent.change(document.getElementById('confirmPassword')!, {
      target: { value: 'DifferentPass1' },
    });

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows confirmation match when passwords match', async () => {
    renderPage();
    fireEvent.change(document.getElementById('newPassword')!, {
      target: { value: 'StrongPass1' },
    });
    fireEvent.change(document.getElementById('confirmPassword')!, {
      target: { value: 'StrongPass1' },
    });

    await waitFor(() => {
      expect(screen.getByText(/Password confirmation is correct/i)).toBeInTheDocument();
    });
  });

  it('calls AuthApi.changePasswordFirst and navigates on success', async () => {
    vi.mocked(AuthApi.changePasswordFirst).mockResolvedValue(undefined as any);
    renderPage();

    fireEvent.change(document.getElementById('currentPassword')!, {
      target: { value: 'OldPass1' },
    });
    fireEvent.change(document.getElementById('newPassword')!, {
      target: { value: 'StrongPass1' },
    });
    fireEvent.change(document.getElementById('confirmPassword')!, {
      target: { value: 'StrongPass1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(AuthApi.changePasswordFirst).toHaveBeenCalledWith({
        currentPassword: 'OldPass1',
        newPassword: 'StrongPass1',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/auth/setup-security-questions', { replace: true });
    });
  });

  it('toggles password visibility for current password field', () => {
    renderPage();
    const currentPasswordInput = document.getElementById('currentPassword')!;
    expect(currentPasswordInput).toHaveAttribute('type', 'password');

    // First type=button inside the current-password relative div
    const toggleButtons = screen.getAllByRole('button').filter(btn => btn.getAttribute('type') === 'button');
    fireEvent.click(toggleButtons[0]);

    expect(currentPasswordInput).toHaveAttribute('type', 'text');
  });
});
