import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InvoiceChatbot } from './InvoiceChatbot';
import { apiPost } from '@/shared/lib/apiClient';
import React from 'react';

// Mock scrollIntoView which is not implemented in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock Context Hooks
vi.mock('@/shared/contexts/BusinessContext', () => ({
  useBusinessContext: () => ({
    currentBusiness: { id: '1', name: 'Test Business' },
    isReady: true,
  }),
}));

// Mock API client
vi.mock('@/shared/lib/apiClient', () => ({
  apiPost: vi.fn(),
  api: vi.fn(),
}));

describe('InvoiceChatbot Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the welcome message and suggestions', () => {
    render(<InvoiceChatbot />);
    expect(screen.getByText(/Hello! I'm your/i)).toBeInTheDocument();
    expect(screen.getByText('Show me all unpaid invoices')).toBeInTheDocument();
  });

  it('sends a message and displays the bot response', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      text: 'Here are your unpaid invoices.',
      type: 'text',
      table: null
    });

    render(<InvoiceChatbot />);
    
    const input = screen.getByPlaceholderText(/Ask about invoices/i);
    const sendButton = screen.getByLabelText(/Send message/i);

    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.click(sendButton);

    expect(screen.getByText('test message')).toBeInTheDocument();
    expect(screen.getByText(/Analyzing your invoices/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Here are your unpaid invoices.')).toBeInTheDocument();
    });
  });

  it('displays a table if the bot response contains table data', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      text: 'Table response',
      type: 'table',
      table: {
        headers: ['Date', 'Amount'],
        rows: [['2026-01-01', '100 TND']]
      }
    });

    render(<InvoiceChatbot />);
    
    const input = screen.getByPlaceholderText(/Ask about invoices/i);
    fireEvent.change(input, { target: { value: 'show table' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Table response')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('100 TND')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(apiPost).mockRejectedValue(new Error('Network error'));

    render(<InvoiceChatbot />);
    
    const input = screen.getByPlaceholderText(/Ask about invoices/i);
    fireEvent.change(input, { target: { value: 'trigger error' } });
    fireEvent.click(screen.getByLabelText(/Send message/i));

    await waitFor(() => {
      expect(screen.getByText(/Failed to connect to the Invoice AI/i)).toBeInTheDocument();
    });
  });

  it('sends suggestion when clicked', async () => {
    vi.mocked(apiPost).mockResolvedValue({ text: 'Suggestion result', type: 'text' });

    render(<InvoiceChatbot />);
    
    const suggestion = screen.getByText('Which clients owe the most?');
    fireEvent.click(suggestion);

    expect(screen.getByText('Which clients owe the most?')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Suggestion result')).toBeInTheDocument();
    });
  });
});
