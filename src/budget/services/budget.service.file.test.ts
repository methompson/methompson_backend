import * as uuid from 'uuid';

import { Budget, BudgetJSON } from '@/src/budget/models/budget';
import { Category, CategoryJSON } from '@/src/budget/models/category';
import { Expense, ExpenseJSON } from '@/src/budget/models/expense';
import {
  ExpenseTargetJSON,
  ExpenseTargetType,
} from '@/src/budget/models/expense_target';

import {
  WithdrawalTransaction,
  WithdrawalTransactionJSON,
} from '@/src/budget/models/withdrawal_transaction';
import {
  DepositTransaction,
  DepositTransactionJSON,
} from '@/src/budget/models/deposit_transaction';
import {
  Reconciliation,
  ReconciliationJSON,
} from '@/src/budget/models/reconciliation';
import { FileServiceWriter } from '@/src/utils/file_service_writer';
import { FileBudgetService } from './budget.service.file';

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

const userId = 'userId';
const budgetId = 'budgetId';
const budgetName = 'budgetName';

const validBudget1: BudgetJSON = {
  id: budgetId,
  userId,
  name: budgetName,
  currentFunds: 0,
};

const validBudget2: BudgetJSON = {
  id: 'budgetId2',
  userId,
  name: 'Budget 2',
  currentFunds: 0,
};

const budget1 = Budget.fromJSON(validBudget1);
const budget2 = Budget.fromJSON(validBudget2);

const categoryId = 'categoryId1';

const validCategory1: CategoryJSON = {
  id: categoryId,
  budgetId,
  name: 'Expense Category',
};

const validCategory2: CategoryJSON = {
  id: 'categoryId2',
  budgetId,
  name: 'Expense Category 2',
};

const category1 = Category.fromJSON(validCategory1);
const category2 = Category.fromJSON(validCategory2);

const validTarget: ExpenseTargetJSON = {
  type: ExpenseTargetType.Monthly,
  data: { dayOfMonth: 15 },
};

const expenseId = 'expenseId1';
const expenseDescription = 'Expense 1';
const expenseAmount = 100;

const validExpense1: ExpenseJSON = {
  id: expenseId,
  budgetId,
  categoryId: validCategory1.id,
  description: expenseDescription,
  amount: expenseAmount,
  expenseTarget: validTarget,
};

const validExpense2: ExpenseJSON = {
  id: 'expenseId2',
  budgetId,
  categoryId: validCategory1.id,
  description: 'expense 2',
  amount: expenseAmount,
  expenseTarget: validTarget,
};

const expense1 = Expense.fromJSON(validExpense1);
const expense2 = Expense.fromJSON(validExpense2);

const withdrawalId = 'withdrawalId1';

const validWithdrawal1: WithdrawalTransactionJSON = {
  id: withdrawalId,
  budgetId,
  expenseId,
  description: 'Withdrawal',
  dateTime: '2024-01-25T12:00:00.000-06:00',
  amount: 25,
};

const validWithdrawal2: WithdrawalTransactionJSON = {
  id: 'withdrawalId2',
  budgetId,
  expenseId,
  description: 'Withdrawal 2',
  dateTime: '2024-01-25T12:01:00.000-06:00',
  amount: 25,
};

const withdrawal1 = WithdrawalTransaction.fromJSON(validWithdrawal1);
const withdrawal2 = WithdrawalTransaction.fromJSON(validWithdrawal2);

const depositId = 'depositId1';
const validDeposit1: DepositTransactionJSON = {
  id: depositId,
  budgetId,
  description: 'Deposit',
  dateTime: '2024-01-20T12:00:00.000-06:00',
  amount: 100,
};
const validDeposit2: DepositTransactionJSON = {
  id: 'depositId2',
  budgetId,
  description: 'Deposit 2',
  dateTime: '2024-01-20T12:01:00.000-06:00',
  amount: 100,
};

const deposit1 = DepositTransaction.fromJSON(validDeposit1);
const deposit2 = DepositTransaction.fromJSON(validDeposit2);

const reconciliationId = 'reconciliationId1';

const validReconciliation1: ReconciliationJSON = {
  id: reconciliationId,
  budgetId,
  date: '2024-01-22',
  balance: 300,
};
const validReconciliation2: ReconciliationJSON = {
  id: 'reconciliationId2',
  budgetId,
  date: '2024-01-20',
  balance: 300,
};

const reconciliation1 = Reconciliation.fromJSON(validReconciliation1);
const reconciliation2 = Reconciliation.fromJSON(validReconciliation2);

const filePath = 'path/to/file';

