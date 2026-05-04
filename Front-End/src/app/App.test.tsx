import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';
import React from 'react';

// Mock the router to avoid rendering the whole app tree
vi.mock('@/app/routes', () => ({
  router: {},
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    RouterProvider: () => <div data-testid="router-provider" />,
  };
});

describe('App Component', () => {
  it('renders all providers and the router', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('router-provider')).toBeInTheDocument();
  });
});
