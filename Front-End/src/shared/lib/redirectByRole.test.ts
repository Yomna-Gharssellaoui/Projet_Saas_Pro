import { describe, it, expect } from 'vitest';
import { redirectByRole } from './redirectByRole';

describe('redirectByRole', () => {
  it('returns /admin for platform_admin', () => {
    expect(redirectByRole({ role: 'platform_admin' } as any)).toBe('/admin');
  });

  it('returns /dashboard for business_owner', () => {
    expect(redirectByRole({ role: 'business_owner' } as any)).toBe('/dashboard');
  });

  it('returns /dashboard for team_member', () => {
    expect(redirectByRole({ role: 'team_member' } as any)).toBe('/dashboard');
  });

  it('returns /dashboard for accountant', () => {
    expect(redirectByRole({ role: 'accountant' } as any)).toBe('/dashboard');
  });
});
