import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoicesApi } from './invoices';
import { api } from '@/shared/lib/apiClient';

vi.mock('@/shared/lib/apiClient', () => ({
  api: vi.fn(),
}));

describe('InvoicesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list should call api with businessId', async () => {
    await InvoicesApi.list('biz-123');
    expect(api).toHaveBeenCalledWith('/invoices?businessId=biz-123');
  });

  it('get should call api with id', async () => {
    await InvoicesApi.get('inv-123');
    expect(api).toHaveBeenCalledWith('/invoices/inv-123');
  });

  it('create should call api with POST and payload', async () => {
    const payload = { clientId: 'c1', items: [] };
    await InvoicesApi.create(payload);
    expect(api).toHaveBeenCalledWith('/invoices', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  });

  it('markSent should call api with PATCH sent status', async () => {
    await InvoicesApi.markSent('inv-123');
    expect(api).toHaveBeenCalledWith('/invoices/inv-123', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'sent' }),
    }));
  });

  it('markPaid should call api with PATCH paid status', async () => {
    await InvoicesApi.markPaid('inv-123');
    expect(api).toHaveBeenCalledWith('/invoices/inv-123', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'paid' }),
    }));
  });

  it('updateStatus should call api with custom status', async () => {
    await InvoicesApi.updateStatus('inv-123', 'cancelled');
    expect(api).toHaveBeenCalledWith('/invoices/inv-123', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    }));
  });
});
