import { render, screen } from '@testing-library/react';
import { Badge } from './badge';
import { describe, it, expect } from 'vitest';

describe('Badge Component', () => {
  it('renders the badge with correct text', () => {
    render(<Badge>Default Badge</Badge>);
    expect(screen.getByText('Default Badge')).toBeInTheDocument();
  });

  it('applies the correct variant class', () => {
    const { container } = render(<Badge variant="destructive">Destructive Badge</Badge>);
    // The actual class names depend on the implementation, but we check if it exists
    expect(container.firstChild).toHaveClass('bg-destructive');
  });
});
