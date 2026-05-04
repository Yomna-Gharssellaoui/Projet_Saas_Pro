import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamMembersApi } from './teamMembers';
import { api } from '@/shared/lib/apiClient';

// Mock apiClient
vi.mock('@/shared/lib/apiClient', () => ({
  api: vi.fn(),
}));

describe('TeamMembersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists team members', async () => {
    vi.mocked(api).mockResolvedValue([{ id: 'm1', name: 'Alice' }] as any);
    const result = await TeamMembersApi.list('b1');
    expect(api).toHaveBeenCalledWith('/team-members?businessId=b1');
    expect(result).toEqual([{ id: 'm1', name: 'Alice' }]);
  });

  it('invites a team member', async () => {
    const payload = { email: 'alice@example.com', role: 'member' };
    vi.mocked(api).mockResolvedValue({ id: 'm1', ...payload } as any);
    const result = await TeamMembersApi.invite(payload);
    expect(api).toHaveBeenCalledWith('/team-members/invite', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
    expect(result.id).toBe('m1');
  });

  it('removes a team member', async () => {
    vi.mocked(api).mockResolvedValue({ success: true } as any);
    await TeamMembersApi.remove('m1');
    expect(api).toHaveBeenCalledWith('/team-members/m1', expect.objectContaining({
      method: 'DELETE',
    }));
  });

  it('updates a team member', async () => {
    const payload = { role: 'admin' };
    vi.mocked(api).mockResolvedValue({ id: 'm1', ...payload } as any);
    await TeamMembersApi.update('m1', payload);
    expect(api).toHaveBeenCalledWith('/team-members/m1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify(payload),
    }));
  });
});
