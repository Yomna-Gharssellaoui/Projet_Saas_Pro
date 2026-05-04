import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, apiGet, apiPost, getToken } from './apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  it('getToken should return the access_token from localStorage', () => {
    localStorage.setItem('access_token', 'test-token');
    expect(getToken()).toBe('test-token');
  });

  it('api should add Authorization header if token exists', async () => {
    localStorage.setItem('access_token', 'test-token');
    const mockFetch = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    } as Response);

    await api('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('api should add x-business-id header if it exists', async () => {
    localStorage.setItem('current_business_id', 'biz-123');
    const mockFetch = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    } as Response);

    await api('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-business-id': 'biz-123',
        }),
      })
    );
  });

  it('apiGet should make a GET request with query params', async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: [] }),
    } as Response);

    await apiGet('/test', { page: 1, limit: 10 });

    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain('page=1');
    expect(callUrl).toContain('limit=10');
  });

  it('apiPost should make a POST request with JSON body', async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 1 }),
    } as Response);

    const body = { name: 'New Item' };
    await apiPost('/test', body);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('api should throw an error if response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Bad Request' }),
    } as Response);

    await expect(api('/test')).rejects.toThrow('Bad Request');
  });

  it('api should handle text responses', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'Plain Text Response',
    } as Response);

    const result = await api('/test');
    expect(result).toBe('Plain Text Response');
  });
});
