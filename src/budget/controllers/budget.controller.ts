import {
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { BudgetService } from '@/src/budget/services/budget.service';
import { LoggerService } from '@/src/logger/logger.service';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import {
  isRecord,
  isString,
  isValidDateTimeString,
} from '@/src/utils/type_guards';
import { InvalidInputError } from '@/src/errors';
import { commonErrorHandler } from '@/src/utils/common_error_handler';
import { Budget, BudgetJSON } from '@/src/budget/models/budget';
import { Category, CategoryJSON } from '@/src/budget/models/category';
import { Expense, ExpenseJSON } from '@/src/budget/models/expense';
import {
  WithdrawalTransaction,
  WithdrawalTransactionJSON,
} from '@/src/budget/models/withdrawal_transaction';
import {
  DepositTransaction,
  DepositTransactionJSON,
} from '@/src/budget/models/deposit_transaction';

interface GetBudgetsResponse {
  budgets: BudgetJSON[];
}
interface AddBudgetResponse {
  budget: BudgetJSON;
}
interface UpdateBudgetResponse {
  budget: BudgetJSON;
  oldBudget: BudgetJSON;
}
interface DeleteBudgetResponse {
  budget: BudgetJSON;
}

interface GetCategoriesResponse {
  categories: CategoryJSON[];
}
interface AddCategoryResponse {
  category: CategoryJSON;
}
interface UpdateCategoryResponse {
  category: CategoryJSON;
  oldCategory: CategoryJSON;
}
interface DeleteCategoryResponse {
  category: CategoryJSON;
}

interface GetExpensesResponse {
  expenses: ExpenseJSON[];
}
interface AddExpenseResponse {
  expense: ExpenseJSON;
}
interface UpdateExpenseResponse {
  expense: ExpenseJSON;
  oldExpense: ExpenseJSON;
}
interface DeleteExpenseResponse {
  expense: ExpenseJSON;
}

interface GetDepositsResponse {
  deposits: DepositTransactionJSON[];
}
interface AddDepositResponse {
  deposit: DepositTransactionJSON;
  currentFunds: number;
}
interface UpdateDepositResponse {
  deposit: DepositTransactionJSON;
  oldDeposit: DepositTransactionJSON;
  currentFunds: number;
}
interface DeleteDepositResponse {
  deposit: DepositTransactionJSON;
  currentFunds: number;
}

interface GetWithdrawalsResponse {
  withdrawals: WithdrawalTransactionJSON[];
}
interface AddWithdrawalResponse {
  withdrawal: WithdrawalTransactionJSON;
  currentFunds: number;
}
interface UpdateWithdrawalResponse {
  withdrawal: WithdrawalTransactionJSON;
  oldWithdrawal: WithdrawalTransactionJSON;
  currentFunds: number;
}
interface DeleteWithdrawalResponse {
  withdrawal: WithdrawalTransactionJSON;
  currentFunds: number;
}

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/budget' })
export class BudgetController {
  constructor(
    @Inject('BUDGET_SERVICE')
    private readonly budgetService: BudgetService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get('budgets')
  async getBudgets(@Req() request: Request): Promise<GetBudgetsResponse> {
    const { page, pagination } = pageAndPagination(request);

    const userId = request.query?.userId;

    try {
      if (!isString(userId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      const budgets = (
        await this.budgetService.getBudgets({
          page,
          pagination,
          userId,
        })
      ).map((action) => action.toJSON());

      return { budgets };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addBudget')
  async addBudget(@Req() request: Request): Promise<AddBudgetResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Budget Input');
      }

      const budget = Budget.fromJSON(body.budget);

      const res = await this.budgetService.addBudget(budget);

      return { budget: res.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateBudget')
  async updateBudget(@Req() request: Request): Promise<UpdateBudgetResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Budget Input');
      }

      const budget = Budget.fromJSON(body.budget);

      const res = await this.budgetService.updateBudget(budget);

      return { oldBudget: res.toJSON(), budget: budget.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteBudget')
  async deleteBudget(@Req() request: Request): Promise<DeleteBudgetResponse> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.budgetId)) {
        throw new InvalidInputError('Invalid Budget Input');
      }

      const res = await this.budgetService.deleteBudget(body.budgetId);

      return { budget: res.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Get('categories')
  async getCategories(@Req() request: Request): Promise<GetCategoriesResponse> {
    const { page, pagination } = pageAndPagination(request);

    try {
      const budgetId = request.query?.budgetId;

      if (!isString(budgetId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      const categories = (
        await this.budgetService.getCategories({
          page,
          pagination,
          budgetId,
        })
      ).map((action) => action.toJSON());

      return { categories };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addCategory')
  async addCategory(@Req() request: Request): Promise<AddCategoryResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Category Input');
      }

      const category = Category.fromJSON(body.category);

      const res = await this.budgetService.addCategory(category);

      return { category: res.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateCategory')
  async updateCategory(
    @Req() request: Request,
  ): Promise<UpdateCategoryResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Category Input');
      }

      const category = Category.fromJSON(body.category);

      const res = await this.budgetService.updateCategory(category);

      return { oldCategory: res.toJSON(), category: category.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteCategory')
  async deleteCategory(
    @Req() request: Request,
  ): Promise<DeleteCategoryResponse> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.categoryId)) {
        throw new InvalidInputError('Invalid Category Input');
      }

      const res = await this.budgetService.deleteCategory(body.categoryId);

      return { category: res.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Get('expenses')
  async getExpenses(@Req() request: Request): Promise<GetExpensesResponse> {
    const { page, pagination } = pageAndPagination(request);

    try {
      const budgetId = request.query?.budgetId;

      if (!isString(budgetId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      const expenses = (
        await this.budgetService.getExpenses({
          page,
          pagination,
          budgetId,
        })
      ).map((action) => action.toJSON());

      return { expenses };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addExpense')
  async addExpense(@Req() request: Request): Promise<AddExpenseResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Expense Input');
      }

      const expense = Expense.fromJSON(body.expense);

      const res = await this.budgetService.addExpense(expense);

      return { expense: res.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateExpense')
  async updateExpense(@Req() request: Request): Promise<UpdateExpenseResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Expense Input');
      }

      const expense = Expense.fromJSON(body.expense);

      const res = await this.budgetService.updateExpense(expense);

      return { oldExpense: res.toJSON(), expense: expense.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteExpense')
  async deleteExpense(@Req() request: Request): Promise<DeleteExpenseResponse> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.expenseId)) {
        throw new InvalidInputError('Invalid Expense Input');
      }

      const res = await this.budgetService.deleteExpense(body.expenseId);

      return { expense: res.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Get('deposits')
  async getDeposits(@Req() request: Request): Promise<GetDepositsResponse> {
    const { page, pagination } = pageAndPagination(request);

    try {
      if (!isRecord(request.query)) {
        throw new InvalidInputError('Invalid Query');
      }

      const { budgetId, startDate, endDate } = request.query;

      if (!isString(budgetId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      if (
        !isValidDateTimeString(startDate) ||
        !isValidDateTimeString(endDate)
      ) {
        throw new InvalidInputError('Invalid Dates');
      }

      const deposits = (
        await this.budgetService.getDeposits({
          page,
          pagination,
          budgetId,
          startDate,
          endDate,
        })
      ).map((action) => action.toJSON());

      return { deposits };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addDeposit')
  async addDeposit(@Req() request: Request): Promise<AddDepositResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Deposit Input');
      }

      const depositToAdd = DepositTransaction.fromJSON(body.deposit);

      if (depositToAdd.amount <= 0) {
        throw new InvalidInputError('Invalid Deposit Amount');
      }

      const [deposit, budget] = await Promise.all([
        this.budgetService.addDeposit(depositToAdd),
        this.budgetService.getBudget(depositToAdd.budgetId),
      ]);

      const addedFunds = deposit.amount;
      const updatedBudget = budget.updateFunds(addedFunds);

      await this.budgetService.updateBudget(updatedBudget);

      return {
        deposit: deposit.toJSON(),
        currentFunds: updatedBudget.currentFunds,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateDeposit')
  async updateDeposit(@Req() request: Request): Promise<UpdateDepositResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Deposit Input');
      }

      const depositToUpdate = DepositTransaction.fromJSON(body.deposit);

      if (depositToUpdate.amount <= 0) {
        throw new InvalidInputError('Invalid Deposit Amount');
      }

      const [deposit, budget] = await Promise.all([
        this.budgetService.updateDeposit(depositToUpdate),
        this.budgetService.getBudget(depositToUpdate.budgetId),
      ]);

      // If update is less than the original amount, fundsDif will be positive and we need
      // to add it to the current funds. If update is more than the original amount, fundsDif
      // will be negative and we need to subtract it from the current funds.
      const fundsDif = depositToUpdate.amount - deposit.amount;
      const updatedBudget = budget.updateFunds(fundsDif);

      await this.budgetService.updateBudget(updatedBudget);

      return {
        oldDeposit: deposit.toJSON(),
        deposit: depositToUpdate.toJSON(),
        currentFunds: updatedBudget.currentFunds,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteDeposit')
  async deleteDeposit(@Req() request: Request): Promise<DeleteDepositResponse> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.depositId)) {
        throw new InvalidInputError('Invalid Deposit Input');
      }

      const res = await this.budgetService.deleteDeposit(body.depositId);

      const budget = await this.budgetService.getBudget(res.budgetId);
      const updatedBudget = budget.updateFunds(-res.amount);

      await this.budgetService.updateBudget(updatedBudget);

      return {
        deposit: res.toJSON(),
        currentFunds: updatedBudget.currentFunds,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Get('withdrawals')
  async getWithdrawals(
    @Req() request: Request,
  ): Promise<GetWithdrawalsResponse> {
    const { page, pagination } = pageAndPagination(request);

    try {
      if (!isRecord(request.query)) {
        throw new InvalidInputError('Invalid Query');
      }

      const { budgetId, startDate, endDate } = request.query;

      if (!isString(budgetId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      if (
        !isValidDateTimeString(startDate) ||
        !isValidDateTimeString(endDate)
      ) {
        throw new InvalidInputError('Invalid Dates');
      }

      const withdrawals = (
        await this.budgetService.getWithdrawals({
          page,
          pagination,
          budgetId,
          startDate,
          endDate,
        })
      ).map((action) => action.toJSON());

      return { withdrawals };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addWithdrawal')
  async addWithdrawal(@Req() request: Request): Promise<AddWithdrawalResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Withdrawal Input');
      }

      const withdrawalToAdd = WithdrawalTransaction.fromJSON(body.withdrawal);

      if (withdrawalToAdd.amount <= 0) {
        throw new InvalidInputError('Invalid Deposit Amount');
      }

      const [withdrawal, budget] = await Promise.all([
        this.budgetService.addWithdrawal(withdrawalToAdd),
        this.budgetService.getBudget(withdrawalToAdd.budgetId),
      ]);

      const addedFunds = -withdrawal.amount;
      const updatedBudget = budget.updateFunds(addedFunds);

      await this.budgetService.updateBudget(updatedBudget);

      return {
        withdrawal: withdrawal.toJSON(),
        currentFunds: updatedBudget.currentFunds,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateWithdrawal')
  async updateWithdrawal(
    @Req() request: Request,
  ): Promise<UpdateWithdrawalResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Withdrawal Input');
      }

      const withdrawalToUpdate = WithdrawalTransaction.fromJSON(
        body.withdrawal,
      );

      if (withdrawalToUpdate.amount <= 0) {
        throw new InvalidInputError('Invalid Deposit Amount');
      }

      const [withdrawal, budget] = await Promise.all([
        this.budgetService.updateWithdrawal(withdrawalToUpdate),
        this.budgetService.getBudget(withdrawalToUpdate.budgetId),
      ]);

      // If update is less than the original amount, fundsDif will be positive and we need
      // to add it to the current funds. If update is more than the original amount, fundsDif
      // will be negative and we need to subtract it from the current funds.
      const fundsDif = withdrawalToUpdate.amount - withdrawal.amount;
      const updatedBudget = budget.updateFunds(-fundsDif);

      await this.budgetService.updateBudget(updatedBudget);

      return {
        oldWithdrawal: withdrawal.toJSON(),
        withdrawal: withdrawalToUpdate.toJSON(),
        currentFunds: updatedBudget.currentFunds,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteWithdrawal')
  async deleteWithdrawal(
    @Req() request: Request,
  ): Promise<DeleteWithdrawalResponse> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.withdrawalId)) {
        throw new InvalidInputError('Invalid Withdrawal Input');
      }

      const withdrawal = await this.budgetService.deleteWithdrawal(
        body.withdrawalId,
      );
      const budget = await this.budgetService.getBudget(withdrawal.budgetId);

      const updatedBudget = budget.updateFunds(withdrawal.amount);
      await this.budgetService.updateBudget(updatedBudget);

      return {
        withdrawal: withdrawal.toJSON(),
        currentFunds: updatedBudget.currentFunds,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  // TODO Reconciliations
}
