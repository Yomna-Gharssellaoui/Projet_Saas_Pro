import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Team } from './Team';
import { TeamMembersApi } from '@/shared/lib/services/teamMembers';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock Context Hooks
vi.mock('@/shared/contexts/BusinessContext', () => ({
  useBusinessContext: () => ({
    currentBusiness: { id: 'biz-1', name: 'Test Business' },
    isReady: true,
  }),
}));

vi.mock('@/shared/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', role: 'business_owner' },
    isReady: true,
  }),
}));

// Mock API
vi.mock('@/shared/lib/services/teamMembers', () => ({
  TeamMembersApi: {
    list: vi.fn(),
    invite: vi.fn(),
    remove: vi.fn(),
  },
}));

const mockMembers = [
  { id: 'm1', name: 'Alice Smith', email: 'alice@example.com', role: 'business_admin', status: 'active', businessId: 'biz-1' },
  { id: 'm2', name: 'Bob Jones', email: 'bob@example.com', role: 'team_member', status: 'invited', businessId: 'biz-1' },
];

describe('Team Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(TeamMembersApi.list).mockResolvedValue(mockMembers as any);
  });

  const renderPage = () => render(
    <BrowserRouter>
      <Team />
    </BrowserRouter>
  );

  it('renders team members list and stats', async () => {
    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total members stat
    });
  });

  it('filters team members by search term', async () => {
    renderPage();
    
    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Search by member name/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('opens invite dialog when authorized', async () => {
    renderPage();
    
    const inviteBtn = screen.getByText(/Invite Member/i);
    fireEvent.click(inviteBtn);

    expect(await screen.findByText(/Invite Team Member/i)).toBeInTheDocument();
  });
});
