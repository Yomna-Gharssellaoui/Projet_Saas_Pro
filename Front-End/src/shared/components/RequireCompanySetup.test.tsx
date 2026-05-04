import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { RequireCompanySetup } from './RequireCompanySetup';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useBusiness } from '@/shared/contexts/BusinessContext';
import { BusinessesApi } from '@/shared/lib/services/businesses';
import { MemoryRouter, useLocation } from 'react-router-dom';
import React from 'react';

// Mock Hooks
vi.mock('@/shared/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/shared/contexts/BusinessContext', () => ({
  useBusiness: vi.fn(),
}));

vi.mock('@/shared/lib/services/businesses', () => ({
  BusinessesApi: {
    getById: vi.fn(),
  },
}));

// Helper to check current location
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

describe('RequireCompanySetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children if user is platform_admin', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { role: 'platform_admin' },
      isReady: true,
    } as any);
    vi.mocked(useBusiness).mockReturnValue({
      isReady: true,
      currentBusinessId: null,
      businesses: [],
    } as any);

    const { getByText } = render(
      <MemoryRouter>
        <RequireCompanySetup>
          <div>Platform Admin Content</div>
        </RequireCompanySetup>
      </MemoryRouter>
    );

    await waitFor(() => expect(getByText('Platform Admin Content')).toBeInTheDocument());
  });

  it('redirects to setup if current business is incomplete', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { role: 'business_owner' },
      isReady: true,
    } as any);
    vi.mocked(useBusiness).mockReturnValue({
      isReady: true,
      currentBusinessId: 'b1',
      businesses: [{ id: 'b1', isProfileComplete: false }],
    } as any);

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/dashboard/overview']}>
        <RequireCompanySetup>
          <div data-testid="protected">Incomplete Setup Content</div>
        </RequireCompanySetup>
        <LocationDisplay />
      </MemoryRouter>
    );

    await waitFor(() => expect(getByTestId('location').textContent).toBe('/dashboard/company/setup'));
    // On the setup route, the component ALLOWS rendering its children (which would be the setup page in reality)
    expect(getByTestId('protected')).toBeInTheDocument();
  });

  it('renders children if current business is complete', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { role: 'business_owner' },
      isReady: true,
    } as any);
    vi.mocked(useBusiness).mockReturnValue({
      isReady: true,
      currentBusinessId: 'b1',
      businesses: [{ id: 'b1', isProfileComplete: true }],
    } as any);

    const { getByText } = render(
      <MemoryRouter>
        <RequireCompanySetup>
          <div>Complete Setup Content</div>
        </RequireCompanySetup>
      </MemoryRouter>
    );

    await waitFor(() => expect(getByText('Complete Setup Content')).toBeInTheDocument());
  });

  it('fetches business if not in list and redirects if incomplete', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { role: 'business_owner' },
      isReady: true,
    } as any);
    vi.mocked(useBusiness).mockReturnValue({
      isReady: true,
      currentBusinessId: 'b2',
      businesses: [], // not in list
    } as any);
    
    vi.mocked(BusinessesApi.getById).mockResolvedValue({ id: 'b2', isProfileComplete: false } as any);

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/dashboard/overview']}>
        <RequireCompanySetup>
          <div data-testid="protected">Fetch Incomplete Content</div>
        </RequireCompanySetup>
        <LocationDisplay />
      </MemoryRouter>
    );

    await waitFor(() => expect(getByTestId('location').textContent).toBe('/dashboard/company/setup'));
  });
});
