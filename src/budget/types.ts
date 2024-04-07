import { Expense } from '@/src/budget/models/expense';

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

export interface TransactionOptions extends GetPageOptions {
  budgetId: string;
  startDate: string;
  endDate: string;
}

export interface GetCategoryOptions extends GetPageOptions {
  budgetId: string;
}

export interface ReconciliationOptions extends GetPageOptions {
  budgetId: string;
}

export interface RecalcFundsOptions {
  budgetId: string;
}
