import { render, screen } from '@testing-library/react';
import { BudgetProgressBar } from '@/components/dashboard/BudgetProgressBar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      refresh: jest.fn(),
    };
  },
}));

// Mock finance actions
jest.mock('@/lib/actions/finance', () => ({
  upsertBudgetLimit: jest.fn().mockResolvedValue({ success: true }),
}));

describe('BudgetProgressBar Component', () => {
  it('renders spent and limit correctly', () => {
    render(
      <BudgetProgressBar
        spent={500}
        initialLimit={1000}
        categoryId="test-cat"
        month={6}
        year={2026}
      />
    );
    
    expect(screen.getByText('Kullanılan:')).toBeInTheDocument();
    expect(screen.getByText('₺500')).toBeInTheDocument();
    expect(screen.getByText('₺1.000')).toBeInTheDocument();
  });

  it('renders normal progress color and no warning when below 70%', () => {
    const { container } = render(
      <BudgetProgressBar
        spent={500}
        initialLimit={1000} // 50%
        categoryId="test-cat"
        month={6}
        year={2026}
      />
    );
    
    const progressDiv = container.querySelector('.bg-emerald-500');
    expect(progressDiv).toBeInTheDocument();
    
    expect(screen.getByText(/Bütçe durumunuz güvende/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bütçe limitinize yaklaşıyorsunuz/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bütçe limitinizi aştınız/i)).not.toBeInTheDocument();
  });

  it('renders warning color and message when between 70% and 89%', () => {
    render(
      <BudgetProgressBar
        spent={850}
        initialLimit={1000} // 85%
        categoryId="test-cat"
        month={6}
        year={2026}
      />
    );
    
    expect(screen.getByText(/Bütçe limitinize yaklaşıyorsunuz/i)).toBeInTheDocument();
  });

  it('renders danger color and message when 100% or above', () => {
    const { container } = render(
      <BudgetProgressBar
        spent={1000}
        initialLimit={1000} // 100%
        categoryId="test-cat"
        month={6}
        year={2026}
      />
    );
    
    const progressDiv = container.querySelector('.bg-rose-600');
    expect(progressDiv).toBeInTheDocument();
    
    expect(screen.getByText(/Dikkat: Bütçe limitinizi aştınız!/i)).toBeInTheDocument();
  });

  it('handles 0 limit gracefully', () => {
    const { container } = render(
      <BudgetProgressBar
        spent={500}
        initialLimit={0}
        categoryId="test-cat"
        month={6}
        year={2026}
      />
    );
    
    expect(screen.getByText(/Bu kategori için henüz bütçe limiti belirlenmemiş/i)).toBeInTheDocument();
    
    const progressDiv = container.querySelector('.bg-emerald-500') as HTMLElement;
    expect(progressDiv.style.width).toBe('0%');
  });

  it('caps the width at 100% even if spent > limit', () => {
    const { container } = render(
      <BudgetProgressBar
        spent={1500}
        initialLimit={1000} // 150%
        categoryId="test-cat"
        month={6}
        year={2026}
      />
    );
    
    const progressDiv = container.querySelector('.bg-rose-600') as HTMLElement;
    expect(progressDiv.style.width).toBe('100%');
  });
});
