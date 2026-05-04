import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessesApi } from './businesses';
import { api } from '@/shared/lib/apiClient';

// Mock apiClient
vi.mock('@/shared/lib/apiClient', () => ({
  api: vi.fn(),
}));

describe('BusinessesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists my businesses', async () => {
    vi.mocked(api).mockResolvedValue([{ id: 'b1', name: 'My Biz' }] as any);
    const result = await BusinessesApi.listMine();
    expect(api).toHaveBeenCalledWith('/businesses');
    expect(result).toEqual([{ id: 'b1', name: 'My Biz' }]);
  });

  it('gets business by id', async () => {
    vi.mocked(api).mockResolvedValue({ id: 'b1', name: 'Biz 1' } as any);
    const result = await BusinessesApi.getById('b1');
    expect(api).toHaveBeenCalledWith('/businesses/b1');
    expect(result.name).toBe('Biz 1');
  });

  it('creates a business', async () => {
    const payload = { name: 'New Biz' };
    vi.mocked(api).mockResolvedValue({ id: 'b2', ...payload } as any);
    await BusinessesApi.create(payload);
    expect(api).toHaveBeenCalledWith('/businesses', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  });

  it('updates a business', async () => {
    const payload = { name: 'Updated Biz' };
    vi.mocked(api).mockResolvedValue({ id: 'b1', ...payload } as any);
    await BusinessesApi.update('b1', payload);
    expect(api).toHaveBeenCalledWith('/businesses/b1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify(payload),
    }));
  });

  it('removes a business', async () => {
    vi.mocked(api).mockResolvedValue({ ok: true } as any);
    await BusinessesApi.remove('b1');
    expect(api).toHaveBeenCalledWith('/businesses/b1', expect.objectContaining({
      method: 'DELETE',
    }));
  });

  it('completes business profile', async () => {
    const payload = { city: 'Tunis', phone: '123' };
    vi.mocked(api).mockResolvedValue({ id: 'b1', ...payload, isProfileComplete: true } as any);
    await BusinessesApi.completeProfile('b1', payload);
    expect(api).toHaveBeenCalledWith('/businesses/b1/profile', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify(payload),
    }));
  });

  it('lists all businesses (admin)', async () => {
    vi.mocked(api).mockResolvedValue([{ id: 'b1' }] as any);
    await BusinessesApi.listAll();
    expect(api).toHaveBeenCalledWith('/businesses/all');
  });

  it('removes all businesses (admin)', async () => {
    vi.mocked(api).mockResolvedValue({ ok: true } as any);
    await BusinessesApi.removeAllAsAdmin();
    expect(api).toHaveBeenCalledWith('/businesses/admin/all', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});
