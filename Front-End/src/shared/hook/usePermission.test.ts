import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermission } from './usePermission';
import { useAuth } from '@/shared/contexts/AuthContext';

vi.mock('@/shared/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('usePermission', () => {
  it('returns true if user has permission', () => {
    vi.mocked(useAuth).mockReturnValue({
      hasPermission: (p: string) => p === 'test:read',
    } as any);

    const { result } = renderHook(() => usePermission('test:read'));
    expect(result.current).toBe(true);
  });

  it('returns false if user lacks permission', () => {
    vi.mocked(useAuth).mockReturnValue({
      hasPermission: () => false,
    } as any);

    const { result } = renderHook(() => usePermission('admin:write'));
    expect(result.current).toBe(false);
  });
});
