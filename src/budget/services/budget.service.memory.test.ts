import * as uuid from 'uuid';
import { DateTime } from 'luxon';

import { Budget, BudgetJSON } from '@/src/budget/models/budget';
import { Category, CategoryJSON } from '@/src/budget/models/category';
import { Expense, ExpenseJSON } from '@/src/budget/models/expense';
import {
  ExpenseTargetJSON,
  ExpenseTargetType,
} from '@/src/budget/models/expense_target';
import { InMemoryBudgetService } from './budget.service.memory';
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
  payee: 'Italian Restaurant',
  description: 'Withdrawal',
  dateTime: '2024-01-25T12:00:00-06:00',
  amount: 25,
};

const validWithdrawal2: WithdrawalTransactionJSON = {
  id: 'withdrawalId2',
  budgetId,
  expenseId,
  payee: 'General Gas',
  description: 'Withdrawal 2',
  dateTime: '2024-01-25T12:01:00-06:00',
  amount: 25,
};

const withdrawal1 = WithdrawalTransaction.fromJSON(validWithdrawal1);
const withdrawal2 = WithdrawalTransaction.fromJSON(validWithdrawal2);

const depositId = 'depositId1';
const validDeposit1: DepositTransactionJSON = {
  id: depositId,
  budgetId,
  payor: 'my job',
  description: 'Deposit',
  dateTime: '2024-01-20T12:00:00-06:00',
  amount: 100,
};
const validDeposit2: DepositTransactionJSON = {
  id: 'depositId2',
  budgetId,
  payor: 'freelance client',
  description: 'Deposit 2',
  dateTime: '2024-01-20T12:01:00-06:00',
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

describe('InMemoryBudgetService', () => {
  describe('budgets', () => {
    describe('getBudgets', () => {
      test('returns an array of Budgets', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
        });

        const result = await service.getBudgets({ userId });
        expect(result.length).toBe(1);
        expect(result[0]?.toJSON()).toEqual(budget1.toJSON());
      });

      test('returns paginated budgets if there are more budgets than the pagination', async () => {
        const budgets: Budget[] = [];
        for (let i = 0; i < 20; i++) {
          budgets.push(
            Budget.fromJSON({
              ...validBudget1,
              id: i.toString(),
              name: 'Budget ' + `${i}`.padStart(2, '0'),
            }),
          );
        }

        const service = new InMemoryBudgetService({
          budgets,
        });

        const result = await service.getBudgets({
          userId,
          page: 1,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(budgets[0]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(budgets[1]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(budgets[2]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(budgets[3]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(budgets[4]?.toJSON());
      });

      test('goes to the proper page if a page and pagination are provided', async () => {
        const budgets: Budget[] = [];
        for (let i = 0; i < 20; i++) {
          budgets.push(
            Budget.fromJSON({
              ...validBudget1,
              id: i.toString(),
              name: 'Budget ' + `${i}`.padStart(2, '0'),
            }),
          );
        }

        const service = new InMemoryBudgetService({
          budgets,
        });

        const result = await service.getBudgets({
          userId,
          page: 2,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(budgets[5]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(budgets[6]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(budgets[7]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(budgets[8]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(budgets[9]?.toJSON());
      });

      test('returns an empty array if the page is beyond the range of budgets', async () => {
        const budgets: Budget[] = [];
        for (let i = 0; i < 20; i++) {
          budgets.push(
            Budget.fromJSON({
              ...validBudget1,
              id: i.toString(),
              name: 'Budget ' + `${i}`.padStart(2, '0'),
            }),
          );
        }

        const service = new InMemoryBudgetService({
          budgets,
        });

        const result = await service.getBudgets({
          userId,
          page: 4,
          pagination: 10,
        });

        expect(result).toEqual([]);
      });

      test('returns an empty array if there are no budgets', async () => {
        const service = new InMemoryBudgetService({
          budgets: [],
        });

        const result = await service.getBudgets({
          userId,
        });

        expect(result).toEqual([]);
      });

      test('returns an empty array if the user has no budgets', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1],
          expenses: [expense1],
          deposits: [deposit1],
          withdrawals: [withdrawal1],
          reconciliations: [reconciliation1],
        });

        const result = await service.getBudgets({
          userId: 'otherUserId',
        });

        expect(result).toEqual([]);
      });
    });

    describe('getBudget', () => {
      test('returns the budget', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const result = await service.getBudget(budgetId);
        expect(result?.toJSON()).toEqual(budget1.toJSON());
      });

      test('throws an error if the budget does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(service.getBudget(budgetId)).rejects.toThrow(
          `Budget with ID ${budgetId} not found`,
        );
      });
    });

    describe('addBudget', () => {
      test('adds a budget to the budgets', async () => {
        const someId = 'someId';
        uuidv4.mockImplementationOnce(() => someId);

        const service = new InMemoryBudgetService();
        expect(service.budgetsList.length).toBe(0);

        const result = await service.addBudget(budget1);

        expect(result.toJSON()).toEqual({
          ...budget1.toJSON(),
          id: someId,
        });

        expect(service.budgetsList.length).toBe(1);
        expect(service.budgetsList[0]).toBe(result);
      });
    });

    describe('updateBudget', () => {
      test('replaces the budget with a new budget and returns the old budget', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const updatedBudget = Budget.fromJSON({
          ...validBudget1,
          name: 'Updated Budget',
        });

        const result = await service.updateBudget(updatedBudget);
        expect(result).toBe(budget1);

        expect(service.budgets[budget1.id]?.toJSON()).toEqual(
          updatedBudget.toJSON(),
        );
      });

      test('throws an error if the budget does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(() => service.updateBudget(budget1)).rejects.toThrow(
          `Budget with ID ${budget1.id} not found`,
        );
      });
    });

    describe('deleteBudget', () => {
      test('deletes the budget and returns the deleted budget', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        expect(service.budgetsList.length).toBe(2);
        expect(service.budgetsList.includes(budget1)).toBe(true);

        const result = await service.deleteBudget(budgetId);

        expect(result).toBe(budget1);
        expect(service.budgetsList.length).toBe(1);
        expect(service.budgetsList.includes(budget1)).toBe(false);
      });

      test('throws an error if the budget does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(() => service.deleteBudget(budgetId)).rejects.toThrow(
          `Budget with ID ${budgetId} not found`,
        );
      });
    });
  });

  describe('categories', () => {
    describe('getCategories', () => {
      test('returns an array of categories', async () => {
        const service = new InMemoryBudgetService({
          categories: [category1],
        });

        const result = await service.getCategories({ budgetId });
        expect(result.length).toBe(1);
        expect(result[0]?.toJSON()).toEqual(category1.toJSON());
      });

      test('returns paginated categories if there are more categories than the pagination', async () => {
        const categories: Category[] = [];
        for (let i = 0; i < 20; i++) {
          categories.push(
            Category.fromJSON({
              ...validCategory1,
              id: i.toString(),
              name: 'Expense ' + `${i}`.padStart(2, '0'),
            }),
          );
        }

        const service = new InMemoryBudgetService({
          categories,
        });

        const result = await service.getCategories({
          budgetId,
          page: 1,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(categories[0]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(categories[1]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(categories[2]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(categories[3]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(categories[4]?.toJSON());
      });

      test('goes to the proper page if a page and pagination are provided', async () => {
        const categories: Category[] = [];
        for (let i = 0; i < 20; i++) {
          categories.push(
            Category.fromJSON({
              ...validCategory1,
              id: i.toString(),
              name: 'Expense ' + `${i}`.padStart(2, '0'),
            }),
          );
        }

        const service = new InMemoryBudgetService({
          categories,
        });

        const result = await service.getCategories({
          budgetId,
          page: 2,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(categories[5]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(categories[6]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(categories[7]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(categories[8]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(categories[9]?.toJSON());
      });

      test('returns an empty array if the page is beyond the range of categories', async () => {
        const categories: Category[] = [];
        for (let i = 0; i < 20; i++) {
          categories.push(
            Category.fromJSON({
              ...validCategory1,
              id: i.toString(),
              name: 'Expense ' + `${i}`.padStart(2, '0'),
            }),
          );
        }

        const service = new InMemoryBudgetService({
          categories,
        });

        const result = await service.getCategories({
          budgetId,
          page: 4,
          pagination: 10,
        });

        expect(result).toEqual([]);
      });

      test('returns an empty array if there are no categories', async () => {
        const service = new InMemoryBudgetService();

        const result = await service.getCategories({
          budgetId,
        });

        expect(result).toEqual([]);
      });

      test('returns an empty array if the budget has no categories', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1],
          expenses: [expense1],
          deposits: [deposit1],
          withdrawals: [withdrawal1],
          reconciliations: [reconciliation1],
        });

        const result = await service.getCategories({
          budgetId: 'otherBudgetId',
        });

        expect(result).toEqual([]);
      });
    });

    describe('getCategory', () => {
      test('returns the category', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const result = await service.getCategory(categoryId);
        expect(result?.toJSON()).toEqual(category1.toJSON());
      });

      test('throws an error if the category does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(service.getCategory(categoryId)).rejects.toThrow(
          `Category with ID ${categoryId} not found`,
        );
      });
    });

    describe('addCategory', () => {
      test('adds a category to the categories', async () => {
        const someId = 'someId';
        uuidv4.mockImplementationOnce(() => someId);

        const service = new InMemoryBudgetService();
        expect(service.categoriesList.length).toBe(0);

        const result = await service.addCategory(category1);

        expect(result.toJSON()).toEqual({
          ...category1.toJSON(),
          id: someId,
        });

        expect(service.categoriesList.length).toBe(1);
        expect(service.categoriesList[0]).toBe(result);
      });
    });

    describe('updateCategory', () => {
      test('replaces the category with a new category and returns the old category', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const updatedCategory = Category.fromJSON({
          ...validCategory1,
          name: 'Updated Category',
        });

        const result = await service.updateCategory(updatedCategory);
        expect(result).toBe(category1);

        expect(service.categories[category1.id]?.toJSON()).toEqual(
          updatedCategory.toJSON(),
        );
      });

      test('throws an error if the category does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(() => service.updateCategory(category1)).rejects.toThrow(
          `Category with ID ${category1.id} not found`,
        );
      });
    });

    describe('deleteCategory', () => {
      test('deletes the category and returns the deleted category', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        expect(service.categoriesList.length).toBe(2);
        expect(service.categoriesList.includes(category1)).toBe(true);

        const result = await service.deleteCategory(categoryId);

        expect(result).toBe(category1);
        expect(service.categoriesList.length).toBe(1);
        expect(service.categoriesList.includes(category1)).toBe(false);
      });

      test('throws an error if the category does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(() => service.deleteCategory(categoryId)).rejects.toThrow(
          `Category with ID ${categoryId} not found`,
        );
      });
    });
  });

  describe('expenses', () => {
    describe('getExpenses', () => {
      test('returns an array of expenses', async () => {
        const service = new InMemoryBudgetService({
          expenses: [expense1],
        });

        const result = await service.getExpenses({ budgetId });
        expect(result.length).toBe(1);
        expect(result[0]?.toJSON()).toEqual(expense1.toJSON());
      });

      test('returns paginated expenses if there are more expenses than the pagination', async () => {
        const expenses: Expense[] = [];
        for (let i = 0; i < 20; i++) {
          expenses.push(
            Expense.fromJSON({
              ...validExpense1,
              id: i.toString(),
              description: 'Expense ' + `${i}`.padStart(2, '0'),
            }),
          );
        }

        const service = new InMemoryBudgetService({
          expenses,
        });

        const result = await service.getExpenses({
          budgetId,
          page: 1,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(expenses[0]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(expenses[1]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(expenses[2]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(expenses[3]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(expenses[4]?.toJSON());
      });

      test('goes to the proper page if a page and pagination are provided', async () => {
        const expenses: Expense[] = [];
        for (let i = 0; i < 20; i++) {
          expenses.push(
            Expense.fromJSON({
              ...validExpense1,
              id: i.toString(),
              description: 'Expense ' + `${i}`.padStart(2, '0'),
            }),
          );
        }

        const service = new InMemoryBudgetService({
          expenses,
        });

        const result = await service.getExpenses({
          budgetId,
          page: 2,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(expenses[5]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(expenses[6]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(expenses[7]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(expenses[8]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(expenses[9]?.toJSON());
      });

      test('returns an empty array if the page is beyond the range of expenses', async () => {
        const expenses: Expense[] = [];
        for (let i = 0; i < 20; i++) {
          expenses.push(
            Expense.fromJSON({
              ...validExpense1,
              id: i.toString(),
              description: 'Expense ' + `${i}`.padStart(2, '0'),
            }),
          );
        }

        const service = new InMemoryBudgetService({
          expenses,
        });

        const result = await service.getExpenses({
          budgetId,
          page: 4,
          pagination: 10,
        });

        expect(result).toEqual([]);
      });

      test('returns an empty array if there are no expenses', async () => {
        const service = new InMemoryBudgetService();

        const result = await service.getExpenses({ budgetId });

        expect(result).toEqual([]);
      });

      test('returns an empty array if the user has no expenses', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1],
          expenses: [expense1],
          deposits: [deposit1],
          withdrawals: [withdrawal1],
          reconciliations: [reconciliation1],
        });

        const result = await service.getExpenses({ budgetId: 'otherBudgetId' });

        expect(result).toEqual([]);
      });
    });

    describe('getExpense', () => {
      test('returns the expense', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const result = await service.getExpense(expenseId);
        expect(result?.toJSON()).toEqual(expense1.toJSON());
      });

      test('throws an error if the expense does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(service.getExpense(expenseId)).rejects.toThrow(
          `Expense with ID ${expenseId} not found`,
        );
      });
    });

    describe('addExpense', () => {
      test('adds a budget to the budgets', async () => {
        const someId = 'someId';
        uuidv4.mockImplementationOnce(() => someId);

        const service = new InMemoryBudgetService();
        expect(service.expensesList.length).toBe(0);

        const result = await service.addExpense(expense1);

        expect(result.toJSON()).toEqual({
          ...expense1.toJSON(),
          id: someId,
        });

        expect(service.expensesList.length).toBe(1);
        expect(service.expensesList[0]).toBe(result);
      });
    });

    describe('updateExpense', () => {
      test('replaces the expense with a new expense and returns the old expense', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const updatedExpense = Expense.fromJSON({
          ...validExpense1,
          description: 'Updated Expense',
        });

        const result = await service.updateExpense(updatedExpense);
        expect(result).toBe(expense1);

        expect(service.expenses[expense1.id]?.toJSON()).toEqual(
          updatedExpense.toJSON(),
        );
      });

      test('throws an error if the expense does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(() => service.updateExpense(expense1)).rejects.toThrow(
          `Expense with ID ${expense1.id} not found`,
        );
      });
    });

    describe('deleteExpense', () => {
      test('deletes the expense and returns the deleted expense', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        expect(service.expensesList.length).toBe(2);
        expect(service.expensesList.includes(expense1)).toBe(true);

        const result = await service.deleteExpense(expenseId);

        expect(result).toBe(expense1);
        expect(service.expensesList.length).toBe(1);
        expect(service.expensesList.includes(expense1)).toBe(false);
      });

      test('throws an error if the expense does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(() => service.deleteExpense(expenseId)).rejects.toThrow(
          `Expense with ID ${expenseId} not found`,
        );
      });
    });
  });

  describe('deposits', () => {
    describe('getDeposits', () => {
      test('returns an array of deposits', async () => {
        const service = new InMemoryBudgetService({
          deposits: [deposit1],
        });

        const result = await service.getDeposits({
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });
        expect(result.length).toBe(1);
        expect(result[0]?.toJSON()).toEqual(deposit1.toJSON());
      });

      test('returns paginated deposits if there are more deposits than the pagination', async () => {
        const deposits: DepositTransaction[] = [];
        const baseDate = DateTime.fromISO('2024-01-20', {
          zone: 'America/Chicago',
        });

        for (let i = 0; i < 20; i++) {
          const d = baseDate.plus({ minutes: i });
          deposits.push(
            DepositTransaction.fromJSON({
              ...validDeposit1,
              id: i.toString(),
              dateTime: d.toISO(),
            }),
          );
        }

        deposits.sort((a, b) => b.dateTime.toMillis() - a.dateTime.toMillis());

        const service = new InMemoryBudgetService({
          deposits,
        });

        const result = await service.getDeposits({
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: 1,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(deposits[0]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(deposits[1]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(deposits[2]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(deposits[3]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(deposits[4]?.toJSON());
      });

      test('goes to the proper page if a page and pagination are provided', async () => {
        const deposits: DepositTransaction[] = [];
        const baseDate = DateTime.fromISO('2024-01-20', {
          zone: 'America/Chicago',
        });

        for (let i = 0; i < 20; i++) {
          const d = baseDate.plus({ minutes: i });
          deposits.push(
            DepositTransaction.fromJSON({
              ...validDeposit1,
              id: i.toString(),
              dateTime: d.toISO(),
            }),
          );
        }

        deposits.sort((a, b) => b.dateTime.toMillis() - a.dateTime.toMillis());

        const service = new InMemoryBudgetService({
          deposits,
        });

        const result = await service.getDeposits({
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: 2,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(deposits[5]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(deposits[6]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(deposits[7]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(deposits[8]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(deposits[9]?.toJSON());
      });

      test('returns an empty array if the page is beyond the range of deposits', async () => {
        const deposits: DepositTransaction[] = [];
        const baseDate = DateTime.fromISO('2024-01-20', {
          zone: 'America/Chicago',
        });

        for (let i = 0; i < 20; i++) {
          const d = baseDate.plus({ minutes: i });
          deposits.push(
            DepositTransaction.fromJSON({
              ...validDeposit1,
              id: i.toString(),
              dateTime: d.toISO(),
            }),
          );
        }

        deposits.sort((a, b) => b.dateTime.toMillis() - a.dateTime.toMillis());

        const service = new InMemoryBudgetService({
          deposits,
        });

        const result = await service.getDeposits({
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: 4,
          pagination: 10,
        });

        expect(result).toEqual([]);
      });

      test('returns an empty array if there are no deposits', async () => {
        const service = new InMemoryBudgetService();

        const result = await service.getDeposits({
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

        expect(result).toEqual([]);
      });

      test('returns an empty array if the user has no deposits', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1],
          expenses: [expense1],
          deposits: [deposit1],
          withdrawals: [withdrawal1],
          reconciliations: [reconciliation1],
        });

        const result = await service.getDeposits({
          budgetId: 'otherBudgetId',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

        expect(result).toEqual([]);
      });
    });

    describe('getDeposit', () => {
      test('returns the deposit', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const result = await service.getDeposit(depositId);
        expect(result?.toJSON()).toEqual(deposit1.toJSON());
      });

      test('throws an error if the category does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(service.getDeposit(depositId)).rejects.toThrow(
          `Deposit with ID ${depositId} not found`,
        );
      });
    });

    describe('addDeposit', () => {
      test('adds a deposit to the deposits', async () => {
        const someId = 'someId';
        uuidv4.mockImplementationOnce(() => someId);

        const service = new InMemoryBudgetService();
        expect(service.depositsList.length).toBe(0);

        const result = await service.addDeposit(deposit1);

        expect(result.toJSON()).toEqual({
          ...deposit1.toJSON(),
          id: someId,
        });

        expect(service.depositsList.length).toBe(1);
        expect(service.depositsList[0]).toBe(result);
      });
    });

    describe('updateDeposit', () => {
      test('replaces the deposit with a new deposit and returns the old deposit', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const updatedDeposit = DepositTransaction.fromJSON({
          ...validDeposit1,
          description: 'Updated Deposit',
        });

        const result = await service.updateDeposit(updatedDeposit);
        expect(result).toBe(deposit1);

        expect(service.deposits[deposit1.id]?.toJSON()).toEqual(
          updatedDeposit.toJSON(),
        );
      });

      test('throws an error if the deposit does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(() => service.updateDeposit(deposit1)).rejects.toThrow(
          `Deposit with ID ${deposit1.id} not found`,
        );
      });
    });

    describe('deleteDeposit', () => {
      test('deletes the budget and returns the deleted budget', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        expect(service.depositsList.length).toBe(2);
        expect(service.depositsList.includes(deposit1)).toBe(true);

        const result = await service.deleteDeposit(depositId);

        expect(result).toBe(deposit1);
        expect(service.depositsList.length).toBe(1);
        expect(service.depositsList.includes(deposit1)).toBe(false);
      });

      test('throws an error if the budget does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(() => service.deleteDeposit(depositId)).rejects.toThrow(
          `Deposit with ID ${depositId} not found`,
        );
      });
    });
  });

  describe('withdrawals', () => {
    describe('getWithdrawals', () => {
      test('returns an array of withdrawals', async () => {
        const service = new InMemoryBudgetService({
          withdrawals: [withdrawal1],
        });

        const result = await service.getWithdrawals({
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });
        expect(result.length).toBe(1);
        expect(result[0]?.toJSON()).toEqual(withdrawal1.toJSON());
      });

      test('returns paginated withdrawals if there are more withdrawals than the pagination', async () => {
        const withdrawals: WithdrawalTransaction[] = [];
        const baseDate = DateTime.fromISO('2024-01-20', {
          zone: 'America/Chicago',
        });

        for (let i = 0; i < 20; i++) {
          const d = baseDate.plus({ minutes: i });
          withdrawals.push(
            WithdrawalTransaction.fromJSON({
              ...validWithdrawal1,
              id: i.toString(),
              dateTime: d.toISO(),
            }),
          );
        }

        withdrawals.sort(
          (a, b) => b.dateTime.toMillis() - a.dateTime.toMillis(),
        );

        const service = new InMemoryBudgetService({
          withdrawals,
        });

        const result = await service.getWithdrawals({
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: 1,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(withdrawals[0]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(withdrawals[1]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(withdrawals[2]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(withdrawals[3]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(withdrawals[4]?.toJSON());
      });

      test('goes to the proper page if a page and pagination are provided', async () => {
        const withdrawals: WithdrawalTransaction[] = [];
        const baseDate = DateTime.fromISO('2024-01-20', {
          zone: 'America/Chicago',
        });

        for (let i = 0; i < 20; i++) {
          const d = baseDate.plus({ minutes: i });
          withdrawals.push(
            WithdrawalTransaction.fromJSON({
              ...validWithdrawal1,
              id: i.toString(),
              dateTime: d.toISO(),
            }),
          );
        }

        withdrawals.sort(
          (a, b) => b.dateTime.toMillis() - a.dateTime.toMillis(),
        );

        const service = new InMemoryBudgetService({
          withdrawals,
        });

        const result = await service.getWithdrawals({
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: 2,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(withdrawals[5]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(withdrawals[6]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(withdrawals[7]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(withdrawals[8]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(withdrawals[9]?.toJSON());
      });

      test('returns an empty array if the page is beyond the range of withdrawals', async () => {
        const withdrawals: WithdrawalTransaction[] = [];
        const baseDate = DateTime.fromISO('2024-01-20', {
          zone: 'America/Chicago',
        });

        for (let i = 0; i < 20; i++) {
          const d = baseDate.plus({ minutes: i });
          withdrawals.push(
            WithdrawalTransaction.fromJSON({
              ...validWithdrawal1,
              id: i.toString(),
              dateTime: d.toISO(),
            }),
          );
        }

        withdrawals.sort(
          (a, b) => b.dateTime.toMillis() - a.dateTime.toMillis(),
        );

        const service = new InMemoryBudgetService({
          withdrawals,
        });

        const result = await service.getWithdrawals({
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: 4,
          pagination: 10,
        });

        expect(result).toEqual([]);
      });

      test('returns an empty array if there are no withdrawals', async () => {
        const service = new InMemoryBudgetService();

        const result = await service.getWithdrawals({
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

        expect(result).toEqual([]);
      });

      test('returns an empty array if the user has no withdrawals', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1],
          expenses: [expense1],
          deposits: [deposit1],
          withdrawals: [withdrawal1],
          reconciliations: [reconciliation1],
        });

        const result = await service.getWithdrawals({
          budgetId: 'otherBudgetId',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

        expect(result).toEqual([]);
      });
    });

    describe('getWithdrawal', () => {
      test('returns the withdrawal', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const result = await service.getWithdrawal(withdrawalId);
        expect(result?.toJSON()).toEqual(withdrawal1.toJSON());
      });

      test('throws an error if the category does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(service.getWithdrawal(withdrawalId)).rejects.toThrow(
          `Withdrawal with ID ${withdrawalId} not found`,
        );
      });
    });

    describe('addWithdrawal', () => {
      test('adds a withdrawal to the withdrawals', async () => {
        const someId = 'someId';
        uuidv4.mockImplementationOnce(() => someId);

        const service = new InMemoryBudgetService();
        expect(service.withdrawalsList.length).toBe(0);

        const result = await service.addWithdrawal(withdrawal1);

        expect(result.toJSON()).toEqual({
          ...withdrawal1.toJSON(),
          id: someId,
        });

        expect(service.withdrawalsList.length).toBe(1);
        expect(service.withdrawalsList[0]).toBe(result);
      });
    });

    describe('updateWithdrawal', () => {
      test('replaces the withdrawal with a new withdrawal and returns the old withdrawal', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const updatedWithdrawal = WithdrawalTransaction.fromJSON({
          ...validWithdrawal1,
          description: 'Updated Withdrawal',
        });

        const result = await service.updateWithdrawal(updatedWithdrawal);
        expect(result).toBe(withdrawal1);

        expect(service.withdrawals[withdrawal1.id]?.toJSON()).toEqual(
          updatedWithdrawal.toJSON(),
        );
      });

      test('throws an error if the withdrawal does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(() =>
          service.updateWithdrawal(withdrawal1),
        ).rejects.toThrow(`Withdrawal with ID ${withdrawal1.id} not found`);
      });
    });

    describe('deleteWithdrawal', () => {
      test('deletes the budget and returns the deleted budget', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        expect(service.withdrawalsList.length).toBe(2);
        expect(service.withdrawalsList.includes(withdrawal1)).toBe(true);

        const result = await service.deleteWithdrawal(withdrawalId);

        expect(result).toBe(withdrawal1);
        expect(service.withdrawalsList.length).toBe(1);
        expect(service.withdrawalsList.includes(withdrawal1)).toBe(false);
      });

      test('throws an error if the budget does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(() =>
          service.deleteWithdrawal(withdrawalId),
        ).rejects.toThrow(`Withdrawal with ID ${withdrawalId} not found`);
      });
    });
  });

  describe('reconciliations', () => {
    describe('getReconciliations', () => {
      test('returns an array of reconciliations', async () => {
        const service = new InMemoryBudgetService({
          reconciliations: [reconciliation1],
        });

        const result = await service.getReconciliations({ budgetId });
        expect(result.length).toBe(1);
        expect(result[0]?.toJSON()).toEqual(reconciliation1.toJSON());
      });

      test('returns paginated reconciliations if there are more reconciliations than the pagination', async () => {
        const reconciliations: Reconciliation[] = [];
        const baseDate = DateTime.fromISO('2024-01-01', {
          zone: 'America/Chicago',
        });

        for (let i = 0; i < 20; i++) {
          const d = baseDate.plus({ days: i });
          reconciliations.push(
            Reconciliation.fromJSON({
              ...validReconciliation1,
              id: i.toString(),
              date: d.toISODate(),
            }),
          );
        }

        reconciliations.sort((a, b) => b.date.toMillis() - a.date.toMillis());

        const service = new InMemoryBudgetService({
          reconciliations,
        });

        const result = await service.getReconciliations({
          budgetId,
          page: 1,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(reconciliations[0]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(reconciliations[1]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(reconciliations[2]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(reconciliations[3]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(reconciliations[4]?.toJSON());
      });

      test('goes to the proper page if a page and pagination are provided', async () => {
        const reconciliations: Reconciliation[] = [];
        const baseDate = DateTime.fromISO('2024-01-01', {
          zone: 'America/Chicago',
        });

        for (let i = 0; i < 20; i++) {
          const d = baseDate.plus({ days: i });
          reconciliations.push(
            Reconciliation.fromJSON({
              ...validReconciliation1,
              id: i.toString(),
              date: d.toISODate(),
            }),
          );
        }

        reconciliations.sort((a, b) => b.date.toMillis() - a.date.toMillis());

        const service = new InMemoryBudgetService({
          reconciliations,
        });

        const result = await service.getReconciliations({
          budgetId,
          page: 2,
          pagination: 5,
        });

        expect(result.length).toBe(5);
        expect(result[0]?.toJSON()).toEqual(reconciliations[5]?.toJSON());
        expect(result[1]?.toJSON()).toEqual(reconciliations[6]?.toJSON());
        expect(result[2]?.toJSON()).toEqual(reconciliations[7]?.toJSON());
        expect(result[3]?.toJSON()).toEqual(reconciliations[8]?.toJSON());
        expect(result[4]?.toJSON()).toEqual(reconciliations[9]?.toJSON());
      });

      test('returns an empty array if the page is beyond the range of reconciliations', async () => {
        const reconciliations: Reconciliation[] = [];
        const baseDate = DateTime.fromISO('2024-01-01', {
          zone: 'America/Chicago',
        });

        for (let i = 0; i < 20; i++) {
          const d = baseDate.plus({ days: i });
          reconciliations.push(
            Reconciliation.fromJSON({
              ...validReconciliation1,
              id: i.toString(),
              date: d.toISODate(),
            }),
          );
        }

        reconciliations.sort((a, b) => b.date.toMillis() - a.date.toMillis());

        const service = new InMemoryBudgetService({
          reconciliations,
        });

        const result = await service.getReconciliations({
          budgetId,
          page: 4,
          pagination: 10,
        });

        expect(result).toEqual([]);
      });

      test('returns an empty array if there are no reconciliations', async () => {
        const service = new InMemoryBudgetService();
        const result = await service.getReconciliations({ budgetId });

        expect(result).toEqual([]);
      });

      test('returns an empty array if the user has no reconciliations', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1],
          expenses: [expense1],
          deposits: [deposit1],
          withdrawals: [withdrawal1],
          reconciliations: [reconciliation1],
        });

        const result = await service.getReconciliations({
          budgetId: 'otherBudgetId',
        });

        expect(result).toEqual([]);
      });
    });

    describe('addRecociliation', () => {
      test('adds a reconciliation to the reconciliations', async () => {
        const someId = 'someId';
        uuidv4.mockImplementationOnce(() => someId);

        const service = new InMemoryBudgetService();
        expect(service.reconciliationsList.length).toBe(0);

        const result = await service.addReconciliation(reconciliation1);

        expect(result.toJSON()).toEqual({
          ...reconciliation1.toJSON(),
          id: someId,
        });

        expect(service.reconciliationsList.length).toBe(1);
        expect(service.reconciliationsList[0]).toBe(result);
      });
    });

    describe('deleteReconciliation', () => {
      test('deletes the budget and returns the deleted budget', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        expect(service.reconciliationsList.length).toBe(2);
        expect(service.reconciliationsList.includes(reconciliation1)).toBe(
          true,
        );

        const result = await service.deleteReconciliation(reconciliationId);

        expect(result).toBe(reconciliation1);
        expect(service.reconciliationsList.length).toBe(1);
        expect(service.reconciliationsList.includes(reconciliation1)).toBe(
          false,
        );
      });

      test('throws an error if the budget does not exist', async () => {
        const service = new InMemoryBudgetService();

        await expect(() =>
          service.deleteReconciliation(reconciliationId),
        ).rejects.toThrow(
          `Reconciliation with ID ${reconciliationId} not found`,
        );
      });
    });
  });

  describe('recalcFunds', () => {
    test('returns 0 if there are no transactions or reconciliations', async () => {
      const service = new InMemoryBudgetService({
        budgets: [budget1],
      });

      const result = await service.recalculateFunds({ budgetId });
      expect(result).toBe(0);
    });

    test('returns the sum of all transactions if there are no reconciliations', async () => {
      const service = new InMemoryBudgetService({
        budgets: [budget1],
        deposits: [deposit1],
        withdrawals: [withdrawal1],
      });

      const result = await service.recalculateFunds({ budgetId });

      expect(result).toBe(deposit1.amount - withdrawal1.amount);
    });

    test('returns all transactions up to the reconciliation date if there are reconciliations', async () => {
      const service = new InMemoryBudgetService({
        budgets: [budget1],
        deposits: [deposit1],
        withdrawals: [withdrawal1],
        reconciliations: [reconciliation1],
      });

      const result = await service.recalculateFunds({ budgetId });

      expect(result).toBe(reconciliation1.balance - withdrawal1.amount);
    });
  });
});
