import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { BudgetService } from './budget.service';

import { listToObject } from '@/src/utils/array_to_obj';
import { isNullOrUndefined } from '@/src/utils/type_guards';
import {
  GetBudgetOptions,
  GetExpenseOptions,
  TransactionOptions,
  GetCategoryOptions,
  RecalcFundsOptions,
  ReconciliationOptions,
} from '@/src/budget/types';

import { Budget } from '@/src/budget/models/budget';
import { Category } from '@/src/budget/models/category';
import { DepositTransaction } from '@/src/budget/models/deposit_transaction';
import { Expense } from '@/src/budget/models/expense';
import { Reconciliation } from '@/src/budget/models/reconciliation';
import { WithdrawalTransaction } from '@/src/budget/models/withdrawal_transaction';

export interface BudgetInputOptions {
  budgets?: Budget[];
  categories?: Category[];
  expenses?: Expense[];
  deposits?: DepositTransaction[];
  withdrawals?: WithdrawalTransaction[];
  reconciliations?: Reconciliation[];
}

// All numeric values should be in CENTS, not dollars

@Injectable()
export class InMemoryBudgetService implements BudgetService {
  protected _budgets: Record<string, Budget> = {};
  protected _categories: Record<string, Category> = {};
  protected _expenses: Record<string, Expense> = {};
  protected _deposits: Record<string, DepositTransaction> = {};
  protected _withdrawals: Record<string, WithdrawalTransaction> = {};
  protected _reconciliations: Record<string, Reconciliation> = {};

  constructor(options: BudgetInputOptions = {}) {
    if (options.budgets) {
      this._budgets = listToObject(options.budgets, (b) => b.id);
    }

    if (options.categories) {
      this._categories = listToObject(options.categories, (c) => c.id);
    }

    if (options.expenses) {
      this._expenses = listToObject(options.expenses, (e) => e.id);
    }

    if (options.deposits) {
      this._deposits = listToObject(options.deposits, (d) => d.id);
    }

    if (options.withdrawals) {
      this._withdrawals = listToObject(options.withdrawals, (w) => w.id);
    }

    if (options.reconciliations) {
      this._reconciliations = listToObject(
        options.reconciliations,
        (r) => r.id,
      );
    }
  }

  get budgets(): Record<string, Budget> {
    return { ...this._budgets };
  }

  get budgetsList(): Budget[] {
    return Object.values(this._budgets);
  }

  get categories(): Record<string, Category> {
    return { ...this._categories };
  }

  get categoriesList(): Category[] {
    return Object.values(this._categories);
  }

  get expenses(): Record<string, Expense> {
    return { ...this._expenses };
  }

  get expensesList(): Expense[] {
    return Object.values(this._expenses);
  }

  get deposits(): Record<string, DepositTransaction> {
    return { ...this._deposits };
  }

  get depositsList(): DepositTransaction[] {
    return Object.values(this._deposits);
  }

  get withdrawals(): Record<string, WithdrawalTransaction> {
    return { ...this._withdrawals };
  }

  get withdrawalsList(): WithdrawalTransaction[] {
    return Object.values(this._withdrawals);
  }

  get reconciliations(): Record<string, Reconciliation> {
    return { ...this._reconciliations };
  }

