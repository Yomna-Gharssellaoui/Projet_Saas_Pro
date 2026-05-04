import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientsApi } from './clients';
import { api } from '@/shared/lib/apiClient';

vi.mock('@/shared/lib/apiClient', () => ({
  api: vi.fn(),
}));

describe('ClientsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list should call api with businessId', async () => {
    await ClientsApi.list('biz-123');
    expect(api).toHaveBeenCalledWith('/clients?businessId=biz-123');
  });

  it('get should call api with id', async () => {
    await ClientsApi.get('client-123');
    expect(api).toHaveBeenCalledWith('/clients/client-123');
  });

  it('create should call api with POST and payload', async () => {
    const payload = { businessId: 'b1', name: 'John', email: 'j@e.c', phone: '', address: '', city: '', postalCode: '', country: '' };
    await ClientsApi.create(payload);
    expect(api).toHaveBeenCalledWith('/clients', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  });
});
