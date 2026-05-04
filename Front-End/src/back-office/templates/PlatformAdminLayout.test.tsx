import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { PlatformAdminLayout } from './PlatformAdminLayout';
import React from 'react';

describe('PlatformAdminLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // Helper to check current location
  const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
  };

  const renderLayout = (initialPath = '/admin') => {
    window.innerWidth = 1024;
    localStorage.setItem('auth_user', JSON.stringify({ name: 'Admin User', email: 'admin@test.com' }));
    
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <PlatformAdminLayout />
        <LocationDisplay />
      </MemoryRouter>
    );
  };

  it('renders admin panel branding', () => {
    renderLayout();
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
    expect(screen.getByText(/System Administrator/i)).toBeInTheDocument();
  });

  it('renders navigation items for admin', () => {
    renderLayout();
    expect(screen.getAllByText(/Overview/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Businesses/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Registration Requests/i).length).toBeGreaterThan(0);
  });

  it('toggles sidebar collapse', () => {
    renderLayout();
    const toggleBtn = screen.getByLabelText(/Collapse sidebar/i);
    fireEvent.click(toggleBtn);
    expect(screen.getByLabelText(/Expand sidebar/i)).toBeInTheDocument();
  });

  it('navigates when clicking a nav item', async () => {
    renderLayout();
    const businessesBtns = screen.getAllByText(/Businesses/i);
    fireEvent.click(businessesBtns[0]);
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/admin/businesses'));
  });

  it('renders breadcrumbs and page title correctly', () => {
    renderLayout();
    expect(screen.getByText(/Admin.*Overview/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Overview/i })).toBeInTheDocument();
  });

  it('handles logout', async () => {
    renderLayout();
    const logoutBtn = screen.getByText(/Déconnexion/i);
    fireEvent.click(logoutBtn);
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/auth/login'));
  });
});
