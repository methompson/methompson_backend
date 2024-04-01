import { ExpenseTarget } from '@/src/models/budget/expense_target';

export interface ExpenseJSON {
  id: string;
  budgetId: string;
  categoryId: string;
  description: string;
  amount: number;
  target: Record<string, unknown>;
}

// An Expense is money that is owed during a time period
export class Expense {
  constructor(
    protected _id: string,
    protected _budgetId: string,
    protected _categoryId: string,
    protected _description: string,
    protected _amount: number,
    protected _target: ExpenseTarget,
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
  get target(): ExpenseTarget {
    return this._target;
  }
}
