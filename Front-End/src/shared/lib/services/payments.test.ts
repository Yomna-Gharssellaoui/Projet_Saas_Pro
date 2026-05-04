import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentsApi } from './payments';

describe('PaymentsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  it('confirms PayPal payment', async () => {
    const mockResponse = {
      id: 'r1',
      paymentStatus: 'paid',
      paymentReference: 'PAY-123',
      paymentProvider: 'paypal',
    };
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const result = await PaymentsApi.confirmPayPalPayment('req-1', { orderId: 'ORDER-1' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/registration-requests/req-1/online-payment/confirm'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ provider: 'paypal', orderId: 'ORDER-1' }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('throws error when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      text: async () => 'Payment failed',
    } as any);

    await expect(PaymentsApi.confirmPayPalPayment('req-1', { orderId: 'BAD' }))
      .rejects.toThrow('Payment failed');
  });
});
