'use server';

export async function getTransactions(params?: { month?: number; year?: number; categoryId?: string; }) {
  return [
    { id: '1', amount: 1500, date: '2026-06-01', description: 'Market', category_id: 'food', type: 'expense', categories: { name: 'Mutfak', color: '#ff0000', icon: 'ShoppingCart' } },
    { id: '2', amount: 5000, date: '2026-06-02', description: 'Kira', category_id: 'rent', type: 'expense', categories: { name: 'Ev', color: '#00ff00', icon: 'Home' } }
  ];
}

export async function getMonthlyExpenseByCategory(params: { month: number; year: number; }) {
  return [
    { categoryId: 'food', category: { name: 'Mutfak', color: '#ff0000', icon: 'ShoppingCart' }, totalAmount: 1500 },
    { categoryId: 'rent', category: { name: 'Ev', color: '#00ff00', icon: 'Home' }, totalAmount: 5000 }
  ];
}

export async function checkBudgetLimit(params: { categoryId: string; month: number; year: number; }) {
  return { hasBudget: true, budgetAmount: 2000, expenseAmount: 1500, percentage: 75, isWarning: false, isDanger: false };
}
