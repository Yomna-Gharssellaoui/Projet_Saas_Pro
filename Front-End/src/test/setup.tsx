import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Suppress act() and other noise from Radix/JSDOM
const originalError = console.error;
const originalWarn = console.warn;
const suppressWarnings = (...args: any[]) => {
  const message = args.map(arg => String(arg)).join(' ');
  if (
    message.includes('was not wrapped in act(...)') ||
    message.includes('React does not recognize the') ||
    message.includes('Function components cannot be given refs')
  ) {
    return;
  }
  originalError(...args);
};

const suppressWarns = (...args: any[]) => {
  const message = args.map(arg => String(arg)).join(' ');
  if (
    message.includes('was not wrapped in act(...)') ||
    message.includes('React does not recognize the') ||
    message.includes('Function components cannot be given refs')
  ) {
    return;
  }
  originalWarn(...args);
};

console.error = suppressWarnings;
console.warn = suppressWarns;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock PointerEvent
if (!global.PointerEvent) {
  class PointerEvent extends Event {
    constructor(type: string, params: any = {}) {
      super(type, params);
      (this as any).pointerId = params.pointerId || 0;
      (this as any).pointerType = params.pointerType || '';
    }
  }
  global.PointerEvent = PointerEvent as any;
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Radix Portal
vi.mock('@radix-ui/react-portal', () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock ScrollTo
window.scrollTo = vi.fn();

// Global cleanup
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Reset localStorage mock between tests
afterEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});
