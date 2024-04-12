import * as uuid from 'uuid';

import { Budget, BudgetJSON } from '@/src/budget/models/budget';
import { Category, CategoryJSON } from '@/src/budget/models/category';
import { Expense, ExpenseJSON } from '@/src/budget/models/expense';
import {
  ExpenseTargetJSON,
  ExpenseTargetType,
} from '@/src/budget/models/expense_target';
import { InMemoryBudgetService } from '@/src/budget/services/budget.service.memory';
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
import { LoggerService } from '@/src/logger/logger.service';
import { BudgetController } from './budget.controller';
import { Request } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';

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
  dateTime: '2024-01-20T12:00:00.000-06:00',
  amount: 25,
};

const validWithdrawal2: WithdrawalTransactionJSON = {
  id: 'withdrawalId2',
  budgetId,
  expenseId,
  description: 'Withdrawal 2',
  dateTime: '2024-01-25T12:00:00.000-06:00',
  amount: 32,
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
  dateTime: '2024-01-21T12:00:00.000-06:00',
  amount: 100,
};

const deposit1 = DepositTransaction.fromJSON(validDeposit1);
const deposit2 = DepositTransaction.fromJSON(validDeposit2);

const reconciliationId = 'reconciliationId1';

const validReconciliation1: ReconciliationJSON = {
  id: reconciliationId,
  budgetId,
  date: '2024-01-21',
  balance: 300,
};
const validReconciliation2: ReconciliationJSON = {
  id: 'reconciliationId2',
  budgetId,
  date: '2024-01-25',
  balance: 300,
};

const reconciliation1 = Reconciliation.fromJSON(validReconciliation1);
const reconciliation2 = Reconciliation.fromJSON(validReconciliation2);

