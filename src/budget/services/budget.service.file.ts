import { join } from 'path';
import { Injectable } from '@nestjs/common';

import {
  type BudgetInputOptions,
  InMemoryBudgetService,
} from './budget.service.memory';
import { FileServiceWriter } from '@/src/utils/file_service_writer';
import { isRecord } from '@/src/utils/type_guards';
import { Budget } from '@/src/budget/models/budget';
import { Category } from '@/src/budget/models/category';
import { Expense } from '@/src/budget/models/expense';
import { WithdrawalTransaction } from '@/src/budget/models/withdrawal_transaction';
import { DepositTransaction } from '@/src/budget/models/deposit_transaction';
import { Reconciliation } from '@/src/budget/models/reconciliation';

const BASE_NAME = 'budget_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileBudgetService extends InMemoryBudgetService {
  constructor(
    protected readonly fileServiceWriter: FileServiceWriter,
    protected readonly budgetPath: string,
    options: BudgetInputOptions = {},
  ) {
    super(options);
  }

  get budgetString(): string {
    return JSON.stringify({
      budgets: this.budgetsList,
      categories: this.categoriesList,
      expenses: this.expensesList,
      deposits: this.depositsList,
      withdrawals: this.withdrawalsList,
      reconciliations: this.reconciliationsList,
    });
  }

  async addBudget(budget: Budget): Promise<Budget> {
    const result = super.addBudget(budget);

    await this.writeToFile();

    return result;
  }

  async updateBudget(budget: Budget): Promise<Budget> {
    const result = await super.updateBudget(budget);

    await this.writeToFile();

    return result;
  }

  async deleteBudget(budgetId: string): Promise<Budget> {
    const result = await super.deleteBudget(budgetId);

    await this.writeToFile();

    return result;
  }

  async addCategory(category: Category): Promise<Category> {
    const result = super.addCategory(category);

    await this.writeToFile();

    return result;
  }

  async updateCategory(category: Category): Promise<Category> {
    const result = await super.updateCategory(category);

    await this.writeToFile();

    return result;
  }

  async deleteCategory(categoryId: string): Promise<Category> {
    const result = await super.deleteCategory(categoryId);

    await this.writeToFile();

    return result;
  }

  async addExpense(expense: Expense): Promise<Expense> {
    const result = super.addExpense(expense);

    await this.writeToFile();

    return result;
  }

  async updateExpense(expense: Expense): Promise<Expense> {
    const result = await super.updateExpense(expense);

    await this.writeToFile();

    return result;
  }

  async deleteExpense(expenseId: string): Promise<Expense> {
    const result = await super.deleteExpense(expenseId);

    await this.writeToFile();

    return result;
  }

  async addDeposit(deposit: DepositTransaction): Promise<DepositTransaction> {
    const result = super.addDeposit(deposit);

    await this.writeToFile();

    return result;
  }

  async updateDeposit(
    deposit: DepositTransaction,
  ): Promise<DepositTransaction> {
    const result = await super.updateDeposit(deposit);

    await this.writeToFile();

    return result;
  }

  async deleteDeposit(depositId: string): Promise<DepositTransaction> {
    const result = await super.deleteDeposit(depositId);

    await this.writeToFile();

    return result;
  }

  async addWithdrawal(
    withdrawal: WithdrawalTransaction,
  ): Promise<WithdrawalTransaction> {
    const result = super.addWithdrawal(withdrawal);

    await this.writeToFile();

    return result;
  }

  async updateWithdrawal(
    withdrawal: WithdrawalTransaction,
  ): Promise<WithdrawalTransaction> {
    const result = await super.updateWithdrawal(withdrawal);

    await this.writeToFile();

    return result;
  }

  async deleteWithdrawal(withdrawalId: string): Promise<WithdrawalTransaction> {
    const result = await super.deleteWithdrawal(withdrawalId);

    await this.writeToFile();

    return result;
  }

  async addReconciliation(
    reconciliation: Reconciliation,
  ): Promise<Reconciliation> {
    const result = super.addReconciliation(reconciliation);

    await this.writeToFile();

    return result;
  }

  async deleteReconciliation(
    reconciliationId: string,
  ): Promise<Reconciliation> {
    const result = await super.deleteReconciliation(reconciliationId);

    await this.writeToFile();

    return result;
  }

  async writeToFile(): Promise<void> {
    const json = this.budgetString;

    await this.fileServiceWriter.writeToFile(this.budgetPath, json);
  }

  async backup() {
    const backupPath = join(this.budgetPath, 'backup');
    await this.fileServiceWriter.writeBackup(backupPath, this.budgetString);
  }

  static async init(
    viceBankPath: string,
    options?: { fileServiceWriter?: FileServiceWriter },
  ): Promise<FileBudgetService> {
    const fileServiceWriter =
      options?.fileServiceWriter ??
      new FileServiceWriter(BASE_NAME, FILE_EXTENSION);

    let rawData = '';

    const budgetsList: Budget[] = [];
    const categoriesList: Category[] = [];
    const expensesList: Expense[] = [];
    const depositsList: DepositTransaction[] = [];
    const withdrawalsList: WithdrawalTransaction[] = [];
    const reconciliationsList: Reconciliation[] = [];

    try {
      rawData = await fileServiceWriter.readFile(viceBankPath);

      const json = JSON.parse(rawData);

      if (!isRecord(json)) {
        throw new Error('Invalid JSON data');
      }

      const {
        budgets,
        categories,
        expenses,
        deposits,
        withdrawals,
        reconciliations,
      } = json;

      if (Array.isArray(budgets)) {
        for (const val of budgets) {
          try {
            budgetsList.push(Budget.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }

      if (Array.isArray(categories)) {
        for (const val of categories) {
          try {
            categoriesList.push(Category.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }

      if (Array.isArray(expenses)) {
        for (const val of expenses) {
          try {
            expensesList.push(Expense.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }

      if (Array.isArray(deposits)) {
        for (const val of deposits) {
          try {
            depositsList.push(DepositTransaction.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }

      if (Array.isArray(withdrawals)) {
        for (const val of withdrawals) {
          try {
            withdrawalsList.push(WithdrawalTransaction.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }

      if (Array.isArray(reconciliations)) {
        for (const val of reconciliations) {
          try {
            reconciliationsList.push(Reconciliation.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }
    } catch (e) {
      try {
        if (rawData.length > 0) {
          console.error('Invalid or no data when reading file data file', e);
          const backupPath = join(viceBankPath, 'backup');
          await fileServiceWriter.writeBackup(backupPath, rawData);
        } else {
          console.error('Init: No file data found. Creating new file.');
        }

        await fileServiceWriter.clearFile(viceBankPath);
      } catch (e) {
        console.error('unable to write to disk', e);
      }
    }

    return new FileBudgetService(fileServiceWriter, viceBankPath, {
      budgets: budgetsList,
      categories: categoriesList,
      expenses: expensesList,
      deposits: depositsList,
      withdrawals: withdrawalsList,
      reconciliations: reconciliationsList,
    });
  }
}
