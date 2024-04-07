import { Budget, BudgetJSON } from '@/src/budget/models/budget';
import { Category, CategoryJSON } from '@/src/budget/models/category';
import { Expense, ExpenseJSON } from '@/src/budget/models/expense';
import {
  ExpenseTarget,
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

describe('InMemoryBudgetService', () => {
  const userId = 'userId';
  const budgetId = 'budgetId';
  const budgetName = 'budgetName';

  const validBudget: BudgetJSON = {
    id: budgetId,
    userId,
    name: budgetName,
    currentFunds: 0,
  };

  const budget = Budget.fromJSON(validBudget);

  const validCategory: CategoryJSON = {
    id: 'categoryId',
    budgetId,
    name: 'Expense Category',
  };

  const category = Category.fromJSON(validCategory);

  const validTarget: ExpenseTargetJSON = {
    type: ExpenseTargetType.Monthly,
    data: { dayOfMonth: 15 },
  };

  const expenseId = 'expenseId';
  const expenseDescription = 'Expense';
  const expenseAmount = 100;

  const validExpense: ExpenseJSON = {
    id: expenseId,
    budgetId,
    categoryId: validCategory.id,
    description: expenseDescription,
    amount: expenseAmount,
    expenseTarget: validTarget,
  };

  const expense = Expense.fromJSON(validExpense);

  const validWithdrawal: WithdrawalTransactionJSON = {
    id: 'withdrawalId',
    budgetId,
    expenseId,
    description: 'Withdrawal',
    dateTime: '2024-01-25T12:00:00-06:00',
    amount: 25,
  };

  const withdrawal = WithdrawalTransaction.fromJSON(validWithdrawal);

  const validDeposit: DepositTransactionJSON = {
    id: 'depositId',
    budgetId,
    description: 'Deposit',
    dateTime: '2024-01-20T12:00:00-06:00',
    amount: 100,
  };

  const deposit = DepositTransaction.fromJSON(validDeposit);

  const validReconciliation: ReconciliationJSON = {
    id: 'reconciliationId',
    budgetId,
    date: '2024-01-22',
    balance: 300,
  };

  const reconciliation = Reconciliation.fromJSON(validReconciliation);

  describe('getBudgets', () => {
    test('returns an array of Budgets', async () => {
      const service = new InMemoryBudgetService({
        budgets: [budget],
      });

      const result = await service.getBudgets({ userId });
      expect(result.length).toBe(1);
      expect(result[0]?.toJSON()).toEqual(budget.toJSON());
    });

    test('returns paginated budgets if there are more budgets than the pagination', async () => {
      const budgets: Budget[] = [];
      for (let i = 0; i < 20; i++) {
        budgets.push(
          Budget.fromJSON({
            ...validBudget,
            id: i.toString(),
            name: 'Budget ' + `${i}`.padStart(2, '0'),
          }),
        );
      }

      const service = new InMemoryBudgetService({
        budgets,
      });

      const result1 = await service.getBudgets({
        userId,
        page: 1,
        pagination: 5,
      });

      expect(result1.length).toBe(5);
      expect(result1[0]?.toJSON()).toEqual(budgets[0]?.toJSON());
      expect(result1[1]?.toJSON()).toEqual(budgets[1]?.toJSON());
      expect(result1[2]?.toJSON()).toEqual(budgets[2]?.toJSON());
      expect(result1[3]?.toJSON()).toEqual(budgets[3]?.toJSON());
      expect(result1[4]?.toJSON()).toEqual(budgets[4]?.toJSON());

      const result2 = await service.getBudgets({
        userId,
        page: 2,
        pagination: 5,
      });

      expect(result2.length).toBe(5);
      expect(result2[0]?.toJSON()).toEqual(budgets[5]?.toJSON());
      expect(result2[1]?.toJSON()).toEqual(budgets[6]?.toJSON());
      expect(result2[2]?.toJSON()).toEqual(budgets[7]?.toJSON());
      expect(result2[3]?.toJSON()).toEqual(budgets[8]?.toJSON());
      expect(result2[4]?.toJSON()).toEqual(budgets[9]?.toJSON());
    });

    test('goes to the proper page if a page and pagination are provided', async () => {});

    test('returns an empty array if the page is beyond the range of budgets', async () => {});

    test('returns an empty array if there are no budgets', async () => {});

    test('returns an empty array if the user has no budgets', async () => {});
  });

  describe('getBudget', () => {});
  describe('addBudget', () => {});
  describe('updateBudget', () => {});
  describe('deleteBudget', () => {});

  describe('getCategories', () => {
    test('returns an array of categories', async () => {
      const service = new InMemoryBudgetService({
        categories: [category],
      });

      const result = await service.getCategories({ budgetId });
      expect(result.length).toBe(1);
      expect(result[0]?.toJSON()).toEqual(category.toJSON());
    });

    test('returns paginated categories if there are more categories than the pagination', async () => {});

    test('goes to the proper page if a page and pagination are provided', async () => {});

    test('returns an empty array if the page is beyond the range of categories', async () => {});

    test('returns an empty array if there are no categories', async () => {});

    test('returns an empty array if the user has no categories', async () => {});
  });

  describe('getCategory', () => {});
  describe('addCategory', () => {});
  describe('updateCategory', () => {});
  describe('deleteCategory', () => {});

  describe('getExpenses', () => {
    test('returns an array of expenses', async () => {
      const service = new InMemoryBudgetService({
        expenses: [expense],
      });

      const result = await service.getExpenses({ budgetId });
      expect(result.length).toBe(1);
      expect(result[0]?.toJSON()).toEqual(expense.toJSON());
    });

    test('returns paginated expenses if there are more expenses than the pagination', async () => {});

    test('goes to the proper page if a page and pagination are provided', async () => {});

    test('returns an empty array if the page is beyond the range of expenses', async () => {});

    test('returns an empty array if there are no expenses', async () => {});

    test('returns an empty array if the user has no expenses', async () => {});
  });

  describe('getExpense', () => {});
  describe('addExpense', () => {});
  describe('updateExpense', () => {});
  describe('deleteExpense', () => {});

  describe('getDeposits', () => {
    test('returns an array of expenses', async () => {
      const service = new InMemoryBudgetService({
        deposits: [deposit],
      });

      const result = await service.getDeposits({
        budgetId,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      expect(result.length).toBe(1);
      expect(result[0]?.toJSON()).toEqual(deposit.toJSON());
    });

    test('returns paginated expenses if there are more expenses than the pagination', async () => {});

    test('goes to the proper page if a page and pagination are provided', async () => {});

    test('returns an empty array if the page is beyond the range of expenses', async () => {});

    test('returns an empty array if there are no expenses', async () => {});

    test('returns an empty array if the user has no expenses', async () => {});
  });

  describe('getDeposit', () => {});
  describe('addDeposit', () => {});
  describe('updateDeposit', () => {});
  describe('deleteDeposit', () => {});

  describe('getWithdrawals', () => {
    test('returns an array of expenses', async () => {
      const service = new InMemoryBudgetService({
        withdrawals: [withdrawal],
      });

      const result = await service.getWithdrawals({
        budgetId,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      expect(result.length).toBe(1);
      expect(result[0]?.toJSON()).toEqual(withdrawal.toJSON());
    });

    test('returns paginated expenses if there are more expenses than the pagination', async () => {});

    test('goes to the proper page if a page and pagination are provided', async () => {});

    test('returns an empty array if the page is beyond the range of expenses', async () => {});

    test('returns an empty array if there are no expenses', async () => {});

    test('returns an empty array if the user has no expenses', async () => {});
  });

  describe('getWithdrawal', () => {});
  describe('addWithdrawal', () => {});
  describe('updateWithdrawal', () => {});
  describe('deleteWithdrawal', () => {});

  describe('getReconciliations', () => {
    test('returns an array of expenses', async () => {
      const service = new InMemoryBudgetService({
        reconciliations: [reconciliation],
      });

      const result = await service.getReconciliations({ budgetId });
      expect(result.length).toBe(1);
      expect(result[0]?.toJSON()).toEqual(reconciliation.toJSON());
    });

    test('returns paginated expenses if there are more expenses than the pagination', async () => {});

    test('goes to the proper page if a page and pagination are provided', async () => {});

    test('returns an empty array if the page is beyond the range of expenses', async () => {});

    test('returns an empty array if there are no expenses', async () => {});

    test('returns an empty array if the user has no expenses', async () => {});
  });

  describe('addRecociliation', () => {});
  describe('deleteReconciliation', () => {});

  describe('recalcFunds', () => {
    test('returns 0 if there are no transactions or reconciliations', async () => {
      const service = new InMemoryBudgetService({
        budgets: [budget],
      });

      const result = await service.recalcFunds({ budgetId });
      expect(result).toBe(0);
    });

    test('returns the sum of all transactions if there are no reconciliations', async () => {
      const service = new InMemoryBudgetService({
        budgets: [budget],
        deposits: [deposit],
        withdrawals: [withdrawal],
      });

      const result = await service.recalcFunds({ budgetId });

      expect(result).toBe(deposit.amount - withdrawal.amount);
    });

    test('returns all transactions up to the reconciliation date if there are reconciliations', async () => {
      const service = new InMemoryBudgetService({
        budgets: [budget],
        deposits: [deposit],
        withdrawals: [withdrawal],
        reconciliations: [reconciliation],
      });

      const result = await service.recalcFunds({ budgetId });

      expect(result).toBe(reconciliation.balance - withdrawal.amount);
    });
  });
});
