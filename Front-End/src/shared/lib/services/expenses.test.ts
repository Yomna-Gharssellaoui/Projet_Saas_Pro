import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpensesApi } from './expenses';
import { api } from '@/shared/lib/apiClient';

// Mock apiClient
vi.mock('@/shared/lib/apiClient', () => ({
  api: vi.fn(),
}));

describe('ExpensesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists expenses for a business', async () => {
    vi.mocked(api).mockResolvedValue([{ id: 'e1', amount: 100 }] as any);
    
    const result = await ExpensesApi.list('b1');
    
    expect(api).toHaveBeenCalledWith('/expenses?businessId=b1');
    expect(result).toEqual([{ id: 'e1', amount: 100 }]);
  });

  it('creates an expense', async () => {
    const payload = { 
      businessId: 'b1', 
      amount: 50, 
      category: 'Food',
      date: '2026-05-01',
      currency: 'TND',
      vendor: 'Resto',
      description: 'Lunch',
      paymentMethod: 'Cash',
      submittedBy: 'User'
    };
    vi.mocked(api).mockResolvedValue({ id: 'e2', ...payload } as any);
    
    const result = await ExpensesApi.create(payload);
    
    expect(api).toHaveBeenCalledWith('/expenses', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
    expect(result.id).toBe('e2');
  });

  it('updates expense status', async () => {
    vi.mocked(api).mockResolvedValue({ id: 'e1', status: 'approved' } as any);
    
    const result = await ExpensesApi.updateStatus('e1', 'approved');
    
    expect(api).toHaveBeenCalledWith('/expenses/e1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    }));
    expect(result.status).toBe('approved');
  });
});
