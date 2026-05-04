import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import React from 'react';

// Mock context and shared components
vi.mock('@/shared/contexts/BusinessContext', () => ({
  useBusinessContext: () => ({
    currentBusiness: { name: 'Test Business', id: 'b1' },
    setCurrentBusiness: vi.fn(),
    businesses: [{ id: 'b1', name: 'Test Business' }],
    isReady: true,
    refreshBusinesses: vi.fn(),
  }),
}));

vi.mock('@/shared/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User', role: 'business_owner', id: 'u1', email: 'test@user.com' },
    logout: vi.fn(),
    isReady: true,
    hasPermission: () => true,
  }),
}));

vi.mock('../molecules/BusinessSwitcher', () => ({
  BusinessSwitcher: () => <div data-testid="business-switcher">Business Switcher</div>,
}));

vi.mock('../organisms/AIAssistant', () => ({
  AIAssistant: () => <div data-testid="ai-assistant">AI Assistant</div>,
}));

vi.mock('@/shared/components/ChatWidget', () => ({
  default: () => <div data-testid="chat-widget">Chat Widget</div>,
}));

vi.mock('@/shared/components/FirstLoginOnboarding', () => ({
  FirstLoginOnboarding: () => <div data-testid="onboarding" />
}));

describe('DashboardLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderLayout = () => render(
    <BrowserRouter>
      <DashboardLayout />
    </BrowserRouter>
  );

  it('renders correctly with sidebar and main content', () => {
    renderLayout();
    expect(screen.getByText(/Test Business/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Test User/i)).toBeInTheDocument();
    expect(screen.getByTestId('business-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('ai-assistant')).toBeInTheDocument();
  });

  it('shows navigation items based on permissions', () => {
    renderLayout();
    expect(screen.getByText(/Invoices/i)).toBeInTheDocument();
    expect(screen.getByText(/Expenses/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Insights/i)).toBeInTheDocument();
  });

  it('opens and closes user menu', async () => {
    renderLayout();
    const userBtn = screen.getByLabelText(/User menu/i);
    fireEvent.click(userBtn);
    
    expect(screen.getAllByText(/Settings/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Logout/i).length).toBeGreaterThan(0);
    
    fireEvent.click(userBtn);
    await waitFor(() => {
      expect(screen.queryByText(/My Account/i)).not.toBeInTheDocument();
    });
  });

  it('toggles sidebar collapse on desktop', () => {
    renderLayout();
    const toggleBtn = screen.getByLabelText(/Collapse sidebar/i);
    fireEvent.click(toggleBtn);
    
    expect(screen.getByLabelText(/Expand sidebar/i)).toBeInTheDocument();
  });

  it('navigates when clicking a nav item', () => {
    renderLayout();
    const invoicesBtn = screen.getByText(/Invoices/i);
    fireEvent.click(invoicesBtn);
    
    expect(window.location.pathname).toBe('/dashboard/invoices');
  });

  it('opens mobile sidebar when clicking the menu button', () => {
    // We need to simulate a small screen or just trigger the button
    renderLayout();
    const menuBtn = screen.getByLabelText(/Open sidebar/i);
    fireEvent.click(menuBtn);
    
    // Check if the close button appears (part of mobile sidebar)
    expect(screen.getByLabelText(/Close sidebar/i)).toBeInTheDocument();
  });
});