describe('Budget Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('budgets', () => {
    describe('getBudgets', () => {
      test('gets budgets from the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            userId,
          },
        } as unknown as Request;

        const response = await controller.getBudgets(req);

        expect(response.budgets).toHaveLength(2);
        expect(response.budgets).toContainEqual(validBudget1);
        expect(response.budgets).toContainEqual(validBudget2);
      });

      test('throws an error if the userId is not a string', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            userId: 1,
          },
        } as unknown as Request;

        await expect(() => controller.getBudgets(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
      });

      test('throws an error if getBudgets throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            userId,
          },
        } as unknown as Request;

        jest
          .spyOn(service, 'getBudgets')
          .mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.getBudgets(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
      });
    });

    describe('addBudget', () => {
      test('adds a budget using the BudgetService', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            budget: validBudget1,
          },
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addBudget');
        addSpy.mockResolvedValue(budget1);

        const response = await controller.addBudget(req);

        expect(response.budget).toEqual(validBudget1);
        expect(addSpy).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(budget1);
      });

      test('throws an error if the body is not a record', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: undefined,
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addBudget');

        await expect(() => controller.addBudget(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(addSpy).not.toHaveBeenCalled();
      });

      test('throws an error if the body cannot be parsed into a budget', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {},
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addBudget');

        await expect(() => controller.addBudget(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(addSpy).not.toHaveBeenCalled();
      });

      test('throws an error if addAction throws an error', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            budget: validBudget1,
          },
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addBudget');
        addSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.addBudget(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(addSpy).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(budget1);
      });
    });

    describe('updateBudget', () => {
      test('updates a budget using the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updatedBudgetJSON = {
          ...validBudget1,
          name: 'Updated Budget',
        };
        const updatedBudget = Budget.fromJSON(updatedBudgetJSON);

        const req = {
          body: {
            budget: updatedBudgetJSON,
          },
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateBudget');
        updateSpy.mockResolvedValue(updatedBudget);

        const response = await controller.updateBudget(req);

        expect(response.budget).toEqual(updatedBudgetJSON);
        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy).toHaveBeenCalledWith(updatedBudget);
      });

      test('throws an error if the body is not a record', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: undefined,
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.updateBudget(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(updateSpy).not.toHaveBeenCalled();
      });

      test('throws an error if the body cannot be parsed into a budget', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {},
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.updateBudget(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(updateSpy).not.toHaveBeenCalled();
      });

      test('throws an error if updateBudget throws an error', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updatedBudgetJSON = {
          ...validBudget1,
          name: 'Updated Budget',
        };
        const updatedBudget = Budget.fromJSON(updatedBudgetJSON);

        const req = {
          body: {
            budget: updatedBudgetJSON,
          },
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateBudget');
        updateSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.updateBudget(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy).toHaveBeenCalledWith(updatedBudget);
      });
    });

    describe('deleteBudget', () => {
      test('deletes a budget using the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            budgetId,
          },
        } as unknown as Request;

        const delSpy = jest.spyOn(service, 'deleteBudget');
        delSpy.mockResolvedValue(budget1);

        const response = await controller.deleteBudget(req);

        expect(response.budget).toEqual(budget1.toJSON());
        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(delSpy).toHaveBeenCalledWith(budgetId);
      });

      test('throws an error if the budgetId is not a string', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            budgetId: 1,
          },
        } as unknown as Request;

        const delSpy = jest.spyOn(service, 'deleteBudget');

        await expect(() => controller.deleteBudget(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(delSpy).not.toHaveBeenCalled();
      });

      test('throws an error if deleteBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            budgetId,
          },
        } as unknown as Request;

        const delSpy = jest.spyOn(service, 'deleteBudget');
        delSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.deleteBudget(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(delSpy).toHaveBeenCalledWith(budgetId);
      });
    });
  });

  describe('categories', () => {
    describe('getCategories', () => {
      test('gets categories from the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            budgetId,
          },
        } as unknown as Request;

        const response = await controller.getCategories(req);

        expect(response.categories).toHaveLength(2);
        expect(response.categories).toContainEqual(validCategory1);
        expect(response.categories).toContainEqual(validCategory2);
      });

      test('throws an error if the userId is not a string', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            userId: 1,
          },
        } as unknown as Request;

        await expect(() => controller.getCategories(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
      });

      test('throws an error if getCategories throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            budgetId,
          },
        } as unknown as Request;

        jest
          .spyOn(service, 'getCategories')
          .mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.getCategories(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
      });
    });

    describe('addCategory', () => {
      test('adds a category using the BudgetService', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            category: validCategory1,
          },
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addCategory');
        addSpy.mockResolvedValue(category1);

        const response = await controller.addCategory(req);

        expect(response.category).toEqual(validCategory1);
        expect(addSpy).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(category1);
      });

      test('throws an error if the body is not a record', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: undefined,
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addCategory');

        await expect(() => controller.addCategory(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(addSpy).not.toHaveBeenCalled();
      });

      test('throws an error if the body cannot be parsed into a budget', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {},
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addCategory');

        await expect(() => controller.addCategory(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(addSpy).not.toHaveBeenCalled();
      });

      test('throws an error if addAction throws an error', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            category: validCategory1,
          },
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addCategory');
        addSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.addCategory(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(addSpy).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(category1);
      });
    });

    describe('updateCategory', () => {
      test('updates a budget using the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          categories: [category1, category2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updatedCategoryJSON = {
          ...validCategory1,
          name: 'Updated Category',
        };
        const updatedCategory = Category.fromJSON(updatedCategoryJSON);

        const req = {
          body: {
            category: updatedCategoryJSON,
          },
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateCategory');
        updateSpy.mockResolvedValue(updatedCategory);

        const response = await controller.updateCategory(req);

        expect(response.category).toEqual(updatedCategoryJSON);
        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy).toHaveBeenCalledWith(updatedCategory);
      });

      test('throws an error if the body is not a record', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: undefined,
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateCategory');

        await expect(() => controller.updateCategory(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(updateSpy).not.toHaveBeenCalled();
      });

      test('throws an error if the body cannot be parsed into a category', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {},
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateCategory');

        await expect(() => controller.updateCategory(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(updateSpy).not.toHaveBeenCalled();
      });

      test('throws an error if updateCategory throws an error', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updatedCategoryJSON = {
          ...validCategory1,
          name: 'Updated Category',
        };
        const updatedCategory = Category.fromJSON(updatedCategoryJSON);

        const req = {
          body: {
            category: updatedCategoryJSON,
          },
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateCategory');
        updateSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.updateCategory(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy).toHaveBeenCalledWith(updatedCategory);
      });
    });

    describe('deleteCategory', () => {
      test('deletes a budget using the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          categories: [category1, category2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            categoryId,
          },
        } as unknown as Request;

        const delSpy = jest.spyOn(service, 'deleteCategory');
        delSpy.mockResolvedValue(category1);

        const response = await controller.deleteCategory(req);

        expect(response.category).toEqual(category1.toJSON());
        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(delSpy).toHaveBeenCalledWith(categoryId);
      });

      test('throws an error if the budgetId is not a string', async () => {
        const service = new InMemoryBudgetService({
          categories: [category1, category2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            categoryId: 1,
          },
        } as unknown as Request;

        const delSpy = jest.spyOn(service, 'deleteCategory');

        await expect(() => controller.deleteCategory(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(delSpy).not.toHaveBeenCalled();
      });

      test('throws an error if deleteCategory throws an error', async () => {
        const service = new InMemoryBudgetService({
          categories: [category1, category2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            categoryId,
          },
        } as unknown as Request;

        const delSpy = jest.spyOn(service, 'deleteCategory');
        delSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.deleteCategory(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(delSpy).toHaveBeenCalledWith(categoryId);
      });
    });
  });

  describe('expenses', () => {
    describe('getExpenses', () => {
      test('gets budgets from the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            budgetId,
          },
        } as unknown as Request;

        const response = await controller.getExpenses(req);

        expect(response.expenses).toHaveLength(2);
        expect(response.expenses).toContainEqual(validExpense1);
        expect(response.expenses).toContainEqual(validExpense2);
      });

      test('throws an error if the userId is not a string', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            userId: 1,
          },
        } as unknown as Request;

        await expect(() => controller.getExpenses(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
      });

      test('throws an error if getExpenses throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            budgetId,
          },
        } as unknown as Request;

        jest
          .spyOn(service, 'getExpenses')
          .mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.getExpenses(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
      });
    });

    describe('addExpense', () => {
      test('adds an Expense using the BudgetService', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            expense: validExpense1,
          },
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addExpense');
        addSpy.mockResolvedValue(expense1);

        const response = await controller.addExpense(req);

        expect(response.expense).toEqual(validExpense1);
        expect(addSpy).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(expense1);
      });

      test('throws an error if the body is not a record', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: undefined,
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addExpense');

        await expect(() => controller.addExpense(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(addSpy).not.toHaveBeenCalled();
      });

      test('throws an error if the body cannot be parsed into a budget', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {},
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addExpense');

        await expect(() => controller.addExpense(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(addSpy).not.toHaveBeenCalled();
      });

      test('throws an error if addAction throws an error', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            expense: validExpense1,
          },
        } as unknown as Request;

        const addSpy = jest.spyOn(service, 'addExpense');
        addSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.addExpense(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(addSpy).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(expense1);
      });
    });

    describe('updateExpense', () => {
      test('updates an expense using the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updatedExpenseJSON = {
          ...validExpense1,
          description: 'Updated Expense',
        };
        const updatedExpense = Expense.fromJSON(updatedExpenseJSON);

        const req = {
          body: {
            expense: updatedExpenseJSON,
          },
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateExpense');
        updateSpy.mockResolvedValue(updatedExpense);

        const response = await controller.updateExpense(req);

        expect(response.expense).toEqual(updatedExpenseJSON);
        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy).toHaveBeenCalledWith(updatedExpense);
      });

      test('throws an error if the body is not a record', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: undefined,
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateExpense');

        await expect(() => controller.updateExpense(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(updateSpy).not.toHaveBeenCalled();
      });

      test('throws an error if the body cannot be parsed into an expense', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {},
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateExpense');

        await expect(() => controller.updateExpense(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(updateSpy).not.toHaveBeenCalled();
      });

      test('throws an error if updateExpense throws an error', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updatedExpenseJSON = {
          ...validExpense1,
          description: 'Updated Expense',
        };
        const updatedExpense = Expense.fromJSON(updatedExpenseJSON);

        const req = {
          body: {
            expense: updatedExpenseJSON,
          },
        } as unknown as Request;

        const updateSpy = jest.spyOn(service, 'updateExpense');
        updateSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.updateExpense(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy).toHaveBeenCalledWith(updatedExpense);
      });
    });

    describe('deleteExpense', () => {
      test('deletes a budget using the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            expenseId,
          },
        } as unknown as Request;

        const delSpy = jest.spyOn(service, 'deleteExpense');
        delSpy.mockResolvedValue(expense1);

        const response = await controller.deleteExpense(req);

        expect(response.expense).toEqual(expense1.toJSON());
        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(delSpy).toHaveBeenCalledWith(expenseId);
      });

      test('throws an error if the budgetId is not a string', async () => {
        const service = new InMemoryBudgetService({
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            expenseId: 1,
          },
        } as unknown as Request;

        const delSpy = jest.spyOn(service, 'deleteExpense');

        await expect(() => controller.deleteExpense(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
        expect(delSpy).not.toHaveBeenCalled();
      });

      test('throws an error if deleteExpense throws an error', async () => {
        const service = new InMemoryBudgetService({
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            expenseId,
          },
        } as unknown as Request;

        const delSpy = jest.spyOn(service, 'deleteExpense');
        delSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.deleteExpense(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(delSpy).toHaveBeenCalledWith(expenseId);
      });
    });
  });

  describe('deposits', () => {
    describe('getDeposits', () => {
      test('gets deposits from the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            budgetId,
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
        } as unknown as Request;

        const response = await controller.getDeposits(req);

        expect(response.deposits).toHaveLength(2);
        expect(response.deposits).toContainEqual(validDeposit1);
        expect(response.deposits).toContainEqual(validDeposit2);
      });

      test('throws an error if the budgetId or dates are missing or not a valid string', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const validQuery: Record<string, unknown> = {
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        };

        let invalidQuery = { ...validQuery };
        let req = {
          query: invalidQuery,
        } as unknown as Request;

        invalidQuery = { ...validQuery };
        invalidQuery.budgetId = 1;
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getDeposits(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        invalidQuery = { ...validQuery };
        delete invalidQuery.budgetId;
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getDeposits(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        invalidQuery = { ...validQuery };
        invalidQuery.startDate = '1';
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getDeposits(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        invalidQuery = { ...validQuery };
        delete invalidQuery.startDate;
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getDeposits(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        invalidQuery = { ...validQuery };
        invalidQuery.endDate = '1';
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getDeposits(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        invalidQuery = { ...validQuery };
        delete invalidQuery.endDate;
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getDeposits(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
      });

      test('throws an error if getDeposits throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            budgetId,
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
        } as unknown as Request;

        jest
          .spyOn(service, 'getDeposits')
          .mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.getDeposits(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
      });
    });

    describe('addDeposit', () => {
      test('adds a deposit, calculates the balance, and returns the deposit', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            deposit: validDeposit1,
          },
        } as unknown as Request;

        const addDepositSpy = jest.spyOn(service, 'addDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        uuidv4.mockImplementation(() => depositId);

        const response = await controller.addDeposit(req);

        expect(response.deposit).toEqual(validDeposit1);
        expect(response.currentFunds).toBe(validDeposit1.amount);

        expect(addDepositSpy).toHaveBeenCalledTimes(1);
        expect(addDepositSpy).toHaveBeenCalledWith(deposit1);

        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledWith(budgetId);

        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledWith(
          Budget.fromJSON({
            ...validBudget1,
            currentFunds: validDeposit1.amount,
          }),
        );
      });

      test('adds a deposit to a budget with existing deposits, calculates the balance, and returns the deposit', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            deposit: validDeposit1,
          },
        } as unknown as Request;
        const req2 = {
          body: {
            deposit: validDeposit2,
          },
        } as unknown as Request;

        const addDepositSpy = jest.spyOn(service, 'addDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        uuidv4.mockImplementation(() => validDeposit2.id);

        await controller.addDeposit(req1);
        const response = await controller.addDeposit(req2);

        expect(response.deposit).toEqual(validDeposit2);
        expect(response.currentFunds).toBe(
          validDeposit2.amount + validDeposit1.amount,
        );

        expect(addDepositSpy).toHaveBeenCalledTimes(2);
        expect(getBudgetSpy).toHaveBeenCalledTimes(2);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(2);
      });

      test('throws an error if body is not an object', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            deposit: undefined,
          },
        } as unknown as Request;

        const addDepositSpy = jest.spyOn(service, 'addDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.addDeposit(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(addDepositSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if body cannot be parsed into a DepositTransaction', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            deposit: {},
          },
        } as unknown as Request;

        const addDepositSpy = jest.spyOn(service, 'addDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.addDeposit(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(addDepositSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if the amount is lte zero', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const deposit = {
          ...validDeposit1,
          amount: 0,
        };

        const req = {
          body: {
            deposit,
          },
        } as unknown as Request;

        const addDepositSpy = jest.spyOn(service, 'addDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.addDeposit(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(addDepositSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if addDeposit throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            deposit: validDeposit1,
          },
        } as unknown as Request;

        const addDepositSpy = jest.spyOn(service, 'addDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        addDepositSpy.mockImplementationOnce(() => {
          throw new Error('Test Error');
        });

        await expect(() => controller.addDeposit(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(addDepositSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if getBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            deposit: validDeposit1,
          },
        } as unknown as Request;

        const addDepositSpy = jest.spyOn(service, 'addDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        addDepositSpy.mockImplementationOnce(async () => deposit1);

        getBudgetSpy.mockImplementationOnce(() => {
          throw new Error('Test Error');
        });

        await expect(() => controller.addDeposit(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(addDepositSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if updateBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            deposit: validDeposit1,
          },
        } as unknown as Request;

        const addDepositSpy = jest.spyOn(service, 'addDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        addDepositSpy.mockImplementationOnce(() => {
          throw new Error('Test Error');
        });

        await expect(() => controller.addDeposit(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(addDepositSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if getBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            deposit: validDeposit1,
          },
        } as unknown as Request;

        const addDepositSpy = jest.spyOn(service, 'addDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        addDepositSpy.mockImplementationOnce(async () => deposit1);

        getBudgetSpy.mockImplementationOnce(async () => budget1);

        updateBudgetSpy.mockImplementationOnce(() => {
          throw new Error('Test Error');
        });

        await expect(() => controller.addDeposit(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(addDepositSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('updateDeposit', () => {
      test('updates the budget in the service and updates current funds given a budget with an existing deposit', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            deposit: validDeposit1,
          },
        } as unknown as Request;

        const updatedAmount = 100;

        uuidv4.mockImplementation(() => depositId);

        await controller.addDeposit(req1);

        const updatedDeposit = DepositTransaction.fromJSON({
          ...validDeposit1,
          amount: validDeposit1.amount + updatedAmount,
        });

        const req2 = {
          body: {
            deposit: updatedDeposit.toJSON(),
          },
        } as unknown as Request;

        const updateDepositSpy = jest.spyOn(service, 'updateDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const result = await controller.updateDeposit(req2);

        expect(result.currentFunds).toBe(validDeposit1.amount + updatedAmount);
        expect(result.deposit).toEqual(updatedDeposit.toJSON());
        expect(result.oldDeposit).toEqual(validDeposit1);

        expect(updateDepositSpy).toHaveBeenCalledTimes(1);
        expect(updateDepositSpy).toHaveBeenCalledWith(updatedDeposit);

        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledWith(budgetId);

        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledWith(
          Budget.fromJSON({
            ...validBudget1,
            currentFunds: validDeposit1.amount + updatedAmount,
          }),
        );
      });

      test('reduces budget amount given an update with a reduced deposit amount', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1],
        });
        const loggerService = new LoggerService();
        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            deposit: validDeposit1,
          },
        } as unknown as Request;

        const updatedAmount = -25;

        uuidv4.mockImplementation(() => depositId);

        await controller.addDeposit(req1);

        const updatedDeposit = DepositTransaction.fromJSON({
          ...validDeposit1,
          amount: validDeposit1.amount + updatedAmount,
        });

        const req2 = {
          body: {
            deposit: updatedDeposit.toJSON(),
          },
        } as unknown as Request;

        const updateDepositSpy = jest.spyOn(service, 'updateDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const result = await controller.updateDeposit(req2);

        expect(result.currentFunds).toBe(validDeposit1.amount + updatedAmount);
        expect(result.deposit).toEqual(updatedDeposit.toJSON());
        expect(result.oldDeposit).toEqual(validDeposit1);

        expect(updateDepositSpy).toHaveBeenCalledTimes(1);
        expect(updateDepositSpy).toHaveBeenCalledWith(updatedDeposit);

        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledWith(budgetId);

        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledWith(
          Budget.fromJSON({
            ...validBudget1,
            currentFunds: validDeposit1.amount + updatedAmount,
          }),
        );
      });

      test('throws an error if body is not an object', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updateDepositSpy = jest.spyOn(service, 'updateDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const req = {
          body: 1,
        } as unknown as Request;

        await expect(() => controller.updateDeposit(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(updateDepositSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if body cannot be parsed into a DepositTransaction', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updateDepositSpy = jest.spyOn(service, 'updateDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const req = {
          body: {},
        } as unknown as Request;

        await expect(() => controller.updateDeposit(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(updateDepositSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if the amount is lte zero', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updateDepositSpy = jest.spyOn(service, 'updateDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const updatedDeposit = DepositTransaction.fromJSON({
          ...validDeposit1,
          amount: 0,
        });

        const req = {
          body: {
            deposit: updatedDeposit.toJSON(),
          },
        } as unknown as Request;

        await expect(() => controller.updateDeposit(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(updateDepositSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if updateDeposit throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updateDepositSpy = jest.spyOn(service, 'updateDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        updateDepositSpy.mockImplementationOnce(() => {
          throw new Error('Test Error');
        });

        const updatedDeposit = DepositTransaction.fromJSON({
          ...validDeposit1,
          amount: 20,
        });

        const req = {
          body: {
            deposit: updatedDeposit.toJSON(),
          },
        } as unknown as Request;

        await expect(() => controller.updateDeposit(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(updateDepositSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if getBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updatedDeposit = DepositTransaction.fromJSON({
          ...validDeposit1,
          amount: 20,
        });

        const updateDepositSpy = jest.spyOn(service, 'updateDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        updateDepositSpy.mockImplementationOnce(async () => updatedDeposit);

        getBudgetSpy.mockImplementationOnce(() => {
          throw new Error('Test Error');
        });

        const req = {
          body: {
            deposit: updatedDeposit.toJSON(),
          },
        } as unknown as Request;

        await expect(() => controller.updateDeposit(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(updateDepositSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if updateBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const updatedDeposit = DepositTransaction.fromJSON({
          ...validDeposit1,
          amount: 20,
        });

        const updateDepositSpy = jest.spyOn(service, 'updateDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        updateDepositSpy.mockImplementationOnce(async () => updatedDeposit);

        getBudgetSpy.mockImplementationOnce(async () => budget1);

        updateBudgetSpy.mockImplementationOnce(async () => {
          throw new Error('Test Error');
        });

        const req = {
          body: {
            deposit: updatedDeposit.toJSON(),
          },
        } as unknown as Request;

        await expect(() => controller.updateDeposit(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(updateDepositSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('deleteDeposit', () => {
      test('updates the budget by removing the deposit and updating the current funds', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            deposit: validDeposit1,
          },
        } as unknown as Request;

        const deleteDepositSpy = jest.spyOn(service, 'deleteDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        uuidv4.mockImplementation(() => depositId);

        await controller.addDeposit(req1);

        const req2 = {
          body: {
            depositId,
          },
        } as unknown as Request;

        const result = await controller.deleteDeposit(req2);

        expect(result.currentFunds).toBe(0);
        expect(result.deposit).toEqual(validDeposit1);

        expect(deleteDepositSpy).toHaveBeenCalledTimes(1);
        expect(deleteDepositSpy).toHaveBeenCalledWith(depositId);

        expect(getBudgetSpy).toHaveBeenCalledTimes(2);
        expect(getBudgetSpy).toHaveBeenCalledWith(budgetId);

        expect(updateBudgetSpy).toHaveBeenCalledTimes(2);
        expect(updateBudgetSpy).toHaveBeenCalledWith(
          Budget.fromJSON({
            ...validBudget1,
            currentFunds: 0,
          }),
        );
      });

      test('throws an error if body is not an object', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const deleteDepositSpy = jest.spyOn(service, 'deleteDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const req = {
          body: undefined,
        } as unknown as Request;

        await expect(() => controller.deleteDeposit(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(deleteDepositSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if depositId is not a string', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const deleteDepositSpy = jest.spyOn(service, 'deleteDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const req = {
          body: {
            depositId: 1,
          },
        } as unknown as Request;

        await expect(() => controller.deleteDeposit(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(deleteDepositSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if deleteDeposit throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const deleteDepositSpy = jest.spyOn(service, 'deleteDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        deleteDepositSpy.mockRejectedValue(new Error('Test Error'));

        const req = {
          body: {
            depositId: depositId,
          },
        } as unknown as Request;

        await expect(() => controller.deleteDeposit(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(deleteDepositSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if getBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const deleteDepositSpy = jest.spyOn(service, 'deleteDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        deleteDepositSpy.mockImplementationOnce(async () => deposit1);
        getBudgetSpy.mockRejectedValue(new Error('Test Error'));

        const req = {
          body: {
            depositId: depositId,
          },
        } as unknown as Request;

        await expect(() => controller.deleteDeposit(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(deleteDepositSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if updateBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const deleteDepositSpy = jest.spyOn(service, 'deleteDeposit');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        deleteDepositSpy.mockImplementationOnce(async () => deposit1);
        getBudgetSpy.mockImplementationOnce(async () => budget1);
        updateBudgetSpy.mockRejectedValue(new Error('Test Error'));

        const req = {
          body: {
            depositId: depositId,
          },
        } as unknown as Request;

        await expect(() => controller.deleteDeposit(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(deleteDepositSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('withdrawals', () => {
    describe('getWithdrawals', () => {
      test('gets budgets from the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            budgetId,
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
        } as unknown as Request;

        const response = await controller.getWithdrawals(req);

        expect(response.withdrawals).toHaveLength(2);
        expect(response.withdrawals).toContainEqual(validWithdrawal1);
        expect(response.withdrawals).toContainEqual(validWithdrawal2);
      });

      test('throws an error if the budgetId or dates are missing or not a valid string', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const validQuery: Record<string, unknown> = {
          budgetId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        };

        let invalidQuery = { ...validQuery };
        let req = {
          query: invalidQuery,
        } as unknown as Request;

        invalidQuery = { ...validQuery };
        invalidQuery.budgetId = 1;
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getWithdrawals(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        invalidQuery = { ...validQuery };
        delete invalidQuery.budgetId;
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getWithdrawals(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        invalidQuery = { ...validQuery };
        invalidQuery.startDate = '1';
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getWithdrawals(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        invalidQuery = { ...validQuery };
        delete invalidQuery.startDate;
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getWithdrawals(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        invalidQuery = { ...validQuery };
        invalidQuery.endDate = '1';
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getWithdrawals(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        invalidQuery = { ...validQuery };
        delete invalidQuery.endDate;
        req = {
          query: invalidQuery,
        } as unknown as Request;

        await expect(() => controller.getWithdrawals(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );
      });

      test('throws an error if getWithdrawals throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            budgetId,
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
        } as unknown as Request;

        jest
          .spyOn(service, 'getWithdrawals')
          .mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.getWithdrawals(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
      });
    });

    const budget = Budget.fromJSON({
      ...budget1.toJSON(),
      currentFunds: 100,
    });

    describe('addWithdrawal', () => {
      test('adds a withdrawal, calculates the balance, and returns the withdrawal', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            withdrawal: validWithdrawal1,
          },
        } as unknown as Request;

        const addWithdrawalSpy = jest.spyOn(service, 'addWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        uuidv4.mockImplementation(() => withdrawalId);

        const response = await controller.addWithdrawal(req);

        expect(response.withdrawal).toEqual(validWithdrawal1);
        expect(response.currentFunds).toBe(
          budget.currentFunds - validWithdrawal1.amount,
        );

        expect(response.currentFunds).toBeLessThan(budget.currentFunds);

        expect(addWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(addWithdrawalSpy).toHaveBeenCalledWith(withdrawal1);

        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledWith(budgetId);

        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledWith(
          Budget.fromJSON({
            ...budget.toJSON(),
            currentFunds: budget.currentFunds - validWithdrawal1.amount,
          }),
        );
      });

      test('adds a withdrawal to a budget with existing withdrawals, calculates the balance, and returns the withdrawal', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            withdrawal: validWithdrawal1,
          },
        } as unknown as Request;
        const req2 = {
          body: {
            withdrawal: validWithdrawal2,
          },
        } as unknown as Request;

        const addWithdrawalSpy = jest.spyOn(service, 'addWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        uuidv4.mockImplementation(() => withdrawalId);

        await controller.addWithdrawal(req1);

        const result = await controller.addWithdrawal(req2);

        expect(result.currentFunds).toBe(
          budget.currentFunds -
            validWithdrawal1.amount -
            validWithdrawal2.amount,
        );

        expect(addWithdrawalSpy).toHaveBeenCalledTimes(2);
        expect(getBudgetSpy).toHaveBeenCalledTimes(2);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(2);
      });

      test('throws an error if body is not an object', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: undefined,
        } as unknown as Request;

        const addWithdrawalSpy = jest.spyOn(service, 'addWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.addWithdrawal(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(addWithdrawalSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if body cannot be parsed into a WithdrawalTransaction', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            withdrawal: {},
          },
        } as unknown as Request;

        const addWithdrawalSpy = jest.spyOn(service, 'addWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.addWithdrawal(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(addWithdrawalSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if the amount is lte zero', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const withdrawal = {
          ...validWithdrawal1,
          amount: 0,
        };

        const req = {
          body: {
            withdrawal,
          },
        } as unknown as Request;

        const addWithdrawalSpy = jest.spyOn(service, 'addWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.addWithdrawal(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(addWithdrawalSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if addWithdrawal throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            withdrawal: validWithdrawal1,
          },
        } as unknown as Request;

        const addWithdrawalSpy = jest.spyOn(service, 'addWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        addWithdrawalSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.addWithdrawal(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(addWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if getBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            withdrawal: validWithdrawal1,
          },
        } as unknown as Request;

        const addWithdrawalSpy = jest.spyOn(service, 'addWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        addWithdrawalSpy.mockResolvedValue(withdrawal1);
        getBudgetSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.addWithdrawal(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(addWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if updateBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            withdrawal: validWithdrawal1,
          },
        } as unknown as Request;

        const addWithdrawalSpy = jest.spyOn(service, 'addWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        addWithdrawalSpy.mockResolvedValue(withdrawal1);
        getBudgetSpy.mockResolvedValue(budget);
        updateBudgetSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.addWithdrawal(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(addWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('updateWithdrawal', () => {
      test('updates the budget in the service and updates current funds given a budget with an existing withdrawal', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            withdrawal: validWithdrawal1,
          },
        } as unknown as Request;

        const updatedAmount = 20;

        const updateWithdrawalSpy = jest.spyOn(service, 'updateWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        uuidv4.mockImplementation(() => withdrawalId);

        const result1 = await controller.addWithdrawal(req1);
        expect(result1.currentFunds).toBe(
          budget.currentFunds - validWithdrawal1.amount,
        );

        const updatedWithdrawal = WithdrawalTransaction.fromJSON({
          ...validWithdrawal1,
          amount: validWithdrawal1.amount + updatedAmount,
        });

        const req2 = {
          body: {
            withdrawal: updatedWithdrawal.toJSON(),
          },
        } as unknown as Request;

        const result2 = await controller.updateWithdrawal(req2);

        const updatedFunds = -(
          updatedWithdrawal.amount - validWithdrawal1.amount
        );

        expect(result2.currentFunds).toBe(
          budget.currentFunds - updatedWithdrawal.amount,
        );
        expect(result2.currentFunds).toBe(result1.currentFunds + updatedFunds);
        expect(result2.withdrawal).toEqual(updatedWithdrawal.toJSON());
        expect(result2.oldWithdrawal).toEqual(validWithdrawal1);

        expect(result2.currentFunds).toBeLessThan(result1.currentFunds);

        expect(updateWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(2);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(2);
      });

      test('reduces budget amount given an update with a reduced withdrawal amount', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            withdrawal: validWithdrawal1,
          },
        } as unknown as Request;

        const updatedAmount = -10;

        const updateWithdrawalSpy = jest.spyOn(service, 'updateWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        uuidv4.mockImplementation(() => withdrawalId);

        const result1 = await controller.addWithdrawal(req1);
        expect(result1.currentFunds).toBe(
          budget.currentFunds - validWithdrawal1.amount,
        );

        const updatedWithdrawal = WithdrawalTransaction.fromJSON({
          ...validWithdrawal1,
          amount: validWithdrawal1.amount + updatedAmount,
        });

        const req2 = {
          body: {
            withdrawal: updatedWithdrawal.toJSON(),
          },
        } as unknown as Request;

        const result2 = await controller.updateWithdrawal(req2);

        const updatedFunds = -(
          updatedWithdrawal.amount - validWithdrawal1.amount
        );

        expect(result2.currentFunds).toBe(
          budget.currentFunds - updatedWithdrawal.amount,
        );
        expect(result2.currentFunds).toBe(result1.currentFunds + updatedFunds);
        expect(result2.withdrawal).toEqual(updatedWithdrawal.toJSON());
        expect(result2.oldWithdrawal).toEqual(validWithdrawal1);

        expect(result2.currentFunds).toBeGreaterThan(result1.currentFunds);

        expect(updateWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(2);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(2);
      });

      test('throws an error if body is not an object', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: undefined,
        } as unknown as Request;

        const updateWithdrawalSpy = jest.spyOn(service, 'updateWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.updateWithdrawal(req1)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(updateWithdrawalSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if body cannot be parsed into a WithdrawalTransaction', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            withdrawal: {},
          },
        } as unknown as Request;

        const updateWithdrawalSpy = jest.spyOn(service, 'updateWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.updateWithdrawal(req1)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(updateWithdrawalSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if the amount is lte zero', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const withdrawal = {
          ...validWithdrawal1,
          amount: 0,
        };

        const req1 = {
          body: {
            withdrawal,
          },
        } as unknown as Request;

        const updateWithdrawalSpy = jest.spyOn(service, 'updateWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.updateWithdrawal(req1)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(updateWithdrawalSpy).not.toHaveBeenCalled();
        expect(getBudgetSpy).not.toHaveBeenCalled();
        expect(updateBudgetSpy).not.toHaveBeenCalled();
      });

      test('throws an error if updateWithdrawal throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            withdrawal: validWithdrawal1,
          },
        } as unknown as Request;

        const updateWithdrawalSpy = jest.spyOn(service, 'updateWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        updateWithdrawalSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.updateWithdrawal(req1)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(updateWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if getBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            withdrawal: validWithdrawal1,
          },
        } as unknown as Request;

        const updateWithdrawalSpy = jest.spyOn(service, 'updateWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        updateWithdrawalSpy.mockResolvedValue(withdrawal1);
        getBudgetSpy.mockRejectedValueOnce(new Error('Test Error'));

        await expect(() => controller.updateWithdrawal(req1)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(updateWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if updateBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            withdrawal: validWithdrawal1,
          },
        } as unknown as Request;

        const updateWithdrawalSpy = jest.spyOn(service, 'updateWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        updateWithdrawalSpy.mockResolvedValue(withdrawal1);
        getBudgetSpy.mockResolvedValueOnce(budget);
        updateBudgetSpy.mockRejectedValueOnce(new Error('Test Error'));

        await expect(() => controller.updateWithdrawal(req1)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(updateWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('deleteWithdrawal', () => {
      test('updates the budget by removing the withdrawal and updating the current funds', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req1 = {
          body: {
            withdrawal: validWithdrawal1,
          },
        } as unknown as Request;

        uuidv4.mockImplementation(() => withdrawalId);

        const result1 = await controller.addWithdrawal(req1);
        expect(result1.currentFunds).toBe(
          budget.currentFunds - validWithdrawal1.amount,
        );

        const deleteWithdrawalSpy = jest.spyOn(service, 'deleteWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const req2 = {
          body: {
            withdrawalId,
          },
        } as unknown as Request;

        const result = await controller.deleteWithdrawal(req2);

        expect(result.currentFunds).toBe(budget.currentFunds);
        expect(result.withdrawal).toEqual(validWithdrawal1);

        expect(result.currentFunds).toBe(
          result1.currentFunds + validWithdrawal1.amount,
        );

        expect(deleteWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(deleteWithdrawalSpy).toHaveBeenCalledWith(withdrawalId);

        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledWith(budgetId);

        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledWith(
          Budget.fromJSON({
            ...budget.toJSON(),
            currentFunds: budget.currentFunds,
          }),
        );
      });

      test('throws an error if body is not an object', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: undefined,
        } as unknown as Request;

        const deleteWithdrawalSpy = jest.spyOn(service, 'deleteWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.deleteWithdrawal(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(deleteWithdrawalSpy).toHaveBeenCalledTimes(0);
        expect(getBudgetSpy).toHaveBeenCalledTimes(0);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if depositId is not a string', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            withdrawalId: 1,
          },
        } as unknown as Request;

        const deleteWithdrawalSpy = jest.spyOn(service, 'deleteWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        await expect(() => controller.deleteWithdrawal(req)).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(deleteWithdrawalSpy).toHaveBeenCalledTimes(0);
        expect(getBudgetSpy).toHaveBeenCalledTimes(0);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if deleteWithdrawalSpy throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            withdrawalId,
          },
        } as unknown as Request;

        const deleteWithdrawalSpy = jest.spyOn(service, 'deleteWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        deleteWithdrawalSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.deleteWithdrawal(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(deleteWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(0);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if getBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            withdrawalId,
          },
        } as unknown as Request;

        const deleteWithdrawalSpy = jest.spyOn(service, 'deleteWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        deleteWithdrawalSpy.mockResolvedValueOnce(withdrawal1);
        getBudgetSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.deleteWithdrawal(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(deleteWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if updateBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });
        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          body: {
            withdrawalId,
          },
        } as unknown as Request;

        const deleteWithdrawalSpy = jest.spyOn(service, 'deleteWithdrawal');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        deleteWithdrawalSpy.mockResolvedValueOnce(withdrawal1);
        getBudgetSpy.mockResolvedValueOnce(budget);
        updateBudgetSpy.mockRejectedValue(new Error('Test Error'));

        await expect(() => controller.deleteWithdrawal(req)).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(deleteWithdrawalSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('reconciliations', () => {
    describe('getReconciliations', () => {
      test('gets reconciliation from the BudgetService', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const loggerService = new LoggerService();

        const controller = new BudgetController(service, loggerService);

        const req = {
          query: {
            budgetId,
          },
        } as unknown as Request;

        const response = await controller.getReconciliations(req);

        expect(response.reconciliations).toHaveLength(2);
        expect(response.reconciliations).toEqual([
          validReconciliation2,
          validReconciliation1,
        ]);
      });

      test('throws an error if the budgetId or dates are missing or not a valid string', async () => {});

      test('throws an error if getReconciliations throws an error', async () => {});
    });

    describe('addReconciliation', () => {
      test('adds a reconciliation, calculates the balance, and returns the deposit', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
        });

        const loggerService = new LoggerService();
        const controller = new BudgetController(service, loggerService);

        uuidv4.mockImplementation(() => reconciliationId);

        const req = {
          body: {
            reconciliation: validReconciliation1,
          },
        } as unknown as Request;

        const addReconciliationSpy = jest.spyOn(service, 'addReconciliation');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const recalcSpy = jest.spyOn(service, 'recalculateFunds');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const res = await controller.addReconciliation(req);

        expect(res.reconciliation).toEqual(validReconciliation1);

        expect(addReconciliationSpy).toHaveBeenCalledTimes(1);
        expect(addReconciliationSpy).toHaveBeenCalledWith(reconciliation1);

        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledWith(budgetId);

        expect(recalcSpy).toHaveBeenCalledTimes(1);
        expect(recalcSpy).toHaveBeenCalledWith({ budgetId: budgetId });

        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledWith(
          Budget.fromJSON({
            ...validBudget1,
            currentFunds: reconciliation1.balance,
          }),
        );
      });

      test('takes into account deposits and withdrawals that happen after the reconciliation', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
        });

        const loggerService = new LoggerService();
        const controller = new BudgetController(service, loggerService);

        uuidv4.mockImplementation(() => reconciliationId);

        const req = {
          body: {
            reconciliation: validReconciliation1,
          },
        } as unknown as Request;

        const addReconciliationSpy = jest.spyOn(service, 'addReconciliation');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const recalcSpy = jest.spyOn(service, 'recalculateFunds');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const res = await controller.addReconciliation(req);

        expect(res.reconciliation).toEqual(validReconciliation1);

        expect(addReconciliationSpy).toHaveBeenCalledTimes(1);
        expect(addReconciliationSpy).toHaveBeenCalledWith(reconciliation1);

        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledWith(budgetId);

        expect(recalcSpy).toHaveBeenCalledTimes(1);
        expect(recalcSpy).toHaveBeenCalledWith({ budgetId: budgetId });

        const currentFunds =
          reconciliation1.balance + deposit2.amount - withdrawal2.amount;

        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledWith(
          Budget.fromJSON({
            ...validBudget1,
            currentFunds,
          }),
        );
      });

      test('adds a deposit to a budget with existing deposits, calculates the balance, and returns the deposit', async () => {});
      test('throws an error if body is not an object', async () => {});
      test('throws an error if body cannot be parsed into a DepositTransaction', async () => {});
      test('throws an error if addDeposit throws an error', async () => {});
      test('throws an error if addDeposit throws an error', async () => {});
    });

    describe('deleteReconciliation', () => {
      test('deletes the reconciliation, recalculates funds and updates the budget', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          reconciliations: [reconciliation1],
        });

        const loggerService = new LoggerService();
        const controller = new BudgetController(service, loggerService);

        const delSpy = jest.spyOn(service, 'deleteReconciliation');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const recalcSpy = jest.spyOn(service, 'recalculateFunds');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const req = {
          body: {
            reconciliationId: reconciliation1.id,
          },
        } as unknown as Request;

        const res = await controller.deleteReconciliation(req);

        expect(res.reconciliation).toEqual(validReconciliation1);

        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(delSpy).toHaveBeenCalledWith(reconciliation1.id);

        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledWith(budgetId);

        expect(recalcSpy).toHaveBeenCalledTimes(1);
        expect(recalcSpy).toHaveBeenCalledWith({ budgetId });

        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledWith(
          Budget.fromJSON({
            ...validBudget1,
            currentFunds: 0,
          }),
        );
      });

      test('takes into account earlier reconciliations, deposits, and withdrawals', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const loggerService = new LoggerService();
        const controller = new BudgetController(service, loggerService);

        const delSpy = jest.spyOn(service, 'deleteReconciliation');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const recalcSpy = jest.spyOn(service, 'recalculateFunds');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const req = {
          body: {
            reconciliationId: reconciliation2.id,
          },
        } as unknown as Request;

        const res = await controller.deleteReconciliation(req);

        expect(res.reconciliation).toEqual(validReconciliation2);

        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(delSpy).toHaveBeenCalledWith(reconciliation2.id);

        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledWith(budgetId);

        expect(recalcSpy).toHaveBeenCalledTimes(1);
        expect(recalcSpy).toHaveBeenCalledWith({ budgetId });

        const expectedFunds =
          reconciliation1.balance + deposit2.amount - withdrawal2.amount;

        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledWith(
          Budget.fromJSON({
            ...validBudget1,
            currentFunds: expectedFunds,
          }),
        );
      });

      test('throws an error if body is not an object', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();
        const controller = new BudgetController(service, loggerService);

        const delSpy = jest.spyOn(service, 'deleteReconciliation');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const recalcSpy = jest.spyOn(service, 'recalculateFunds');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const req = {
          body: undefined,
        } as unknown as Request;

        await expect(() =>
          controller.deleteReconciliation(req),
        ).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(delSpy).toHaveBeenCalledTimes(0);
        expect(getBudgetSpy).toHaveBeenCalledTimes(0);
        expect(recalcSpy).toHaveBeenCalledTimes(0);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if reconciliationId is not a string', async () => {
        const service = new InMemoryBudgetService();

        const loggerService = new LoggerService();
        const controller = new BudgetController(service, loggerService);

        const delSpy = jest.spyOn(service, 'deleteReconciliation');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const recalcSpy = jest.spyOn(service, 'recalculateFunds');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        const req = {
          body: {
            reconciliationId: 1,
          },
        } as unknown as Request;

        await expect(() =>
          controller.deleteReconciliation(req),
        ).rejects.toThrow(
          new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
        );

        expect(delSpy).toHaveBeenCalledTimes(0);
        expect(getBudgetSpy).toHaveBeenCalledTimes(0);
        expect(recalcSpy).toHaveBeenCalledTimes(0);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if deleteReconciliation throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const loggerService = new LoggerService();
        const controller = new BudgetController(service, loggerService);

        const delSpy = jest.spyOn(service, 'deleteReconciliation');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const recalcSpy = jest.spyOn(service, 'recalculateFunds');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        delSpy.mockRejectedValue(new Error('Test Error'));

        const req = {
          body: {
            reconciliationId: reconciliation1.id,
          },
        } as unknown as Request;

        await expect(() =>
          controller.deleteReconciliation(req),
        ).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(0);
        expect(recalcSpy).toHaveBeenCalledTimes(0);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if recalculateFunds throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const loggerService = new LoggerService();
        const controller = new BudgetController(service, loggerService);

        const delSpy = jest.spyOn(service, 'deleteReconciliation');
        const recalcSpy = jest.spyOn(service, 'recalculateFunds');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        recalcSpy.mockRejectedValue(new Error('Test Error'));

        const req = {
          body: {
            reconciliationId: reconciliation1.id,
          },
        } as unknown as Request;

        await expect(() =>
          controller.deleteReconciliation(req),
        ).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(recalcSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(0);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if getBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const loggerService = new LoggerService();
        const controller = new BudgetController(service, loggerService);

        const delSpy = jest.spyOn(service, 'deleteReconciliation');
        const recalcSpy = jest.spyOn(service, 'recalculateFunds');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        getBudgetSpy.mockRejectedValue(new Error('Test Error'));

        const req = {
          body: {
            reconciliationId: reconciliation1.id,
          },
        } as unknown as Request;

        await expect(() =>
          controller.deleteReconciliation(req),
        ).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(recalcSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(0);
      });

      test('throws an error if updateBudget throws an error', async () => {
        const service = new InMemoryBudgetService({
          budgets: [budget1, budget2],
          categories: [category1, category2],
          expenses: [expense1, expense2],
          deposits: [deposit1, deposit2],
          withdrawals: [withdrawal1, withdrawal2],
          reconciliations: [reconciliation1, reconciliation2],
        });

        const loggerService = new LoggerService();
        const controller = new BudgetController(service, loggerService);

        const delSpy = jest.spyOn(service, 'deleteReconciliation');
        const getBudgetSpy = jest.spyOn(service, 'getBudget');
        const recalcSpy = jest.spyOn(service, 'recalculateFunds');
        const updateBudgetSpy = jest.spyOn(service, 'updateBudget');

        updateBudgetSpy.mockRejectedValue(new Error('Test Error'));

        const req = {
          body: {
            reconciliationId: reconciliation1.id,
          },
        } as unknown as Request;

        await expect(() =>
          controller.deleteReconciliation(req),
        ).rejects.toThrow(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );

        expect(delSpy).toHaveBeenCalledTimes(1);
        expect(getBudgetSpy).toHaveBeenCalledTimes(1);
        expect(recalcSpy).toHaveBeenCalledTimes(1);
        expect(updateBudgetSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
