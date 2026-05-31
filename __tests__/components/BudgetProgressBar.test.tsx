import { render, screen } from '@testing-library/react';
import { BudgetProgressBar } from '@/components/dashboard/BudgetProgressBar';

describe('BudgetProgressBar Component', () => {
  it('renders spent and limit correctly', () => {
    render(<BudgetProgressBar spent={500} limit={1000} />);
    
    expect(screen.getByText('Kullanılan: ₺500')).toBeInTheDocument();
    expect(screen.getByText('Limit: ₺1000')).toBeInTheDocument();
  });

  it('renders normal progress color and no warning when below 80%', () => {
    const { container } = render(<BudgetProgressBar spent={500} limit={1000} />); // 50%
    
    const progressDiv = container.querySelector('.bg-zinc-800');
    expect(progressDiv).toBeInTheDocument();
    
    expect(screen.queryByText(/Bütçe limitinize yaklaşıyorsunuz/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bütçe limitinizi aştınız/i)).not.toBeInTheDocument();
  });

  it('renders warning color and message when between 80% and 99%', () => {
    const { container } = render(<BudgetProgressBar spent={850} limit={1000} />); // 85%
    
    const progressDiv = container.querySelector('.bg-amber-500');
    expect(progressDiv).toBeInTheDocument();
    
    expect(screen.getByText('Bütçe limitinize yaklaşıyorsunuz.')).toBeInTheDocument();
  });

  it('renders danger color and message when 100% or above', () => {
    const { container } = render(<BudgetProgressBar spent={1000} limit={1000} />); // 100%
    
    const progressDiv = container.querySelector('.bg-red-500');
    expect(progressDiv).toBeInTheDocument();
    
    expect(screen.getByText('Dikkat: Bütçe limitinizi aştınız!')).toBeInTheDocument();
  });

  it('handles 0 limit gracefully', () => {
    const { container } = render(<BudgetProgressBar spent={500} limit={0} />);
    
    // Percentage should be 0, so no warning
    expect(screen.queryByText(/Bütçe limitinize yaklaşıyorsunuz/i)).not.toBeInTheDocument();
    
    // Width should be 0%
    const progressDiv = container.querySelector('.bg-zinc-800') as HTMLElement;
    expect(progressDiv.style.width).toBe('0%');
  });

  it('caps the width at 100% even if spent > limit', () => {
    const { container } = render(<BudgetProgressBar spent={1500} limit={1000} />); // 150%
    
    const progressDiv = container.querySelector('.bg-red-500') as HTMLElement;
    expect(progressDiv.style.width).toBe('100%');
  });
});
