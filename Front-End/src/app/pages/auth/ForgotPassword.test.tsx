import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ForgotPassword } from './ForgotPassword';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

describe('ForgotPassword Page', () => {
  const renderPage = () => render(
    <BrowserRouter>
      <ForgotPassword />
    </BrowserRouter>
  );

  it('renders the forgot password form', () => {
    renderPage();
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it('shows success message after submission', () => {
    renderPage();
    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitBtn = screen.getByText('Send Reset Link');
    fireEvent.click(submitBtn);

    expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
  });
});