describe('FileBudgetService', () => {
  describe('budgetString', () => {
    test('returns a stringified JSON object', () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const service = new FileBudgetService(fsw, filePath, {
        budgets: [budget1, budget2],
        categories: [category1, category2],
        expenses: [expense1, expense2],
        withdrawals: [withdrawal1, withdrawal2],
        deposits: [deposit1, deposit2],
        reconciliations: [reconciliation1, reconciliation2],
      });

      const str = service.budgetString;
      const json = JSON.parse(str);

      expect(json).toEqual({
        budgets: [validBudget1, validBudget2],
        categories: [validCategory1, validCategory2],
        expenses: [validExpense1, validExpense2],
        withdrawals: [validWithdrawal1, validWithdrawal2],
        deposits: [validDeposit1, validDeposit2],
        reconciliations: [validReconciliation1, validReconciliation2],
      });
    });

    test('returns a stringified object with empty arrays when no budgets exist', () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const service = new FileBudgetService(fsw, filePath, {});

      const str = service.budgetString;
      const json = JSON.parse(str);

      expect(json).toEqual({
        budgets: [],
        categories: [],
        expenses: [],
        withdrawals: [],
        deposits: [],
        reconciliations: [],
      });
    });
  });

  describe('budget', () => {
    describe('addBudget', () => {
      test('adds a budget and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {});

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        uuidv4.mockImplementationOnce(() => budgetId);

        expect(service.budgetsList).toEqual([]);

        const result = await service.addBudget(budget1);

        expect(service.budgetsList).toEqual([budget1]);

        expect(result).toEqual(budget1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if writeToFiles throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {});

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error('writeToFile error'));

        uuidv4.mockImplementationOnce(() => budgetId);

        expect(service.budgetsList).toEqual([]);

        await expect(() => service.addBudget(budget1)).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });

    describe('updateBudget', () => {
      test('updates a budget and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.budgetsList).toEqual([budget1]);

        const updatedBudget = Budget.fromJSON({
          ...validBudget1,
          name: 'Updated Budget',
        });

        const result = await service.updateBudget(updatedBudget);

        expect(service.budgetsList).toEqual([updatedBudget]);

        expect(result).toEqual(budget1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if the budget does not exist', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.budgetsList).toEqual([]);

        await expect(() => service.updateBudget(budget1)).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error('writeToFile error'));

        await expect(() => service.updateBudget(budget1)).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('deleteBudget', () => {
      test('deletes a budget and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.budgetsList).toEqual([budget1, budget2]);

        const result = await service.deleteBudget(budget1.id);

        expect(service.budgetsList).toEqual([budget2]);

        expect(result).toEqual(budget1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if the budget does not exist', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        await expect(() => service.deleteBudget(budget1.id)).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error('writeToFile error'));

        await expect(() => service.deleteBudget(budget1.id)).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });
  });

  describe('category', () => {
    describe('addCategory', () => {
      test('adds a category and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        uuidv4.mockImplementationOnce(() => categoryId);

        expect(service.categoriesList).toEqual([]);

        const result = await service.addCategory(category1);

        expect(service.categoriesList).toEqual([category1]);

        expect(result).toEqual(category1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error('writeToFile error'));

        uuidv4.mockImplementationOnce(() => categoryId);

        expect(service.categoriesList).toEqual([]);

        await expect(() => service.addCategory(category1)).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });

    describe('updateCategory', () => {
      test('updates a category and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.categoriesList).toEqual([category1]);

        const updatedCategory = Category.fromJSON({
          ...validCategory1,
          name: 'Updated Budget',
        });

        const result = await service.updateCategory(updatedCategory);

        expect(service.categoriesList).toEqual([updatedCategory]);

        expect(result).toEqual(category1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if the category does not exist', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.categoriesList).toEqual([]);

        const updatedCategory = Category.fromJSON({
          ...validCategory1,
          name: 'Updated Budget',
        });

        await expect(() =>
          service.updateCategory(updatedCategory),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error('test error'));

        expect(service.categoriesList).toEqual([category1]);

        const updatedCategory = Category.fromJSON({
          ...validCategory1,
          name: 'Updated Budget',
        });

        await expect(() =>
          service.updateCategory(updatedCategory),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });

    describe('deleteCategory', () => {
      test('deletes a category and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.categoriesList).toEqual([category1, category2]);

        const result = await service.deleteCategory(category1.id);

        expect(service.categoriesList).toEqual([category2]);

        expect(result).toEqual(category1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if the category does not exist', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.categoriesList).toEqual([category2]);

        await expect(() =>
          service.deleteCategory(category1.id),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        expect(service.categoriesList).toEqual([category1, category2]);

        await expect(() =>
          service.deleteCategory(category1.id),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });
  });

  describe('expense', () => {
    describe('addExpense', () => {
      test('adds an expense and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1],
          categories: [category1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        uuidv4.mockImplementationOnce(() => expenseId);

        expect(service.expensesList).toEqual([]);

        const result = await service.addExpense(expense1);

        expect(service.expensesList).toEqual([expense1]);

        expect(result).toEqual(expense1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1],
          categories: [category1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        expect(service.expensesList).toEqual([]);

        await expect(() => service.addExpense(expense1)).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });

    describe('updateExpense', () => {
      test('updates an expense and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.expensesList).toEqual([expense1]);

        const updatedExpense = Expense.fromJSON({
          ...validExpense1,
          description: 'Updated Expense',
        });

        const result = await service.updateExpense(updatedExpense);

        expect(service.expensesList).toEqual([updatedExpense]);

        expect(result).toEqual(expense1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if the expense does not exist', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.expensesList).toEqual([]);

        const updatedExpense = Expense.fromJSON({
          ...validExpense1,
          description: 'Updated Expense',
        });

        await expect(() =>
          service.updateExpense(updatedExpense),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        expect(service.expensesList).toEqual([expense1]);

        const updatedExpense = Expense.fromJSON({
          ...validExpense1,
          description: 'Updated Expense',
        });

        await expect(() =>
          service.updateExpense(updatedExpense),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });

    describe('deleteExpense', () => {
      test('deletes an expense and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.expensesList).toEqual([expense1, expense2]);

        const result = await service.deleteExpense(expense1.id);

        expect(service.expensesList).toEqual([expense2]);

        expect(result).toEqual(expense1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if the expense does not exist', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.expensesList).toEqual([expense2]);

        await expect(() =>
          service.deleteExpense(expense1.id),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        expect(service.expensesList).toEqual([expense1, expense2]);

        await expect(() =>
          service.deleteExpense(expense1.id),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });
  });

  describe('deposit', () => {
    describe('addDeposit', () => {
      test('adds a deposit and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        uuidv4.mockImplementationOnce(() => depositId);

        expect(service.depositsList).toEqual([]);

        const result = await service.addDeposit(deposit1);

        expect(service.depositsList).toEqual([deposit1]);

        expect(result).toEqual(deposit1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        uuidv4.mockImplementationOnce(() => depositId);

        expect(service.depositsList).toEqual([]);

        await expect(() => service.addDeposit(deposit1)).rejects.toThrow();

        expect(service.depositsList).toEqual([deposit1]);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });

    describe('updateDeposit', () => {
      test('updates a deposit and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.depositsList).toEqual([deposit1]);

        const updatedDeposit = DepositTransaction.fromJSON({
          ...validDeposit1,
          description: 'Updated Deposit',
        });

        const result = await service.updateDeposit(updatedDeposit);

        expect(service.depositsList).toEqual([updatedDeposit]);

        expect(result).toEqual(deposit1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if the deposit does not exist', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.depositsList).toEqual([]);

        const updatedDeposit = DepositTransaction.fromJSON({
          ...validDeposit1,
          description: 'Updated Deposit',
        });

        await expect(() =>
          service.updateDeposit(updatedDeposit),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        expect(service.depositsList).toEqual([deposit1]);

        const updatedDeposit = DepositTransaction.fromJSON({
          ...validDeposit1,
          description: 'Updated Deposit',
        });

        await expect(() =>
          service.updateDeposit(updatedDeposit),
        ).rejects.toThrow();

        expect(service.depositsList).toEqual([updatedDeposit]);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });

    describe('deleteDeposit', () => {
      test('deletes a deposit and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.depositsList).toEqual([deposit1, deposit2]);

        const result = await service.deleteDeposit(deposit1.id);

        expect(service.depositsList).toEqual([deposit2]);

        expect(result).toEqual(deposit1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if the deposit does not exist', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.depositsList).toEqual([deposit2]);

        await expect(() =>
          service.deleteDeposit(deposit1.id),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        expect(service.depositsList).toEqual([deposit1, deposit2]);

        await expect(() =>
          service.deleteDeposit(deposit1.id),
        ).rejects.toThrow();

        expect(service.depositsList).toEqual([deposit2]);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });
  });

  describe('withdrawal', () => {
    describe('addWithdrawal', () => {
      test('adds a withdrawal and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        uuidv4.mockImplementationOnce(() => withdrawalId);

        expect(service.withdrawalsList).toEqual([]);

        const result = await service.addWithdrawal(withdrawal1);

        expect(service.withdrawalsList).toEqual([withdrawal1]);

        expect(result).toEqual(withdrawal1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        uuidv4.mockImplementationOnce(() => withdrawalId);

        expect(service.withdrawalsList).toEqual([]);

        await expect(() =>
          service.addWithdrawal(withdrawal1),
        ).rejects.toThrow();

        expect(service.withdrawalsList).toEqual([withdrawal1]);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });

    describe('updateWithdrawal', () => {
      test('updates a withdrawal and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.withdrawalsList).toEqual([withdrawal1]);

        const updatedWithdrawal = WithdrawalTransaction.fromJSON({
          ...validWithdrawal1,
          description: 'Updated Withdrawal',
        });

        const result = await service.updateWithdrawal(updatedWithdrawal);

        expect(service.withdrawalsList).toEqual([updatedWithdrawal]);

        expect(result).toEqual(withdrawal1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if the withdrawal does not exist', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.withdrawalsList).toEqual([]);

        const updatedWithdrawal = WithdrawalTransaction.fromJSON({
          ...validWithdrawal1,
          description: 'Updated Withdrawal',
        });

        await expect(() =>
          service.updateWithdrawal(updatedWithdrawal),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        expect(service.withdrawalsList).toEqual([withdrawal1]);

        const updatedWithdrawal = WithdrawalTransaction.fromJSON({
          ...validWithdrawal1,
          description: 'Updated Withdrawal',
        });

        await expect(() =>
          service.updateWithdrawal(updatedWithdrawal),
        ).rejects.toThrow();

        expect(service.withdrawalsList).toEqual([updatedWithdrawal]);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });

    describe('deleteWithdrawal', () => {
      test('deletes a withdrawal and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.withdrawalsList).toEqual([withdrawal1, withdrawal2]);

        const result = await service.deleteWithdrawal(withdrawal1.id);

        expect(service.withdrawalsList).toEqual([withdrawal2]);

        expect(result).toEqual(withdrawal1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if the withdrawal does not exist', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.withdrawalsList).toEqual([withdrawal2]);

        await expect(() =>
          service.deleteWithdrawal(withdrawal1.id),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        expect(service.withdrawalsList).toEqual([withdrawal1, withdrawal2]);

        await expect(() =>
          service.deleteWithdrawal(withdrawal1.id),
        ).rejects.toThrow();

        expect(service.withdrawalsList).toEqual([withdrawal2]);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });
  });

  describe('reconciliation', () => {
    describe('addReconciliation', () => {
      test('adds a reconciliation and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        uuidv4.mockImplementationOnce(() => reconciliationId);

        expect(service.reconciliationsList).toEqual([]);

        const result = await service.addReconciliation(reconciliation1);

        expect(service.reconciliationsList).toEqual([reconciliation1]);

        expect(result).toEqual(reconciliation1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        uuidv4.mockImplementationOnce(() => reconciliationId);

        expect(service.reconciliationsList).toEqual([]);

        await expect(() =>
          service.addReconciliation(reconciliation1),
        ).rejects.toThrow();

        expect(service.reconciliationsList).toEqual([reconciliation1]);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });

    describe('deleteReconciliation', () => {
      test('deletes a reconciliation and calls writeToFile', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.reconciliationsList).toEqual([
          reconciliation1,
          reconciliation2,
        ]);

        const result = await service.deleteReconciliation(reconciliation1.id);

        expect(service.reconciliationsList).toEqual([reconciliation2]);

        expect(result).toEqual(reconciliation1);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });

      test('throws an error if the reconciliation does not exist', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockImplementationOnce(async () => {});

        expect(service.reconciliationsList).toEqual([reconciliation2]);

        await expect(() =>
          service.deleteReconciliation(reconciliation1.id),
        ).rejects.toThrow();

        expect(writeSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if writeToFile throws an error', async () => {
        const fsw = new FileServiceWriter('baseName', 'json');
        const service = new FileBudgetService(fsw, filePath, {
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          withdrawals: [withdrawal1, withdrawal2],
          deposits: [deposit1, deposit2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const writeSpy = jest.spyOn(fsw, 'writeToFile');
        writeSpy.mockRejectedValue(new Error());

        expect(service.reconciliationsList).toEqual([
          reconciliation1,
          reconciliation2,
        ]);

        await expect(() =>
          service.deleteReconciliation(reconciliation1.id),
        ).rejects.toThrow();

        expect(service.reconciliationsList).toEqual([reconciliation2]);

        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(filePath, service.budgetString);
      });
    });
  });
});
