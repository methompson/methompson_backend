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

describe('Budget Controller', () => {
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
    test('adds a budget using the ActionsService', async () => {});

    test('throws an error if the body is not a record', async () => {});

    test('throws an error if the body cannot be parsed', async () => {});

    test('throws an error if addAction throws an error', async () => {});
  });

  describe('updateBudget', () => {
    test('updates a budget using the ActionsService', async () => {});

    test('throws an error if the body is not a record', async () => {});

    test('throws an error if the body cannot be parsed', async () => {});

    test('throws an error if updateAction throws an error', async () => {});
  });

  describe('deleteBudget', () => {
    test('deletes a budget using the ActionsService', async () => {});

    test('throws an error if the userId is not a string', async () => {});

    test('throws an error if deleteAction throws an error', async () => {});
  });

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

  describe('addCategory', () => {});
  describe('updateCategory', () => {});
  describe('deleteCategory', () => {});

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

  describe('addExpense', () => {});
  describe('updateExpense', () => {});
  describe('deleteExpense', () => {});

  describe('getDeposits', () => {
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

  describe('addDeposit', () => {});
  describe('updateDeposit', () => {});
  describe('deleteDeposit', () => {});

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

  describe('addWithdrawal', () => {});
  describe('updateWithdrawal', () => {});
  describe('deleteWithdrawal', () => {});
});
