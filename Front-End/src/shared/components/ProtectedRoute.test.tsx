import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/shared/contexts/AuthContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

vi.mock('@/shared/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show nothing while auth is not ready', () => {
    (useAuth as any).mockReturnValue({ user: null, isReady: false });
    render(
      <MemoryRouter>
        <ProtectedRoute>Content</ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should redirect to login if user is not authenticated', () => {
    (useAuth as any).mockReturnValue({ user: null, isReady: true });
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute>Content</ProtectedRoute>} />
          <Route path="/auth/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should allow access if user is authenticated', () => {
    (useAuth as any).mockReturnValue({ user: { id: '1', role: 'user' }, isReady: true });
    render(
      <MemoryRouter>
        <ProtectedRoute>Content</ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should redirect if user role is not authorized', () => {
    (useAuth as any).mockReturnValue({ user: { id: '1', role: 'user' }, isReady: true });
    render(
      <MemoryRouter initialEntries={['/admin-only']}>
        <Routes>
          <Route path="/admin-only" element={<ProtectedRoute roles={['admin']}>Admin Content</ProtectedRoute>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should redirect to force-change-password if mustChangePassword is true', () => {
    (useAuth as any).mockReturnValue({ user: { id: '1', role: 'user', mustChangePassword: true }, isReady: true });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute>Dashboard</ProtectedRoute>} />
          <Route path="/auth/change-password" element={<div>Change Password</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });
});
