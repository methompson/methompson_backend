import {
  ExpenseTarget,
  ExpenseTargetJSON,
} from '@/src/budget/models/expense_target';
import { InvalidInputError } from '@/src/errors';
import { isNumber, isRecord, isString } from '@/src/utils/type_guards';

export interface ExpenseJSON {
  id: string;
  budgetId: string;
  categoryId: string;
  description: string;
  amount: number;
  expenseTarget: ExpenseTargetJSON;
}

// An Expense is money that is owed during a time period
export class Expense {
  constructor(
    protected _id: string,
    protected _budgetId: string,
    protected _categoryId: string,
    protected _description: string,
    protected _amount: number,
    protected _expenseTarget: ExpenseTarget,
  ) {}

  get id(): string {
    return this._id;
  }
  get budgetId(): string {
    return this._budgetId;
  }
  get categoryId(): string {
    return this._categoryId;
  }
  get description(): string {
    return this._description;
  }
  get amount(): number {
    return this._amount;
  }
  get expenseTarget(): ExpenseTarget {
    return this._expenseTarget;
  }

  toJSON(): ExpenseJSON {
    return {
      id: this.id,
      budgetId: this.budgetId,
      categoryId: this.categoryId,
      description: this.description,
      amount: this.amount,
      expenseTarget: this.expenseTarget.toJSON(),
    };
  }

  static fromNewExpense(id: string, input: Expense): Expense {
    return Expense.fromJSON({
      ...input.toJSON(),
      id,
    });
  }

  static fromJSON(input: unknown): Expense {
    if (!Expense.isExpenseJSON(input)) {
      const errors = Expense.expenseJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    const { id, budgetId, categoryId, description, amount, expenseTarget } =
      input;

    const target = ExpenseTarget.fromJSON(expenseTarget);

    return new Expense(id, budgetId, categoryId, description, amount, target);
  }

  static isExpenseJSON(input: unknown): input is ExpenseJSON {
    return Expense.expenseJSONTest(input).length === 0;
  }

  static expenseJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.budgetId)) output.push('budgetId');
    if (!isString(input.categoryId)) output.push('categoryId');
    if (!isString(input.description)) output.push('description');
    if (!isNumber(input.amount)) output.push('amount');
    if (!ExpenseTarget.isExpenseTargetJSON(input.expenseTarget))
      output.push('expenseTarget');

    return output;
  }
}
