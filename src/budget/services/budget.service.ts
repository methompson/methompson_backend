import { Injectable } from '@nestjs/common';

import { Budget } from '@/src/budget/models/budget';
import {
  GetBudgetOptions,
  GetCategoryOptions,
  GetExpenseOptions,
  RecalcFundsOptions,
  ReconciliationOptions,
  TransactionOptions,
} from '@/src/budget/types';
import { Expense } from '@/src/budget/models/expense';
import { Category } from '@/src/budget/models/category';
import { DepositTransaction } from '@/src/budget/models/deposit_transaction';
import { WithdrawalTransaction } from '@/src/budget/models/withdrawal_transaction';
import { Reconciliation } from '@/src/budget/models/reconciliation';

export interface RecalcFundsResponse {
  funds: number;
}

// All numeric values should be in CENTS, not dollars

@Injectable()
export abstract class BudgetService {
  abstract getBudgets(input: GetBudgetOptions): Promise<Budget[]>;
  abstract getBudget(budgetId: string): Promise<Budget>;
  abstract addBudget(budget: Budget): Promise<Budget>;
  abstract updateBudget(budget: Budget): Promise<Budget>;
  abstract deleteBudget(budgetId: string): Promise<Budget>;

  abstract getCategories(input: GetCategoryOptions): Promise<Category[]>;
  abstract getCategory(categoryId: string): Promise<Category>;
  abstract addCategory(category: Category): Promise<Category>;
  abstract updateCategory(category: Category): Promise<Category>;
  abstract deleteCategory(categoryId: string): Promise<Category>;

  abstract getExpenses(input: GetExpenseOptions): Promise<Expense[]>;
  abstract getExpense(expenseId: string): Promise<Expense>;
  abstract addExpense(expense: Expense): Promise<Expense>;
  abstract updateExpense(expense: Expense): Promise<Expense>;
  abstract deleteExpense(expenseId: string): Promise<Expense>;

  abstract getDeposits(
    input: TransactionOptions,
  ): Promise<DepositTransaction[]>;
  abstract getDeposit(depositId: string): Promise<DepositTransaction>;
  abstract addDeposit(deposit: DepositTransaction): Promise<DepositTransaction>;
  abstract updateDeposit(
    deposit: DepositTransaction,
  ): Promise<DepositTransaction>;
  abstract deleteDeposit(depositId: string): Promise<DepositTransaction>;

  abstract getWithdrawals(
    input: TransactionOptions,
  ): Promise<WithdrawalTransaction[]>;
  abstract getWithdrawal(withdrawalId: string): Promise<WithdrawalTransaction>;
  abstract addWithdrawal(
    withdrawal: WithdrawalTransaction,
  ): Promise<WithdrawalTransaction>;
  abstract updateWithdrawal(
    withdrawal: WithdrawalTransaction,
  ): Promise<WithdrawalTransaction>;
  abstract deleteWithdrawal(
    withdrawalId: string,
  ): Promise<WithdrawalTransaction>;

  abstract getReconciliations(
    input: ReconciliationOptions,
  ): Promise<Reconciliation[]>;
  abstract addRecociliation(
    reconciliation: Reconciliation,
  ): Promise<Reconciliation>;
  abstract deleteReconciliation(
    reconciliationId: string,
  ): Promise<Reconciliation>;

  abstract recalcFunds(input: RecalcFundsOptions): Promise<number>;
}
