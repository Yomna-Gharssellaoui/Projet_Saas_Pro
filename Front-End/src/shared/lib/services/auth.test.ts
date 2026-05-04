import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthApi } from './auth';
import { api } from '../apiClient';

vi.mock('../apiClient', () => ({
  api: vi.fn(),
}));

describe('AuthApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login should call api with correct path and body', async () => {
    await AuthApi.login('test@example.com', 'password123', 'captcha-token');
    expect(api).toHaveBeenCalledWith('/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123', captchaToken: 'captcha-token' }),
    }));
  });

  it('register should call api with payload', async () => {
    const payload = { name: 'John', email: 'john@example.com', password: 'password' };
    await AuthApi.register(payload);
    expect(api).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  });

  it('me should call api with GET', async () => {
    await AuthApi.me();
    expect(api).toHaveBeenCalledWith('/auth/me');
  });

  it('acceptInvite should call api with token and password', async () => {
    const payload = { token: 'tok', password: 'pwd' };
    await AuthApi.acceptInvite(payload);
    expect(api).toHaveBeenCalledWith('/auth/accept-invite', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  });

  it('changePasswordFirst should call api with new password', async () => {
    await AuthApi.changePasswordFirst({ newPassword: 'new-pwd' });
    expect(api).toHaveBeenCalledWith('/auth/change-password-first', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ newPassword: 'new-pwd' }),
    }));
  });
});
