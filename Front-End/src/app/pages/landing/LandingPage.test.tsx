import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LandingPage } from './LandingPage';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  );

  it('renders navigation and hero section', () => {
    renderPage();
    expect(screen.getAllByText(/BizManager Pro/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gérez votre entreprise avec plus de clarté/i).length).toBeGreaterThan(0);
  });

  it('renders features and pricing sections', () => {
    renderPage();
    expect(screen.getByText(/Facturation intelligente/i)).toBeInTheDocument();
    expect(screen.getByText(/Choisissez votre plan/i)).toBeInTheDocument();
    // Use getAllByText if it appears multiple times, or be more specific
    expect(screen.getAllByText(/Professional/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Starter/i).length).toBeGreaterThan(0);
  });
});
