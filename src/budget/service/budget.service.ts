import { Injectable } from '@nestjs/common';

import { Budget } from '@/src/budget/models/budget';
import {
  ExpenseResponse,
  GetBudgetOptions,
  GetExpenseOptions,
  TransactionOptions,
} from '@/src/budget/types';
import { Expense } from '@/src/budget/models/expense';
import { Category } from '@/src/budget/models/category';
import { DepositTransaction } from '@/src/budget/models/deposit_transaction';
import { WithdrawalTransaction } from '@/src/budget/models/withdrawal_transaction';

@Injectable()
export abstract class BudgetService {
  abstract getBudgets(input: GetBudgetOptions): Promise<Budget[]>;
  abstract getBudget(budgetId: string): Promise<Budget>;
  abstract addBudget(budget: Budget): Promise<Budget>;
  abstract updateBudget(budget: Budget): Promise<Budget>;
  abstract deleteBudget(budgetId: string): Promise<Budget>;

  // abstract getCategories(budgetId: string): Promise<Category[]>;
  // abstract getCategory(categoryId: string): Promise<Category>;
  // abstract addCategory(category: Category): Promise<Category>;
  // abstract updateCategory(category: Category): Promise<Category>;
  // abstract deleteCategory(categoryId: string): Promise<Category>;

  // abstract getExpenses(input: GetExpenseOptions): Promise<Expense[]>;
  // abstract getExpense(expenseId: string): Promise<Expense>;
  // abstract addExpense(expense: Expense): Promise<ExpenseResponse>;
  // abstract updateExpense(expense: Expense): Promise<ExpenseResponse>;
  // abstract deleteExpense(expenseId: string): Promise<ExpenseResponse>;

  // abstract getDeposits(
  //   input: TransactionOptions,
  // ): Promise<DepositTransaction[]>;
  // abstract getDeposit(depositId: string): Promise<DepositTransaction>;
  // abstract addDeposit(deposit: DepositTransaction): Promise<DepositTransaction>;
  // abstract updateDeposit(
  //   deposit: DepositTransaction,
  // ): Promise<DepositTransaction>;
  // abstract deleteDeposit(depositId: string): Promise<DepositTransaction>;

  // abstract getWithdrawals(
  //   input: TransactionOptions,
  // ): Promise<WithdrawalTransaction[]>;
  // abstract getWithdrawal(withdrawalId: string): Promise<WithdrawalTransaction>;
  // abstract addWithdrawal(
  //   withdrawal: WithdrawalTransaction,
  // ): Promise<WithdrawalTransaction>;
  // abstract updateWithdrawal(
  //   withdrawal: WithdrawalTransaction,
  // ): Promise<WithdrawalTransaction>;
  // abstract deleteWithdrawal(
  //   withdrawalId: string,
  // ): Promise<WithdrawalTransaction>;
}
