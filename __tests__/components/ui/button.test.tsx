import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toBeInTheDocument();
  });

  it('applies the primary variant class by default', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toHaveClass('bg-primary');
  });
});
