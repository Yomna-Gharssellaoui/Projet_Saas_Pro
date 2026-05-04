import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthApi } from '@/shared/lib/services/auth';
import React from 'react';

// Mock AuthApi
vi.mock('@/shared/lib/services/auth', () => ({
  AuthApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    acceptInvite: vi.fn(),
    changePasswordFirst: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize as not ready and no user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Initial state before useEffect runs
    expect(result.current.user).toBeNull();
    
    await waitFor(() => expect(result.current.isReady).toBe(true));
  });

  it('should sync user if token exists in localStorage', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', permissions: ['*'] };
    localStorage.setItem('access_token', 'fake-token');
    vi.mocked(AuthApi.me).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.user).toEqual(mockUser);
    expect(AuthApi.me).toHaveBeenCalled();
  });

  it('should handle login successfully', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', permissions: ['*'] };
    vi.mocked(AuthApi.login).mockResolvedValue({ access_token: 'new-token', user: mockUser });
    vi.mocked(AuthApi.me).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('john@example.com', 'password');
    });

    expect(localStorage.getItem('access_token')).toBe('new-token');
    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle logout correctly', async () => {
    localStorage.setItem('access_token', 'fake-token');
    localStorage.setItem('auth_user', JSON.stringify({ name: 'John' }));
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => {
      result.current.logout();
    });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should check permissions correctly for platform_admin', async () => {
    const mockUser = { id: '1', name: 'Admin', role: 'platform_admin', permissions: [] };
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPermission('any.perm')).toBe(true);
  });

  it('should check specific permissions correctly for normal users', async () => {
    const mockUser = { id: '1', name: 'User', role: 'user', permissions: ['invoices:read', 'clients.write'] };
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Test with colon variant
    expect(result.current.hasPermission('invoices:read')).toBe(true);
    // Test with dot variant mapping
    expect(result.current.hasPermission('invoices.read')).toBe(true);
    // Test non-existent permission
    expect(result.current.hasPermission('admin:access')).toBe(false);
  });

  it('should return true for hasAnyPermission if at least one matches', async () => {
    const mockUser = { id: '1', name: 'User', role: 'user', permissions: ['invoices:read'] };
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasAnyPermission(['invoices:read', 'admin:access'])).toBe(true);
    expect(result.current.hasAnyPermission(['admin:access', 'other:perm'])).toBe(false);
  });
});
