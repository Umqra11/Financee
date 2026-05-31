import { checkBudgetLimit } from '@/lib/actions/finance';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('finance - checkBudgetLimit', () => {
  const mockCreateClient = createClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupSupabaseMock = (budgetData: any, expensesData: any) => {
    const fromMock = jest.fn((table: string) => {
      const createQueryBuilder = (result: any) => {
        const builder: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
        };
        builder.then = (resolve: any) => Promise.resolve(result).then(resolve);
        return builder;
      };

      if (table === 'budgets') {
        return createQueryBuilder({ data: budgetData, error: null });
      }
      if (table === 'transactions') {
        return createQueryBuilder({ data: expensesData, error: null });
      }
      return createQueryBuilder({ data: [], error: null });
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: fromMock,
    });
  };

  it('returns false for warnings when percentage < 80', async () => {
    setupSupabaseMock([{ amount: 1000 }], [{ amount: 500 }, { amount: 200 }]); // 70%

    const result = await checkBudgetLimit({ categoryId: 'cat-1', month: 10, year: 2023 });

    expect(result).toEqual({
      hasBudget: true,
      budgetAmount: 1000,
      expenseAmount: 700,
      percentage: 70,
      isWarning: false,
      isDanger: false,
    });
  });

  it('sets isWarning to true when percentage is exactly 80%', async () => {
    setupSupabaseMock([{ amount: 1000 }], [{ amount: 800 }]); // 80%

    const result = await checkBudgetLimit({ categoryId: 'cat-1', month: 10, year: 2023 });

    expect(result.isWarning).toBe(true);
    expect(result.isDanger).toBe(false);
  });

  it('sets isWarning to true when percentage is between 80% and 99%', async () => {
    setupSupabaseMock([{ amount: 1000 }], [{ amount: 950 }]); // 95%

    const result = await checkBudgetLimit({ categoryId: 'cat-1', month: 10, year: 2023 });

    expect(result.isWarning).toBe(true);
    expect(result.isDanger).toBe(false);
  });

  it('sets isDanger to true when percentage is exactly 100%', async () => {
    setupSupabaseMock([{ amount: 1000 }], [{ amount: 1000 }]); // 100%

    const result = await checkBudgetLimit({ categoryId: 'cat-1', month: 10, year: 2023 });

    expect(result.isWarning).toBe(false);
    expect(result.isDanger).toBe(true);
  });

  it('sets isDanger to true when percentage > 100%', async () => {
    setupSupabaseMock([{ amount: 1000 }], [{ amount: 1200 }]); // 120%

    const result = await checkBudgetLimit({ categoryId: 'cat-1', month: 10, year: 2023 });

    expect(result.isWarning).toBe(false);
    expect(result.isDanger).toBe(true);
    expect(result.percentage).toBe(120);
  });

  it('handles case where there is no budget for the category', async () => {
    setupSupabaseMock([], []); // no budget

    const result = await checkBudgetLimit({ categoryId: 'cat-1', month: 10, year: 2023 });

    expect(result).toEqual({
      hasBudget: false,
      budgetAmount: 0,
      expenseAmount: 0,
      percentage: 0,
      isWarning: false,
      isDanger: false,
    });
  });
});
