import { Expense } from '@/src/models/budget/expense';

export interface GetPageOptions {
  page?: number;
  pagination?: number;
}

export interface GetBudgetOptions extends GetPageOptions {
  userId: string;
}

export interface GetExpenseOptions extends GetPageOptions {
  budgetId: string;
}

export interface ExpenseResponse {
  expense: Expense;
}
