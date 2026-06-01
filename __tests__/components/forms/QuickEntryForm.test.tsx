import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickEntryForm } from '@/components/forms/QuickEntryForm';

describe('QuickEntryForm', () => {
  it('renders the main form elements', () => {
    render(<QuickEntryForm />);
    expect(screen.getByLabelText(/Tutar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kaydet/i })).toBeInTheDocument();
  });

  it('updates amount field when user types', async () => {
    render(<QuickEntryForm />);
    const user = userEvent.setup();
    const amountInput = screen.getByLabelText(/Tutar/i);
    await user.type(amountInput, '150');
    expect(amountInput).toHaveValue(150);
  });
});
