import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import React from 'react';

describe('AuthLayout Component', () => {
  it('renders branding and main title', () => {
    render(
      <BrowserRouter>
        <AuthLayout />
      </BrowserRouter>
    );

    expect(screen.getAllByText(/BizManager Pro/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Gérez votre entreprise/i)).toBeInTheDocument();
  });

  it('renders feature showcase sections', () => {
    render(
      <BrowserRouter>
        <AuthLayout />
      </BrowserRouter>
    );

    expect(screen.getByText(/Pilotage en temps réel/i)).toBeInTheDocument();
    expect(screen.getByText(/Collaboration d’équipe/i)).toBeInTheDocument();
    expect(screen.getByText(/Sécurité avancée/i)).toBeInTheDocument();
  });

  it('renders stats', () => {
    render(
      <BrowserRouter>
        <AuthLayout />
      </BrowserRouter>
    );

    expect(screen.getByText(/500\+/i)).toBeInTheDocument();
    expect(screen.getByText(/99.9%/i)).toBeInTheDocument();
  });
});
