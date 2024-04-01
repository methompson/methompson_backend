import { Budget } from '@/src/models/budget/budget';
import {
  ExpenseResponse,
  GetBudgetOptions,
  GetExpenseOptions,
} from '@/src/budget/types';
import { Expense } from '@/src/models/budget/expense';

export abstract class BudgetService {
  abstract getBudgets(input: GetBudgetOptions): Promise<Budget[]>;
  abstract getBudget(budgetId: string): Promise<Budget>;
  abstract addBudget(budget: Budget): Promise<Budget>;
  abstract updateBudget(budget: Budget): Promise<Budget>;
  abstract deleteBudget(budgetId: string): Promise<Budget>;

  abstract getExpenses(input: GetExpenseOptions): Promise<Expense[]>;
  abstract addExpense(expense: Expense): Promise<ExpenseResponse>;
  abstract updateExpense(expense: Expense): Promise<ExpenseResponse>;
  abstract deleteExpense(expenseId: string): Promise<ExpenseResponse>;
}