  get reconciliationsList(): Reconciliation[] {
    return Object.values(this._reconciliations);
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

    const newBudget = Budget.fromNewBudget(id, budget);

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

  async getCategories(input: GetCategoryOptions): Promise<Category[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const filteredCategories = Object.values(this.categories)
      .filter((category) => category.budgetId === input.budgetId)
      .sort((a, b) => a.name.localeCompare(b.name));

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const categories = filteredCategories.slice(skip, end);

    return categories;
  }

  async getCategory(categoryId: string): Promise<Category> {
    const category = this._categories[categoryId];

    if (isNullOrUndefined(category)) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    return category;
  }

  async addCategory(category: Category): Promise<Category> {
    const id = uuidv4();

    const newCategory = new Category(id, category.budgetId, category.name);

    this._categories[id] = newCategory;

    return newCategory;
  }

  async updateCategory(category: Category): Promise<Category> {
    const { id } = category;

    const existingCategory = this._categories[id];

    if (isNullOrUndefined(existingCategory)) {
      throw new Error(`Category with ID ${id} not found`);
    }

    this._categories[id] = category;

    return existingCategory;
  }

  async deleteCategory(categoryId: string): Promise<Category> {
    const existingCategory = this._categories[categoryId];

    if (isNullOrUndefined(existingCategory)) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    delete this._categories[categoryId];

    return existingCategory;
  }

  async getExpenses(input: GetExpenseOptions): Promise<Expense[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const filteredExpenses = Object.values(this.expenses)
      .filter((expense) => expense.budgetId === input.budgetId)
      .sort((a, b) => a.description.localeCompare(b.description));

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const expenses = filteredExpenses.slice(skip, end);

    return expenses;
  }

  async getExpense(expenseId: string): Promise<Expense> {
    const expense = this._expenses[expenseId];

    if (isNullOrUndefined(expense)) {
      throw new Error(`Expense with ID ${expenseId} not found`);
    }

    return expense;
  }

  async addExpense(expense: Expense): Promise<Expense> {
    const id = uuidv4();

    const newExpense = Expense.fromNewExpense(id, expense);

    this._expenses[id] = newExpense;

    return newExpense;
  }

  async updateExpense(expense: Expense): Promise<Expense> {
    const { id } = expense;

    const existingExpense = this._expenses[id];

    if (isNullOrUndefined(existingExpense)) {
      throw new Error(`Expense with ID ${id} not found`);
    }

    this._expenses[id] = expense;

    return existingExpense;
  }

  async deleteExpense(expenseId: string): Promise<Expense> {
    const existingExpense = this._expenses[expenseId];

    if (isNullOrUndefined(existingExpense)) {
      throw new Error(`Expense with ID ${expenseId} not found`);
    }

    delete this._expenses[expenseId];

    return existingExpense;
  }

  async getDeposits(input: TransactionOptions): Promise<DepositTransaction[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const filteredDeposits = Object.values(this.deposits)
      .filter((deposit) => deposit.budgetId === input.budgetId)
      .sort((a, b) => b.dateTime.toMillis() - a.dateTime.toMillis());

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const deposits = filteredDeposits.slice(skip, end);

    return deposits;
  }

  async getDeposit(depositId: string): Promise<DepositTransaction> {
    const deposit = this._deposits[depositId];

    if (isNullOrUndefined(deposit)) {
      throw new Error(`Deposit with ID ${depositId} not found`);
    }

    return deposit;
  }

  async addDeposit(deposit: DepositTransaction): Promise<DepositTransaction> {
    const id = uuidv4();

    const newDeposit = DepositTransaction.fromNewDepositTransaction(
      id,
      deposit,
    );

    this._deposits[id] = newDeposit;

    return newDeposit;
  }

  async updateDeposit(
    deposit: DepositTransaction,
  ): Promise<DepositTransaction> {
    const { id } = deposit;

    const existingDeposit = this._deposits[id];

    if (isNullOrUndefined(existingDeposit)) {
      throw new Error(`Deposit with ID ${id} not found`);
    }

    this._deposits[id] = deposit;

    return existingDeposit;
  }

  async deleteDeposit(depositId: string): Promise<DepositTransaction> {
    const deposit = this._deposits[depositId];

    if (isNullOrUndefined(deposit)) {
      throw new Error(`Deposit with ID ${depositId} not found`);
    }

    delete this._deposits[depositId];

    return deposit;
  }

  async getWithdrawals(
    input: TransactionOptions,
  ): Promise<WithdrawalTransaction[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const filteredWithdrawals = Object.values(this.withdrawals)
      .filter((withdrawal) => withdrawal.budgetId === input.budgetId)
      .sort((a, b) => b.dateTime.toMillis() - a.dateTime.toMillis());

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const withdrawals = filteredWithdrawals.slice(skip, end);

    return withdrawals;
  }

  async getWithdrawal(withdrawalId: string): Promise<WithdrawalTransaction> {
    const withdrawal = this._withdrawals[withdrawalId];

    if (isNullOrUndefined(withdrawal)) {
      throw new Error(`Withdrawal with ID ${withdrawalId} not found`);
    }

    return withdrawal;
  }

  async addWithdrawal(
    withdrawal: WithdrawalTransaction,
  ): Promise<WithdrawalTransaction> {
    const id = uuidv4();

    const newWithdrawal = WithdrawalTransaction.fromNewWithdrawalTransaction(
      id,
      withdrawal,
    );

    this._withdrawals[id] = newWithdrawal;

    return newWithdrawal;
  }

  async updateWithdrawal(
    withdrawal: WithdrawalTransaction,
  ): Promise<WithdrawalTransaction> {
    const { id } = withdrawal;

    const existingWithdrawal = this._withdrawals[id];

    if (isNullOrUndefined(existingWithdrawal)) {
      throw new Error(`Withdrawal with ID ${id} not found`);
    }

    this._withdrawals[id] = withdrawal;

    return existingWithdrawal;
  }

  async deleteWithdrawal(withdrawalId: string): Promise<WithdrawalTransaction> {
    const withdrawal = this._withdrawals[withdrawalId];

    if (isNullOrUndefined(withdrawal)) {
      throw new Error(`Withdrawal with ID ${withdrawalId} not found`);
    }

    delete this._withdrawals[withdrawalId];

    return withdrawal;
  }

  async getReconciliations(
    input: ReconciliationOptions,
  ): Promise<Reconciliation[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const filteredReconciliations = Object.values(this.reconciliations)
      .filter((reconciliation) => reconciliation.budgetId === input.budgetId)
      .sort((a, b) => b.date.toMillis() - a.date.toMillis());

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const reconciliations = filteredReconciliations.slice(skip, end);

    return reconciliations;
  }

  async addReconciliation(
    reconciliation: Reconciliation,
  ): Promise<Reconciliation> {
    const id = uuidv4();

    const newReconciliation = Reconciliation.fromNewReconciliation(
      id,
      reconciliation,
    );

    this._reconciliations[id] = newReconciliation;

    return newReconciliation;
  }

  async deleteReconciliation(
    reconciliationId: string,
  ): Promise<Reconciliation> {
    const reconciliation = this._reconciliations[reconciliationId];

    if (isNullOrUndefined(reconciliation)) {
      throw new Error(`Reconciliation with ID ${reconciliationId} not found`);
    }

    delete this._reconciliations[reconciliationId];

    return reconciliation;
  }

  // Find the latest reconciliation, subtract all withdrawals and add all deposits
  // If there are no reconciliations, start with 0 for the balance and start
  // with the earliest date possible.
  async recalculateFunds(input: RecalcFundsOptions): Promise<number> {
    const latestReconciliation = (
      await this.getReconciliations({
        budgetId: input.budgetId,
        page: 1,
        pagination: 1,
      })
    )[0];

    const startingValue = latestReconciliation?.balance ?? 0;
    const startingDate = latestReconciliation?.date ?? DateTime.fromMillis(0);

    if (!startingDate.isValid) {
      throw new Error('Invalid Starting Date');
    }

    // filters all withdrawals and deposits that are after the starting date
    // and sums them up
    const withdrawals = this.withdrawalsList
      .filter(
        (el) => el.budgetId === input.budgetId && el.dateTime >= startingDate,
      )
      .reduce((acc, withdrawal) => acc + withdrawal.amount, 0);
    const deposits = this.depositsList
      .filter(
        (el) => el.budgetId === input.budgetId && el.dateTime >= startingDate,
      )
      .reduce((acc, deposit) => acc + deposit.amount, 0);

    return startingValue + deposits - withdrawals;
  }
}
