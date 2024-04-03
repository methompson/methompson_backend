import { v4 as uuidv4 } from 'uuid';

import { Budget } from '@/src/budget/models/budget';
import { BudgetService } from './budget.service';
import { listToObject } from '@/src/utils/array_to_obj';
import {
  GetBudgetOptions,
  ExpenseResponse,
  GetExpenseOptions,
  TransactionOptions,
} from '@/src/budget/types';
import { isNullOrUndefined } from '@/src/utils/type_guards';
import { UnimplementedError } from '@/src/errors';
import { Expense } from '@/src/budget/models/expense';
import { Category } from '@/src/budget/models/category';
import { DepositTransaction } from '@/src/budget/models/deposit_transaction';
import { WithdrawalTransaction } from '@/src/budget/models/withdrawal_transaction';

export interface BudgetInputOptions {
  budgets?: Budget[];
}

export class InMemoryBudgetService implements BudgetService {
  protected _budgets: Record<string, Budget> = {};

  constructor(options: BudgetInputOptions = {}) {
    if (options.budgets) {
      this._budgets = listToObject(options.budgets, (b) => b.id);
    }
  }

  get budgets(): Record<string, Budget> {
    return { ...this._budgets };
  }

  get budgetsList(): Budget[] {
    return Object.values(this._budgets);
  }

  async getBudgets(input: GetBudgetOptions): Promise<Budget[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const filteredBudgets = Object.values(this._budgets)
      .filter((budget) => budget.userId === input.userId)
      .sort((a, b) => a.name.localeCompare(b.name));

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const budgets = filteredBudgets.slice(skip, end);

    return budgets;
  }

  async getBudget(budgetId: string): Promise<Budget> {
    const budget = this._budgets[budgetId];

    if (isNullOrUndefined(budget)) {
      throw new Error(`Budget with ID ${budgetId} not found`);
    }

    return budget;
  }

  async addBudget(budget: Budget): Promise<Budget> {
    const id = uuidv4();

    const newBudget = new Budget(id, budget.userId, budget.name);

    this._budgets[id] = newBudget;

    return newBudget;
  }

  async updateBudget(budget: Budget): Promise<Budget> {
    const { id } = budget;

    const existingBudget = this._budgets[id];

    if (isNullOrUndefined(existingBudget)) {
      throw new Error(`Budget with ID ${id} not found`);
    }

    this._budgets[id] = budget;

    return existingBudget;
  }

  async deleteBudget(budgetId: string): Promise<Budget> {
    const existingBudget = this._budgets[budgetId];

    if (isNullOrUndefined(existingBudget)) {
      throw new Error(`Budget with ID ${budgetId} not found`);
    }

    delete this._budgets[budgetId];

    return existingBudget;
  }

  async getCategories(budgetId: string): Promise<Category[]> {
    throw new UnimplementedError();
  }
  async getCategory(categoryId: string): Promise<Category> {
    throw new UnimplementedError();
  }
  async addCategory(category: Category): Promise<Category> {
    throw new UnimplementedError();
  }
  async updateCategory(category: Category): Promise<Category> {
    throw new UnimplementedError();
  }
  async deleteCategory(categoryId: string): Promise<Category> {
    throw new UnimplementedError();
  }

  async getExpenses(input: GetExpenseOptions): Promise<Expense[]> {
    throw new UnimplementedError();
  }
  async getExpense(expenseId: string): Promise<Expense> {
    throw new UnimplementedError();
  }
  async addExpense(expense: Expense): Promise<ExpenseResponse> {
    throw new UnimplementedError();
  }
  async updateExpense(expense: Expense): Promise<ExpenseResponse> {
    throw new UnimplementedError();
  }
  async deleteExpense(expenseId: string): Promise<ExpenseResponse> {
    throw new UnimplementedError();
  }

  async getDeposits(input: TransactionOptions): Promise<DepositTransaction[]> {
    throw new UnimplementedError();
  }
  async getDeposit(depositId: string): Promise<DepositTransaction> {
    throw new UnimplementedError();
  }
  async addDeposit(deposit: DepositTransaction): Promise<DepositTransaction> {
    throw new UnimplementedError();
  }
  async updateDeposit(
    deposit: DepositTransaction,
  ): Promise<DepositTransaction> {
    throw new UnimplementedError();
  }
  async deleteDeposit(depositId: string): Promise<DepositTransaction> {
    throw new UnimplementedError();
  }

  async getWithdrawals(
    input: TransactionOptions,
  ): Promise<WithdrawalTransaction[]> {
    throw new UnimplementedError();
  }
  async getWithdrawal(withdrawalId: string): Promise<WithdrawalTransaction> {
    throw new UnimplementedError();
  }
  async addWithdrawal(
    withdrawal: WithdrawalTransaction,
  ): Promise<WithdrawalTransaction> {
    throw new UnimplementedError();
  }
  async updateWithdrawal(
    withdrawal: WithdrawalTransaction,
  ): Promise<WithdrawalTransaction> {
    throw new UnimplementedError();
  }
  async deleteWithdrawal(withdrawalId: string): Promise<WithdrawalTransaction> {
    throw new UnimplementedError();
  }
}
