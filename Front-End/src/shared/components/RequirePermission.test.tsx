import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { RequirePermission } from './RequirePermission';
import { useAuth } from '@/shared/contexts/AuthContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

// Mock AuthContext
vi.mock('@/shared/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('RequirePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when auth is not ready', () => {
    vi.mocked(useAuth).mockReturnValue({
      isReady: false,
    } as any);

    const { container } = render(
      <MemoryRouter>
        <RequirePermission permission="test:read">
          <div>Content</div>
        </RequirePermission>
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('redirects to login if no user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isReady: true,
    } as any);

    const { getByText } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={
            <RequirePermission permission="test:read">
              <div>Content</div>
            </RequirePermission>
          } />
          <Route path="/auth/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children if user has permission', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { role: 'admin', permissions: ['test:read'] },
      isReady: true,
      hasPermission: (p: string) => p === 'test:read',
    } as any);

    const { getByText } = render(
      <MemoryRouter>
        <RequirePermission permission="test:read">
          <div>Unique Protected Content</div>
        </RequirePermission>
      </MemoryRouter>
    );

    expect(getByText('Unique Protected Content')).toBeInTheDocument();
  });

  it('shows access denied if user lacks permission', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { role: 'member', permissions: [] },
      isReady: true,
      hasPermission: () => false,
    } as any);

    const { getByText } = render(
      <MemoryRouter>
        <RequirePermission permission="admin:write">
          <div>Protected Content</div>
        </RequirePermission>
      </MemoryRouter>
    );

    expect(getByText(/Access denied/i)).toBeInTheDocument();
    expect(getByText(/Required:/i)).toBeInTheDocument();
    expect(getByText('admin:write')).toBeInTheDocument();
  });
});
