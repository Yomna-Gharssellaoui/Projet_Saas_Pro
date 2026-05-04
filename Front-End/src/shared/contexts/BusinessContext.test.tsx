import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { BusinessProvider, useBusiness } from './BusinessContext';
import { BusinessesApi } from '@/shared/lib/services/businesses';
import { useAuth } from '@/shared/contexts/AuthContext';
import React from 'react';

// Mock AuthContext
vi.mock('@/shared/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock BusinessesApi
vi.mock('@/shared/lib/services/businesses', () => ({
  BusinessesApi: {
    listMine: vi.fn(),
    getById: vi.fn(),
  },
}));

const TestComponent = () => {
  const { businesses, currentBusiness, isReady } = useBusiness();
  if (!isReady) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="biz-count">{businesses.length}</div>
      <div data-testid="current-biz">{currentBusiness?.name || 'none'}</div>
    </div>
  );
};

describe('BusinessContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('loads businesses for an owner and selects the first one if none stored', async () => {
    const mockBusinesses = [
      { id: 'b1', name: 'Biz 1' },
      { id: 'b2', name: 'Biz 2' },
    ];
    
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', role: 'business_owner' },
      isReady: true,
    } as any);
    
    vi.mocked(BusinessesApi.listMine).mockResolvedValue(mockBusinesses as any);

    const { getByTestId } = render(
      <BusinessProvider>
        <TestComponent />
      </BusinessProvider>
    );

    await waitFor(() => expect(getByTestId('biz-count').textContent).toBe('2'));
    expect(getByTestId('current-biz').textContent).toBe('Biz 1');
    expect(localStorage.getItem('current_business_id')).toBe('b1');
  });

  it('restores current business from localStorage', async () => {
    localStorage.setItem('current_business_id', 'b2');
    const mockBusinesses = [
      { id: 'b1', name: 'Biz 1' },
      { id: 'b2', name: 'Biz 2' },
    ];
    
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', role: 'business_owner' },
      isReady: true,
    } as any);
    
    vi.mocked(BusinessesApi.listMine).mockResolvedValue(mockBusinesses as any);

    const { getByTestId } = render(
      <BusinessProvider>
        <TestComponent />
      </BusinessProvider>
    );

    await waitFor(() => expect(getByTestId('current-biz').textContent).toBe('Biz 2'));
  });

  it('loads a single business for a non-owner member', async () => {
    const mockBiz = { id: 'b3', name: 'Member Biz' };
    
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u2', role: 'team_member', businessId: 'b3' },
      isReady: true,
    } as any);
    
    vi.mocked(BusinessesApi.getById).mockResolvedValue(mockBiz as any);

    const { getByTestId } = render(
      <BusinessProvider>
        <TestComponent />
      </BusinessProvider>
    );

    await waitFor(() => expect(getByTestId('biz-count').textContent).toBe('1'));
    expect(getByTestId('current-biz').textContent).toBe('Member Biz');
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', role: 'business_owner' },
      isReady: true,
    } as any);
    
    vi.mocked(BusinessesApi.listMine).mockRejectedValue(new Error('API Error'));

    const { getByTestId } = render(
      <BusinessProvider>
        <TestComponent />
      </BusinessProvider>
    );

    await waitFor(() => expect(getByTestId('biz-count').textContent).toBe('0'));
    expect(getByTestId('current-biz').textContent).toBe('none');
  });
});
